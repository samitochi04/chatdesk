const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  downloadMediaMessage,
  fetchLatestBaileysVersion,
  Browsers,
  getContentType,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode");
const path = require("path");
const fs = require("fs");
const { supabaseAdmin } = require("../config/supabase");
const { handleBroadcastAck } = require("./broadcast.service");
const logger = require("../utils/logger");

const sessions = new Map();
const creatingLocks = new Set();

const BASE_RECONNECT_DELAY = 5000;
const MAX_RECONNECT_DELAY = 120000;
const SOCKET_KEEPALIVE_MS = 20 * 1000;
const PRESENCE_HEARTBEAT_MS = 2 * 60 * 1000;
const WATCHDOG_CHECK_MS = 60 * 1000;
const STALE_SOCKET_MS = 5 * 60 * 1000;
const QR_TIMEOUT_MS = 120000;

const baileysLogger = pino({ level: "silent" });

function getSession(accountId) {
  return sessions.get(accountId) || null;
}

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

function getAuthDir(accountId) {
  return path.join(process.cwd(), "whatsapp-sessions", `session-${accountId}`);
}

/**
 * Create a Baileys socket session for a WhatsApp account.
 */
async function createSession(account, onMessage, opts = {}) {
  const {
    id: accountId,
    organization_id: orgId,
    phone_number: phoneNumber,
  } = account;

  if (creatingLocks.has(accountId)) {
    logger.warn(`Session creation already in progress for ${accountId}`);
    const existing = sessions.get(accountId);
    if (existing)
      return {
        sock: existing.sock,
        qrPromise: Promise.resolve(existing.qrDataUrl),
      };
    return { sock: null, qrPromise: Promise.resolve(null) };
  }
  creatingLocks.add(accountId);

  try {
    // Destroy any existing session first
    if (sessions.has(accountId)) {
      logger.warn(
        `Session already exists for account ${accountId}, destroying old one first`,
      );
      await destroySession(accountId, true);
      await new Promise((r) => setTimeout(r, 1000));
    }

    const authDir = getAuthDir(accountId);

    // If forceNewSession, wipe the auth dir
    if (opts.forceNewSession) {
      if (fs.existsSync(authDir)) {
        logger.info(`Wiping local session data for ${accountId} (force new)`);
        fs.rmSync(authDir, { recursive: true, force: true });
      }
    }

    // Ensure auth dir exists
    fs.mkdirSync(authDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      auth: state,
      logger: baileysLogger,
      version,
      browser: Browsers.macOS("Desktop"),
      printQRInTerminal: false,
      generateHighQualityLinkPreview: false,
      syncFullHistory: true,
      markOnlineOnConnect: true,
      connectTimeoutMs: 90000,
      retryRequestDelayMs: 2000,
      keepAliveIntervalMs: SOCKET_KEEPALIVE_MS,
      getMessage: async (key) => {
        // Required by Baileys v7 for message retries / decryption
        // Try to find the message in our DB
        if (key.id) {
          const { data } = await supabaseAdmin
            .from("messages")
            .select("content")
            .eq("whatsapp_message_id", key.id)
            .single();
          if (data?.content) {
            return { conversation: data.content };
          }
        }
        return undefined;
      },
    });

    const sessionEntry = {
      sock,
      orgId,
      phoneNumber,
      status: "pending",
      qrDataUrl: null,
      reconnectAttempts: 0,
      reconnectTimer: null,
      reconnectGeneration: 0,
      destroyedByUser: false,
      heartbeatInterval: null,
      watchdogInterval: null,
      lastEventAt: Date.now(),
    };
    sessions.set(accountId, sessionEntry);

    // QR promise for the controller to await
    let qrResolve;
    let qrResolved = false;
    const qrPromise = new Promise((resolve) => {
      qrResolve = resolve;
    });

    const qrTimer = setTimeout(() => {
      if (!qrResolved) {
        qrResolved = true;
        qrResolve(sessionEntry.qrDataUrl);
      }
    }, QR_TIMEOUT_MS);

    // ── Connection update events ──────────────────────
    sock.ev.on("connection.update", async (update) => {
      sessionEntry.lastEventAt = Date.now();
      const { connection, lastDisconnect, qr } = update;

      // QR code received
      if (qr) {
        logger.info(`QR received for account ${accountId}`);
        try {
          const dataUrl = await qrcode.toDataURL(qr);
          sessionEntry.qrDataUrl = dataUrl;

          if (!qrResolved) {
            qrResolved = true;
            clearTimeout(qrTimer);
            qrResolve(dataUrl);
          }

          await supabaseAdmin
            .from("whatsapp_accounts")
            .update({ qr_code: dataUrl, status: "pending" })
            .eq("id", accountId);
        } catch (err) {
          logger.error(`QR generation error for ${accountId}: ${err.message}`);
          if (!qrResolved) {
            qrResolved = true;
            clearTimeout(qrTimer);
            qrResolve(null);
          }
        }
      }

      // Connection opened
      if (connection === "open") {
        logger.info(
          `WhatsApp connected for account ${accountId} (${phoneNumber})`,
        );
        sessionEntry.status = "connected";
        sessionEntry.qrDataUrl = null;
        sessionEntry.reconnectAttempts = 0;
        clearReconnectTimer(sessionEntry);
        startHeartbeat(accountId, sessionEntry, sock);
        startWatchdog(accountId, sessionEntry, onMessage);
        await updateAccountStatus(accountId, "connected", { qr_code: null });

        // Resolve QR promise if still pending
        if (!qrResolved) {
          qrResolved = true;
          clearTimeout(qrTimer);
          qrResolve(null);
        }
      }

      // Connection closed
      if (connection === "close") {
        const statusCode =
          lastDisconnect?.error?.output?.statusCode ||
          lastDisconnect?.error?.output?.payload?.statusCode;
        const reason =
          DisconnectReason[statusCode] || `unknown (${statusCode})`;

        logger.warn(
          `WhatsApp disconnected for account ${accountId}: ${reason} (code ${statusCode})`,
        );

        sessionEntry.status = "disconnected";
        stopHeartbeat(sessionEntry);
        stopWatchdog(sessionEntry);

        // Logged out — credentials invalid, wipe and stop
        if (statusCode === DisconnectReason.loggedOut) {
          logger.info(
            `Account ${accountId} logged out — wiping auth and marking disconnected`,
          );
          sessions.delete(accountId);
          const authDir2 = getAuthDir(accountId);
          if (fs.existsSync(authDir2)) {
            fs.rmSync(authDir2, { recursive: true, force: true });
          }
          await updateAccountStatus(accountId, "disconnected", {
            qr_code: null,
          });

          if (!qrResolved) {
            qrResolved = true;
            clearTimeout(qrTimer);
            qrResolve(null);
          }
          return;
        }

        await updateAccountStatus(accountId, "disconnected");

        // Auto-reconnect unless user explicitly destroyed
        if (!sessionEntry.destroyedByUser) {
          scheduleReconnect(accountId, sessionEntry, onMessage);
        }
      }
    });

    // ── Credentials updated ────────────────────────
    sock.ev.on("creds.update", saveCreds);

    // ── Incoming messages ──────────────────────────
    sock.ev.on("messages.upsert", async ({ messages: msgs, type }) => {
      sessionEntry.lastEventAt = Date.now();
      logger.info(
        `messages.upsert event: type=${type}, count=${msgs?.length || 0}, account=${accountId}`,
      );
      if (type !== "notify" && type !== "append") return;

      for (const msg of msgs) {
        try {
          if (!msg.message) continue;
          if (msg.key.remoteJid === "status@broadcast") continue;
          if (msg.key.remoteJid?.endsWith("@g.us")) continue;

          // Unwrap ephemeral/viewOnce wrappers & skip protocol messages
          const unwrapped = unwrapMessage(msg.message);
          const ct = getContentType(unwrapped);
          logger.info(
            `Processing msg from ${msg.key.remoteJid}: contentType=${ct}, fromMe=${msg.key.fromMe}`,
          );
          if (
            !ct ||
            ct === "protocolMessage" ||
            ct === "senderKeyDistributionMessage" ||
            ct === "messageContextInfo"
          )
            continue;

          if (msg.key.fromMe) {
            await handleOutgoingFromPhone(sock, msg, account);
          } else {
            await onMessage(sock, msg, account);
          }
        } catch (err) {
          logger.error(
            `Error handling message for ${accountId}: ${err.message}`,
          );
        }
      }
    });

    // ── History sync on reconnect / initial login ──────────
    sock.ev.on("messaging-history.set", async (history) => {
      sessionEntry.lastEventAt = Date.now();
      try {
        const messages = history?.messages || [];
        const syncType = history?.syncType || "unknown";
        logger.info(
          `messaging-history.set: type=${syncType}, count=${messages.length}, account=${accountId}`,
        );

        for (const msg of messages) {
          try {
            if (!msg?.message) continue;
            if (msg.key?.remoteJid === "status@broadcast") continue;
            if (msg.key?.remoteJid?.endsWith("@g.us")) continue;

            if (msg.key?.fromMe) {
              await handleOutgoingFromPhone(sock, msg, account);
            } else {
              await onMessage(sock, msg, account, {
                skipSideEffects: true,
              });
            }
          } catch (err) {
            logger.error(
              `History sync message processing failed for ${accountId}: ${err.message}`,
            );
          }
        }
      } catch (err) {
        logger.error(`History sync failed for ${accountId}: ${err.message}`);
      }
    });

    // ── Message status updates (delivery/read receipts) ──
    sock.ev.on("messages.update", async (updates) => {
      sessionEntry.lastEventAt = Date.now();
      for (const { key, update: upd } of updates) {
        try {
          if (!upd.status) continue;
          const statusMap = { 2: "delivered", 3: "read", 4: "read" };
          const newStatus = statusMap[upd.status];
          if (!newStatus || !key.id) continue;

          await supabaseAdmin
            .from("messages")
            .update({ status: newStatus })
            .eq("whatsapp_message_id", key.id);

          await handleBroadcastAck(key.id, newStatus);
        } catch (err) {
          logger.error(
            `Error handling message_update for ${accountId}: ${err.message}`,
          );
        }
      }
    });

    return { sock, qrPromise };
  } finally {
    creatingLocks.delete(accountId);
  }
}

