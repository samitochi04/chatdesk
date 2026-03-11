const { supabaseAdmin } = require("../config/supabase");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

/**
 * POST /api/quick-replies
 */
const createQuickReply = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { title, content, shortcut } = req.body;

  const { data, error } = await supabaseAdmin
    .from("quick_replies")
    .insert({
      organization_id: orgId,
      title,
      content,
      shortcut: shortcut || null,
      created_by: req.user.id,
    })
    .select("*")
    .single();

  if (error) throw ApiError.internal("Failed to create quick reply");

  res.status(201).json({ success: true, data });
});

/**
 * GET /api/quick-replies
 */
const listQuickReplies = catchAsync(async (req, res) => {
  const orgId = req.organization.id;

  const { data, error } = await supabaseAdmin
    .from("quick_replies")
    .select("id, title, content, shortcut, created_by, created_at, updated_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) throw ApiError.internal("Failed to list quick replies");

  res.json({ success: true, data });
});

/**
 * PATCH /api/quick-replies/:id
 */
const updateQuickReply = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { title, content, shortcut } = req.body;

  const update = {};
  if (title !== undefined) update.title = title;
  if (content !== undefined) update.content = content;
  if (shortcut !== undefined) update.shortcut = shortcut || null;

  const { data, error } = await supabaseAdmin
    .from("quick_replies")
    .update(update)
    .eq("id", req.params.id)
    .eq("organization_id", orgId)
    .select("*")
    .single();

  if (error || !data) throw ApiError.notFound("Quick reply not found");

  res.json({ success: true, data });
});

/**
 * DELETE /api/quick-replies/:id
 */
const deleteQuickReply = catchAsync(async (req, res) => {
  const orgId = req.organization.id;

  const { error } = await supabaseAdmin
    .from("quick_replies")
    .delete()
    .eq("id", req.params.id)
    .eq("organization_id", orgId);

  if (error) throw ApiError.internal("Failed to delete quick reply");

  res.json({ success: true, message: "Quick reply deleted" });
});

module.exports = {
  createQuickReply,
  listQuickReplies,
  updateQuickReply,
  deleteQuickReply,
};
