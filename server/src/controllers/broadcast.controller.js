const { supabaseAdmin } = require("../config/supabase");
const broadcastService = require("../services/broadcast.service");
const { logActivity } = require("../services/activity.service");
const { notifyOrgMembers } = require("./notification.controller");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

/**
 * POST /api/broadcasts
 * Create a new broadcast (draft).
 */
const createBroadcast = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const {
    name,
    messageTemplate,
    whatsappAccountId,
    targetTagIds,
    scheduledAt,
  } = req.body;

  // Verify WA account belongs to org
  const { data: account } = await supabaseAdmin
    .from("whatsapp_accounts")
    .select("id")
    .eq("id", whatsappAccountId)
    .eq("organization_id", orgId)
    .single();

  if (!account)
    throw ApiError.badRequest(
      "WhatsApp account not found in your organization",
    );

  // Validate tag ownership if provided
  if (targetTagIds && targetTagIds.length > 0) {
    const { data: tags } = await supabaseAdmin
      .from("tags")
      .select("id")
      .eq("organization_id", orgId)
      .in("id", targetTagIds);

    if (!tags || tags.length !== targetTagIds.length) {
      throw ApiError.badRequest(
        "One or more tags not found in your organization",
      );
    }
  }

  const { data: broadcast, error } = await supabaseAdmin
    .from("broadcasts")
    .insert({
      organization_id: orgId,
      whatsapp_account_id: whatsappAccountId,
      name,
      message_template: messageTemplate,
      target_tag_ids: targetTagIds || [],
      scheduled_at: scheduledAt || null,
      created_by: req.user.id,
      status: "draft",
    })
    .select("*")
    .single();

  if (error) throw ApiError.internal("Failed to create broadcast");

  logActivity({
    organizationId: orgId,
    userId: req.user.id,
    action: "created",
    entityType: "broadcast",
    entityId: broadcast.id,
    metadata: { name: broadcast.name },
  });

  res.status(201).json({ success: true, data: broadcast });
});

/**
 * POST /api/broadcasts/schedule
 * Resolve recipients from tags, populate broadcast_recipients, set status.
 */
const scheduleBroadcast = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { broadcastId } = req.body;

  const broadcast = await broadcastService.scheduleBroadcast(
    broadcastId,
    orgId,
  );

  res.json({ success: true, data: broadcast });
});

/**
 * POST /api/broadcasts/send
 * Kick off the background sending worker.
 */
const sendBroadcast = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { broadcastId, delayMs } = req.body;

  // Verify ownership
  const { data: broadcast } = await supabaseAdmin
    .from("broadcasts")
    .select("id")
    .eq("id", broadcastId)
    .eq("organization_id", orgId)
    .single();

  if (!broadcast) throw ApiError.notFound("Broadcast not found");

  await broadcastService.startSending(broadcastId, { delayMs });

  // Notify org members that broadcast started
  notifyOrgMembers({
    orgId,
    type: "broadcast_complete",
    title: "Broadcast sending started",
    body: `Broadcast ${broadcastId} is now being sent`,
    link: `/dashboard/broadcasts`,
    excludeUserId: req.user.id,
    emailData: {
      broadcastName: broadcastId,
    },
  });

  logActivity({
    organizationId: orgId,
    userId: req.user.id,
    action: "sent",
    entityType: "broadcast",
    entityId: broadcastId,
  });

  res.json({
    success: true,
    message: "Broadcast sending started in background",
  });
});

/**
 * POST /api/broadcasts/:id/cancel
 */
const cancelBroadcast = catchAsync(async (req, res) => {
  const orgId = req.organization.id;

  await broadcastService.cancelBroadcast(req.params.id, orgId);

  res.json({ success: true, message: "Broadcast cancelled" });
});

/**
 * GET /api/broadcasts
 */
const listBroadcasts = catchAsync(async (req, res) => {
  const orgId = req.organization.id;

  const { data: broadcasts, error } = await supabaseAdmin
    .from("broadcasts")
    .select(
      "id, name, status, total_recipients, delivered_count, read_count, replied_count, scheduled_at, sent_at, created_at",
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) throw ApiError.internal("Failed to list broadcasts");

  res.json({ success: true, data: broadcasts });
});

/**
 * GET /api/broadcasts/:id
 */
const getBroadcast = catchAsync(async (req, res) => {
  const orgId = req.organization.id;

  const { data: broadcast, error } = await supabaseAdmin
    .from("broadcasts")
    .select("*")
    .eq("id", req.params.id)
    .eq("organization_id", orgId)
    .single();

  if (error || !broadcast) throw ApiError.notFound("Broadcast not found");

  res.json({ success: true, data: broadcast });
});

/**
 * GET /api/broadcasts/:id/recipients
 */
const listRecipients = catchAsync(async (req, res) => {
  const orgId = req.organization.id;

  // Verify broadcast ownership
  const { data: broadcast } = await supabaseAdmin
    .from("broadcasts")
    .select("id")
    .eq("id", req.params.id)
    .eq("organization_id", orgId)
    .single();

  if (!broadcast) throw ApiError.notFound("Broadcast not found");

  const { data: recipients, error } = await supabaseAdmin
    .from("broadcast_recipients")
    .select(
      "id, contact_id, status, sent_at, delivered_at, read_at, failed_reason, contacts(phone_number, name)",
    )
    .eq("broadcast_id", req.params.id)
    .order("sent_at", { ascending: false });

  if (error) throw ApiError.internal("Failed to list recipients");

  res.json({ success: true, data: recipients });
});

/**
 * DELETE /api/broadcasts/:id
 */
const deleteBroadcast = catchAsync(async (req, res) => {
  const orgId = req.organization.id;

  const { data: broadcast } = await supabaseAdmin
    .from("broadcasts")
    .select("id, status")
    .eq("id", req.params.id)
    .eq("organization_id", orgId)
    .single();

  if (!broadcast) throw ApiError.notFound("Broadcast not found");
  if (broadcast.status === "sending") {
    throw ApiError.badRequest(
      "Cannot delete a broadcast that is currently sending",
    );
  }

  const { error } = await supabaseAdmin
    .from("broadcasts")
    .delete()
    .eq("id", req.params.id);

  if (error) throw ApiError.internal("Failed to delete broadcast");

  res.json({ success: true, message: "Broadcast deleted" });
});

module.exports = {
  createBroadcast,
  scheduleBroadcast,
  sendBroadcast,
  cancelBroadcast,
  listBroadcasts,
  getBroadcast,
  listRecipients,
  deleteBroadcast,
};