/**
 * Gracefully destroy a session.
 */
async function destroySession(accountId, silent = false) {
  const session = sessions.get(accountId);
  if (!session) return;

  session.destroyedByUser = true;
  clearReconnectTimer(session);
  stopHeartbeat(session);
  stopWatchdog(session);

  try {
    session.sock.ev.removeAllListeners();
    session.sock.end(undefined);
  } catch (err) {
    logger.warn(`Error closing socket for ${accountId}: ${err.message}`);
  }

  sessions.delete(accountId);
  if (!silent) {
    await updateAccountStatus(accountId, "disconnected", { qr_code: null });
  }
  logger.info(`Session destroyed for account ${accountId}`);
}

/* ── Heartbeat ─────────────────────────────── */

function startHeartbeat(accountId, sessionEntry, sock) {
  stopHeartbeat(sessionEntry);
  sessionEntry.heartbeatInterval = setInterval(async () => {
    try {
      if (sessions.has(accountId) && sessionEntry.status === "connected") {
        await sock.sendPresenceUpdate("available");
        sessionEntry.lastEventAt = Date.now();
      }
    } catch (err) {
      logger.warn(`Heartbeat failed for ${accountId}: ${err.message}`);
    }
  }, PRESENCE_HEARTBEAT_MS);
}

