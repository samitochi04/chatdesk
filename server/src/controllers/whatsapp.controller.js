const { supabaseAdmin } = require("../config/supabase");
const sessionManager = require("../services/whatsapp.session");
const messageService = require("../services/whatsapp.message");
const { logActivity } = require("../services/activity.service");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const logger = require("../utils/logger");

/**
 * POST /api/whatsapp/accounts
 * Register a new WhatsApp number for the organization.
 */
const registerAccount = catchAsync(async (req, res) => {
  const { phoneNumber, displayName } = req.body;
  const orgId = req.organization.id;

  // Check plan limit (super_admin bypasses)
  if (req.user.role !== "super_admin") {
    const { count, error: countErr } = await supabaseAdmin
      .from("whatsapp_accounts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId);

    if (countErr) throw ApiError.internal("Failed to check account count");
    if (count >= req.organization.maxWhatsappNumbers) {
      throw ApiError.forbidden(
        `Your plan allows a maximum of ${req.organization.maxWhatsappNumbers} WhatsApp number(s)`,
      );
    }
  }

  // Check for duplicates within the org
  const { data: existing } = await supabaseAdmin
    .from("whatsapp_accounts")
    .select("id")
    .eq("organization_id", orgId)
    .eq("phone_number", phoneNumber)
    .single();

  if (existing)
    throw ApiError.conflict("This phone number is already registered");

  const { data: account, error } = await supabaseAdmin
    .from("whatsapp_accounts")
    .insert({
      organization_id: orgId,
      phone_number: phoneNumber,
      display_name: displayName || null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) throw ApiError.internal("Failed to register WhatsApp account");

  logActivity({
    organizationId: orgId,
    userId: req.user.id,
    action: "created",
    entityType: "whatsapp_account",
    entityId: account.id,
    metadata: { phoneNumber },
  });

  res.status(201).json({ success: true, data: account });
});

/**
 * POST /api/whatsapp/accounts/:accountId/connect
 * Initialize a WhatsApp session — returns QR code for pairing.
 * Query param: ?force=true to wipe local session and get a fresh QR.
 */
const connectAccount = catchAsync(async (req, res) => {
  const { accountId } = req.params;
  const orgId = req.organization.id;
  const forceNew = req.query.force === "true";

  // Fetch the account and verify ownership
  const { data: account, error } = await supabaseAdmin
    .from("whatsapp_accounts")
    .select("*")
    .eq("id", accountId)
    .eq("organization_id", orgId)
    .single();

  if (error || !account) throw ApiError.notFound("WhatsApp account not found");

  // If already connected and not forcing, return current status
  const existingSession = sessionManager.getSession(accountId);
  if (existingSession && existingSession.status === "connected" && !forceNew) {
    return res.json({
      success: true,
      data: { status: "connected", qrCode: null },
    });
  }

  // Create a new session (optionally wiping local auth for fresh QR)
  const { qrPromise } = await sessionManager.createSession(
    account,
    messageService.handleIncomingMessage,
    { forceNewSession: forceNew },
  );

  // Wait for QR (with timeout)
  const qrTimeout = new Promise((resolve) =>
    setTimeout(() => resolve(null), 45000),
  );
  const qrDataUrl = await Promise.race([qrPromise, qrTimeout]);

  res.json({
    success: true,
    data: {
      status: "pending",
      qrCode: qrDataUrl,
      message: qrDataUrl
        ? "Scan the QR code with WhatsApp"
        : "QR code generation timed out — poll GET /accounts/:accountId/status",
    },
  });
});

/**
 * POST /api/whatsapp/accounts/:accountId/disconnect
 * Destroy the WhatsApp session.
 */
const disconnectAccount = catchAsync(async (req, res) => {
  const { accountId } = req.params;
  const orgId = req.organization.id;

  // Verify ownership
  const { data: account } = await supabaseAdmin
    .from("whatsapp_accounts")
    .select("id")
    .eq("id", accountId)
    .eq("organization_id", orgId)
    .single();

  if (!account) throw ApiError.notFound("WhatsApp account not found");

  await sessionManager.destroySession(accountId);

  res.json({ success: true, message: "WhatsApp session disconnected" });
});

/**
 * GET /api/whatsapp/accounts/:accountId/status
 * Get connection status + latest QR code if pending.
 */
const getAccountStatus = catchAsync(async (req, res) => {
  const { accountId } = req.params;
  const orgId = req.organization.id;

  const { data: account, error } = await supabaseAdmin
    .from("whatsapp_accounts")
    .select(
      "id, phone_number, display_name, status, qr_code, last_connected_at",
    )
    .eq("id", accountId)
    .eq("organization_id", orgId)
    .single();

  if (error || !account) throw ApiError.notFound("WhatsApp account not found");

  // Also check live session status
  const session = sessionManager.getSession(accountId);
  const liveStatus = session ? session.status : account.status;

  res.json({
    success: true,
    data: {
      ...account,
      liveStatus,
      qrCode: session?.qrDataUrl || account.qr_code,
    },
  });
});

/**
 * GET /api/whatsapp/accounts
 * List all WhatsApp accounts for the organization.
 */
const listAccounts = catchAsync(async (req, res) => {
  const orgId = req.organization.id;

  const { data: accounts, error } = await supabaseAdmin
    .from("whatsapp_accounts")
    .select(
      "id, phone_number, display_name, status, last_connected_at, created_at",
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });

  if (error) throw ApiError.internal("Failed to list accounts");

  // Enrich with live session status
  const enriched = accounts.map((a) => {
    const session = sessionManager.getSession(a.id);
    return {
      ...a,
      liveStatus: session ? session.status : a.status,
    };
  });

  res.json({ success: true, data: enriched });
});

/**
 * DELETE /api/whatsapp/accounts/:accountId
 * Remove a WhatsApp account and destroy its session.
 * Conversations and messages are preserved (FK is SET NULL after migration 004).
 */
const deleteAccount = catchAsync(async (req, res) => {
  const { accountId } = req.params;
  const orgId = req.organization.id;

  const { data: account } = await supabaseAdmin
    .from("whatsapp_accounts")
    .select("id, phone_number")
    .eq("id", accountId)
    .eq("organization_id", orgId)
    .single();

  if (!account) throw ApiError.notFound("WhatsApp account not found");

  // Destroy session first
  await sessionManager.destroySession(accountId);

  // Clean up local session files
  const fs = require("fs");
  const sessionDir = require("path").join(
    process.cwd(),
    "whatsapp-sessions",
    `session-${accountId}`,
  );
  if (fs.existsSync(sessionDir)) {
    fs.rmSync(sessionDir, { recursive: true, force: true });
  }

  // Nullify whatsapp_account_id on conversations before deleting the account
  // (defensive — the FK migration 004 does SET NULL, but be safe for pre-migration DBs)
  await supabaseAdmin
    .from("conversations")
    .update({ whatsapp_account_id: null })
    .eq("whatsapp_account_id", accountId);

  // Delete the account record
  const { error } = await supabaseAdmin
    .from("whatsapp_accounts")
    .delete()
    .eq("id", accountId);

  if (error) throw ApiError.internal("Failed to delete account");

  logActivity({
    organizationId: orgId,
    userId: req.user.id,
    action: "deleted",
    entityType: "whatsapp_account",
    entityId: accountId,
    metadata: { phoneNumber: account.phone_number },
  });

  res.json({
    success: true,
    message:
      "WhatsApp account deleted. Conversations and messages have been preserved.",
  });
});

/**
 * POST /api/whatsapp/messages/send
 * Send a message from the dashboard through WhatsApp.
 * Supports text and media messages (image, video, audio, document).
 */
const sendMessageHandler = catchAsync(async (req, res) => {
  const { conversationId, content, messageType, mediaUrl } = req.body;
  const orgId = req.organization.id;
  const senderId = req.user.id;

  // Fetch conversation and verify ownership
  const { data: conversation, error: convErr } = await supabaseAdmin
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("organization_id", orgId)
    .single();

  if (convErr || !conversation)
    throw ApiError.notFound("Conversation not found");

  // Get the active session for this WA account
  const session = sessionManager.getSession(conversation.whatsapp_account_id);
  if (!session || session.status !== "connected") {
    throw ApiError.badRequest("WhatsApp account is not connected");
  }

  const savedMsg = await messageService.sendMessage(session, conversation, {
    content,
    messageType: messageType || "text",
    mediaUrl: mediaUrl || null,
    senderId,
  });

  res.status(201).json({ success: true, data: savedMsg });
});

/**
 * GET /api/whatsapp/sessions
 * Get overview of all live WhatsApp sessions (health monitoring).
 */
const listSessions = catchAsync(async (req, res) => {
  const sessions = sessionManager.getAllSessions();

  // Filter by org unless super_admin
  const filtered =
    req.user.role === "super_admin"
      ? sessions
      : sessions.filter((s) => s.orgId === req.organization.id);

  res.json({ success: true, data: filtered });
});

module.exports = {
  registerAccount,
  connectAccount,
  disconnectAccount,
  getAccountStatus,
  listAccounts,
  deleteAccount,
  sendMessageHandler,
  listSessions,
};
