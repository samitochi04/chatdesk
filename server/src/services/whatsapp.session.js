const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const path = require("path");
const { supabaseAdmin } = require("../config/supabase");
const logger = require("../utils/logger");

/**
 * In-memory map of active WhatsApp client sessions.
 * Key: whatsappAccountId (uuid)
 * Value: { client, orgId, phoneNumber, status }
 */
const sessions = new Map();

/**
 * Returns the live session object for a given WhatsApp account id.
 */
function getSession(accountId) {
  return sessions.get(accountId) || null;
}

/**
 * Returns a shallow snapshot of all active sessions (for health/status endpoints).
 */
function getAllSessions() {
  const result = [];
  for (const [id, s] of sessions) {
    result.push({
      id,
      orgId: s.orgId,
      phoneNumber: s.phoneNumber,
      status: s.status,
    });
  }
  return result;
}

/**
 * Update the WhatsApp account status in the database.
 */
async function updateAccountStatus(accountId, status, extra = {}) {
  const update = { status, ...extra };
  if (status === "connected")
    update.last_connected_at = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("whatsapp_accounts")
    .update(update)
    .eq("id", accountId);

  if (error)
    logger.error(
      `Failed to update WA account ${accountId} status: ${error.message}`,
    );
}

/**
 * Persist session data to the database so it survives restarts.
 */
async function persistSessionData(accountId, sessionData) {
  const { error } = await supabaseAdmin
    .from("whatsapp_accounts")
    .update({ session_data: sessionData })
    .eq("id", accountId);

  if (error)
    logger.error(
      `Failed to persist session data for ${accountId}: ${error.message}`,
    );
}

/**
 * Creates and initializes a whatsapp-web.js Client for a given account.
 *
 * @param {object} account - Row from whatsapp_accounts table
 * @param {function} onMessage - Callback invoked with (client, message, account) on incoming messages
 * @returns {{ client, qrPromise }} — qrPromise resolves with the data-URI QR when generated
 */
function createSession(account, onMessage) {
  const {
    id: accountId,
    organization_id: orgId,
    phone_number: phoneNumber,
  } = account;

  if (sessions.has(accountId)) {
    logger.warn(
      `Session already exists for account ${accountId}, destroying old one first`,
    );
    destroySession(accountId);
  }

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: accountId,
      dataPath: path.join(process.cwd(), "whatsapp-sessions"),
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
      ],
    },
  });

  const sessionEntry = {
    client,
    orgId,
    phoneNumber,
    status: "pending",
    qrDataUrl: null,
  };
  sessions.set(accountId, sessionEntry);

  // QR code event — resolve promise so the controller can return it
  let qrResolve;
  const qrPromise = new Promise((resolve) => {
    qrResolve = resolve;
  });

  client.on("qr", async (qr) => {
    logger.info(`QR received for account ${accountId}`);
    try {
      const dataUrl = await qrcode.toDataURL(qr);
      sessionEntry.qrDataUrl = dataUrl;
      qrResolve(dataUrl);

      // Also persist to DB so the dashboard can poll it
      await supabaseAdmin
        .from("whatsapp_accounts")
        .update({ qr_code: dataUrl, status: "pending" })
        .eq("id", accountId);
    } catch (err) {
      logger.error(`QR generation error for ${accountId}: ${err.message}`);
      qrResolve(null);
    }
  });

  client.on("ready", async () => {
    logger.info(`WhatsApp ready for account ${accountId} (${phoneNumber})`);
    sessionEntry.status = "connected";
    sessionEntry.qrDataUrl = null;
    await updateAccountStatus(accountId, "connected", { qr_code: null });
  });

  client.on("authenticated", async () => {
    logger.info(`WhatsApp authenticated for account ${accountId}`);
    // Session data is auto-saved by LocalAuth; we additionally save a flag
    await persistSessionData(accountId, {
      authenticated: true,
      ts: Date.now(),
    });
  });

  client.on("auth_failure", async (msg) => {
    logger.error(`Auth failure for account ${accountId}: ${msg}`);
    sessionEntry.status = "disconnected";
    await updateAccountStatus(accountId, "disconnected");
  });

  client.on("disconnected", async (reason) => {
    logger.warn(`WhatsApp disconnected for account ${accountId}: ${reason}`);
    sessionEntry.status = "disconnected";
    await updateAccountStatus(accountId, "disconnected");
    sessions.delete(accountId);
  });

  // Incoming messages
  client.on("message", async (message) => {
    try {
      await onMessage(client, message, account);
    } catch (err) {
      logger.error(
        `Error handling incoming message for ${accountId}: ${err.message}`,
      );
    }
  });

  // Message acknowledgement (delivery / read receipts)
  client.on("message_ack", async (message, ack) => {
    // ack: 0 = pending, 1 = sent (server), 2 = delivered, 3 = read, 4 = played
    try {
      const statusMap = { 1: "sent", 2: "delivered", 3: "read", 4: "read" };
      const newStatus = statusMap[ack];
      if (!newStatus || !message.id || !message.id._serialized) return;

      await supabaseAdmin
        .from("messages")
        .update({ status: newStatus })
        .eq("whatsapp_message_id", message.id._serialized);
    } catch (err) {
      logger.error(
        `Error handling message_ack for ${accountId}: ${err.message}`,
      );
    }
  });

  // Initialize (connect)
  client.initialize().catch((err) => {
    logger.error(`Client init failed for ${accountId}: ${err.message}`);
    sessionEntry.status = "disconnected";
    updateAccountStatus(accountId, "disconnected");
  });

  return { client, qrPromise };
}

/**
 * Gracefully destroy a session.
 */
async function destroySession(accountId) {
  const session = sessions.get(accountId);
  if (!session) return;

  try {
    await session.client.destroy();
  } catch (err) {
    logger.warn(`Error destroying client for ${accountId}: ${err.message}`);
  }
  sessions.delete(accountId);
  await updateAccountStatus(accountId, "disconnected", { qr_code: null });
  logger.info(`Session destroyed for account ${accountId}`);
}

/**
 * Boot sessions for all accounts that were previously connected.
 * Called once on server startup.
 */
async function restoreAllSessions(onMessage) {
  const { data: accounts, error } = await supabaseAdmin
    .from("whatsapp_accounts")
    .select("*")
    .in("status", ["connected", "pending"]);

  if (error) {
    logger.error(`Failed to load WA accounts for restore: ${error.message}`);
    return;
  }

  if (!accounts || accounts.length === 0) {
    logger.info("No WhatsApp sessions to restore");
    return;
  }

  logger.info(`Restoring ${accounts.length} WhatsApp session(s)...`);
  for (const account of accounts) {
    try {
      createSession(account, onMessage);
    } catch (err) {
      logger.error(
        `Failed to restore session for ${account.id}: ${err.message}`,
      );
    }
  }
}

module.exports = {
  sessions,
  getSession,
  getAllSessions,
  createSession,
  destroySession,
  restoreAllSessions,
  updateAccountStatus,
};