function stopHeartbeat(sessionEntry) {
  if (sessionEntry.heartbeatInterval) {
    clearInterval(sessionEntry.heartbeatInterval);
    sessionEntry.heartbeatInterval = null;
  }
}

function startWatchdog(accountId, sessionEntry, onMessage) {
  stopWatchdog(sessionEntry);
  sessionEntry.watchdogInterval = setInterval(() => {
    try {
      if (!sessions.has(accountId)) return;
      if (sessionEntry.status !== "connected") return;

      const idleFor = Date.now() - (sessionEntry.lastEventAt || 0);
      if (idleFor < STALE_SOCKET_MS) return;

      logger.warn(
        `Socket for ${accountId} appears stale (${Math.round(idleFor / 1000)}s idle). Triggering reconnect.`,
      );

      sessionEntry.status = "disconnected";
      stopHeartbeat(sessionEntry);
      stopWatchdog(sessionEntry);
      scheduleReconnect(accountId, sessionEntry, onMessage);
    } catch (err) {
      logger.warn(`Watchdog check failed for ${accountId}: ${err.message}`);
    }
  }, WATCHDOG_CHECK_MS);
}

function stopWatchdog(sessionEntry) {
  if (sessionEntry.watchdogInterval) {
    clearInterval(sessionEntry.watchdogInterval);
    sessionEntry.watchdogInterval = null;
  }
}

