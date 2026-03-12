const { supabaseAdmin } = require("../config/supabase");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

/* ================================================================== */
/*  Notifications                                                      */
/* ================================================================== */

const listNotifications = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await supabaseAdmin
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw ApiError.internal("Failed to list notifications");

  res.json({
    success: true,
    data,
    pagination: { page: +page, limit: +limit, total: count },
  });
});

const getUnreadCount = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const { count, error } = await supabaseAdmin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) throw ApiError.internal("Failed to count notifications");

  res.json({ success: true, data: { unread: count } });
});

const markRead = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw ApiError.internal("Failed to mark notification as read");

  res.json({ success: true });
});

const markAllRead = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) throw ApiError.internal("Failed to mark all as read");

  res.json({ success: true });
});

/* ================================================================== */
/*  Notification Preferences                                           */
/* ================================================================== */

const getPreferences = catchAsync(async (req, res) => {
  const userId = req.user.id;

  let { data, error } = await supabaseAdmin
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code === "PGRST116") {
    // No preferences yet — create defaults
    const { data: created, error: createErr } = await supabaseAdmin
      .from("notification_preferences")
      .insert({ user_id: userId })
      .select()
      .single();
    if (createErr)
      throw ApiError.internal("Failed to create notification preferences");
    data = created;
  } else if (error) {
    throw ApiError.internal("Failed to get notification preferences");
  }

  res.json({ success: true, data });
});

const updatePreferences = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const {
    new_message_app,
    new_message_email,
    new_contact_app,
    new_contact_email,
    deal_update_app,
    deal_update_email,
    broadcast_app,
    broadcast_email,
  } = req.body;

  const updates = {};
  if (new_message_app !== undefined) updates.new_message_app = new_message_app;
  if (new_message_email !== undefined)
    updates.new_message_email = new_message_email;
  if (new_contact_app !== undefined) updates.new_contact_app = new_contact_app;
  if (new_contact_email !== undefined)
    updates.new_contact_email = new_contact_email;
  if (deal_update_app !== undefined) updates.deal_update_app = deal_update_app;
  if (deal_update_email !== undefined)
    updates.deal_update_email = deal_update_email;
  if (broadcast_app !== undefined) updates.broadcast_app = broadcast_app;
  if (broadcast_email !== undefined) updates.broadcast_email = broadcast_email;

  // Upsert
  const { data, error } = await supabaseAdmin
    .from("notification_preferences")
    .upsert({ user_id: userId, ...updates }, { onConflict: "user_id" })
    .select()
    .single();

  if (error)
    throw ApiError.internal("Failed to update notification preferences");

  res.json({ success: true, data });
});

/* ================================================================== */
/*  Helper — create notification (used internally by other controllers) */
/* ================================================================== */

const createNotification = async ({
  orgId,
  userId,
  type,
  title,
  body,
  link,
}) => {
  await supabaseAdmin.from("notifications").insert({
    organization_id: orgId,
    user_id: userId,
    type,
    title,
    body: body || null,
    link: link || null,
  });
};

const notifyOrgMembers = async ({
  orgId,
  type,
  title,
  body,
  link,
  excludeUserId,
}) => {
  const { data: members } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("organization_id", orgId);

  if (!members) return;

  const notifications = members
    .filter((m) => m.id !== excludeUserId)
    .map((m) => ({
      organization_id: orgId,
      user_id: m.id,
      type,
      title,
      body: body || null,
      link: link || null,
    }));

  if (notifications.length > 0) {
    await supabaseAdmin.from("notifications").insert(notifications);
  }
};

module.exports = {
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  getPreferences,
  updatePreferences,
  createNotification,
  notifyOrgMembers,
};