function clearReconnectTimer(sessionEntry) {
  if (sessionEntry?.reconnectTimer) {
    clearTimeout(sessionEntry.reconnectTimer);
    sessionEntry.reconnectTimer = null;
  }
}

/* ── Auto-reconnect ──────────────────────── */

function scheduleReconnect(accountId, sessionEntry, onMessage) {
  if (sessionEntry.reconnectTimer) {
    logger.info(
      `Reconnect already scheduled for ${accountId}, skipping duplicate schedule`,
    );
    return;
  }

  const attempts = (sessionEntry.reconnectAttempts || 0) + 1;
  sessionEntry.reconnectAttempts = attempts;
  const generation = (sessionEntry.reconnectGeneration || 0) + 1;
  sessionEntry.reconnectGeneration = generation;

  const delay = Math.min(
    BASE_RECONNECT_DELAY * Math.pow(2, attempts - 1),
    MAX_RECONNECT_DELAY,
  );
  logger.info(
    `Scheduling auto-reconnect for ${accountId} (attempt ${attempts}) in ${delay / 1000}s`,
  );

  sessionEntry.reconnectTimer = setTimeout(async () => {
    sessionEntry.reconnectTimer = null;

    const entry = sessions.get(accountId);
    if (!entry || entry.destroyedByUser) return;
    if (entry.reconnectGeneration !== generation) return;

    try {
      try {
        entry.sock.ev.removeAllListeners();
        entry.sock.end(undefined);
      } catch {
        /* ignore */
      }

      sessions.delete(accountId);
      creatingLocks.delete(accountId);

      const { data: acct } = await supabaseAdmin
        .from("whatsapp_accounts")
        .select("*")
        .eq("id", accountId)
        .single();

      if (acct) {
        const { handleIncomingMessage } = require("./whatsapp.message");
        const result = await createSession(
          acct,
          onMessage || handleIncomingMessage,
        );
        if (result && result.sock) {
          const newEntry = sessions.get(accountId);
          if (newEntry) newEntry.reconnectAttempts = attempts;
          logger.info(
            `Auto-reconnect initiated for ${accountId} (attempt ${attempts})`,
          );
        }
      }
    } catch (err) {
      logger.error(
        `Auto-reconnect failed for ${accountId} (attempt ${attempts}): ${err.message}`,
      );
      const currentEntry = sessions.get(accountId);
      if (currentEntry && !currentEntry.destroyedByUser) {
        scheduleReconnect(accountId, currentEntry, onMessage);
      }
    }
  }, delay);
}

/** Unwrap ephemeral / viewOnce / documentWithCaption wrappers */
function unwrapMessage(message) {
  if (!message) return message;
  return (
    message.ephemeralMessage?.message ||
    message.viewOnceMessage?.message ||
    message.viewOnceMessageV2?.message ||
    message.documentWithCaptionMessage?.message ||
    message.editedMessage?.message ||
    message
  );
}

/* ── Handle outgoing messages sent from the phone ── */

async function handleOutgoingFromPhone(sock, msg, account, options = {}) {
  const { skipMediaDownload = false } = options;
  const waId = msg.key.id;
  const normalized = unwrapMessage(msg.message);

  // Skip protocol/system messages
  const ct = getContentType(normalized);
  if (
    !ct ||
    ct === "protocolMessage" ||
    ct === "senderKeyDistributionMessage" ||
    ct === "messageContextInfo"
  )
    return;

  const { data: exists } = await supabaseAdmin
    .from("messages")
    .select("id")
    .eq("whatsapp_message_id", waId)
    .single();
  if (exists) return;

  const remoteJid = msg.key.remoteJid;
  if (
    !remoteJid ||
    remoteJid.endsWith("@g.us") ||
    remoteJid === "status@broadcast"
  )
    return;

  const orgId = account.organization_id;
  const bare = remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "");
  const rawPhone = bare.includes(":") ? bare.split(":")[0] : bare;
  const normalizedPhone = /^\d{7,15}$/.test(rawPhone) ? rawPhone : null;

  // Skip if remote is the connected phone itself
  if (normalizedPhone && normalizedPhone === account.phone_number) return;

  const {
    findContactByPhone,
    findOrCreateConversation,
    resolveMessageType,
  } = require("./whatsapp.message");

  const contact = normalizedPhone
    ? await findContactByPhone(orgId, normalizedPhone)
    : null;
  const conversation = await findOrCreateConversation(orgId, account.id, {
    contactId: contact?.id || null,
    remoteJid,
    phoneNumber: normalizedPhone,
    displayName: msg.pushName || null,
  });

  const msgType = resolveMessageType(normalized);
  let mediaUrl = null;
  if (msgType !== "text" && !skipMediaDownload) {
    try {
      const buffer = await downloadMediaMessage(msg, "buffer", {});
      if (buffer) {
        const mediaObj = normalized?.[ct];
        const mimetype = mediaObj?.mimetype || "application/octet-stream";
        mediaUrl = await uploadMediaToStorage(
          { data: buffer, mimetype },
          orgId,
          conversation.id,
        );
      }
    } catch (err) {
      logger.warn(`Failed to download media from phone msg: ${err.message}`);
    }
  }

  const body =
    normalized?.conversation ||
    normalized?.extendedTextMessage?.text ||
    normalized?.imageMessage?.caption ||
    normalized?.videoMessage?.caption ||
    null;

  const MEDIA_LABELS = {
    image: "\ud83d\udcf7 Photo",
    video: "\ud83c\udfa5 Video",
    audio: "\ud83c\udfa4 Voice message",
    document: "\ud83d\udcce Document",
    sticker: "Sticker",
  };
  const contentForDb = body || MEDIA_LABELS[msgType] || null;

  await supabaseAdmin.from("messages").insert({
    conversation_id: conversation.id,
    organization_id: orgId,
    sender_type: "team_member",
    sender_id: null,
    content: contentForDb,
    message_type: msgType,
    media_url: mediaUrl,
    whatsapp_message_id: waId,
    status: "sent",
  });
}

/* ── Media upload to Supabase Storage ─────── */

async function uploadMediaToStorage(media, orgId, conversationId) {
  try {
    const ext = getExtensionFromMimetype(media.mimetype);
    const fileName = `${orgId}/${conversationId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const buffer = Buffer.isBuffer(media.data)
      ? media.data
      : Buffer.from(media.data, "base64");

    const { error } = await supabaseAdmin.storage
      .from("whatsapp-media")
      .upload(fileName, buffer, {
        contentType: media.mimetype,
        upsert: false,
      });

    if (error) {
      logger.error(
        `Supabase Storage upload failed for ${fileName}: ${error.message}`,
      );
      // Fallback to data URI so the media is still viewable
      return `data:${media.mimetype};base64,${buffer.toString("base64")}`;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("whatsapp-media")
      .getPublicUrl(fileName);

    logger.info(`Media uploaded: ${urlData?.publicUrl}`);
    return (
      urlData?.publicUrl ||
      `data:${media.mimetype};base64,${buffer.toString("base64")}`
    );
  } catch (err) {
    logger.error(`Media upload exception: ${err.message}`);
    const b64 = Buffer.isBuffer(media.data)
      ? media.data.toString("base64")
      : media.data;
    return `data:${media.mimetype};base64,${b64}`;
  }
}

function getExtensionFromMimetype(mimetype) {
  const base = mimetype.split(";")[0].trim();
  const map = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/3gpp": "3gp",
    "audio/ogg": "ogg",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/webm": "webm",
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
  };
  return map[base] || base.split("/")[1] || "bin";
}

/* ── Restore sessions on startup ──────────── */

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
  uploadMediaToStorage,
};
