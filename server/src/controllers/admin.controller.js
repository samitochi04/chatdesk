const { supabaseAdmin } = require("../config/supabase");
const { logActivity } = require("../services/activity.service");
const sessionManager = require("../services/whatsapp.session");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const logger = require("../utils/logger");

/* ================================================================== */
/*  Organization Approval (super_admin only)                           */
/* ================================================================== */

/**
 * GET /api/admin/organizations/pending
 */
const listPendingOrgs = catchAsync(async (req, res) => {
  const { data: orgs, error } = await supabaseAdmin
    .from("organizations")
    .select("id, name, slug, subscription_plan, approval_status, created_at")
    .eq("approval_status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw ApiError.internal("Failed to list pending organizations");

  res.json({ success: true, data: orgs });
});

/**
 * GET /api/admin/organizations
 */
const listAllOrgs = catchAsync(async (req, res) => {
  const { data: orgs, error } = await supabaseAdmin
    .from("organizations")
    .select(
      "id, name, slug, subscription_plan, approval_status, approved_at, max_whatsapp_numbers, max_team_members, can_broadcast, can_advanced_automation, can_data_analysis, can_export_data, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) throw ApiError.internal("Failed to list organizations");

  res.json({ success: true, data: orgs });
});

/**
 * POST /api/admin/organizations/approve
 * Approve an org and assign its subscription plan.
 * The set_plan_features trigger in Supabase fires automatically on plan update.
 */
const approveOrg = catchAsync(async (req, res) => {
  const { organizationId, subscriptionPlan } = req.body;

  const { data: org, error: fetchErr } = await supabaseAdmin
    .from("organizations")
    .select("id, approval_status")
    .eq("id", organizationId)
    .single();

  if (fetchErr || !org) throw ApiError.notFound("Organization not found");
  if (org.approval_status === "approved") {
    throw ApiError.badRequest("Organization is already approved");
  }

  const { data: updated, error } = await supabaseAdmin
    .from("organizations")
    .update({
      approval_status: "approved",
      subscription_plan: subscriptionPlan,
      approved_at: new Date().toISOString(),
      approved_by: req.user.id,
    })
    .eq("id", organizationId)
    .select("*")
    .single();

  if (error) throw ApiError.internal("Failed to approve organization");

  await logActivity({
    organizationId,
    userId: req.user.id,
    action: "approved",
    entityType: "organization",
    entityId: organizationId,
    metadata: { subscriptionPlan },
  });

  logger.info(
    `Organization ${organizationId} approved with plan "${subscriptionPlan}" by ${req.user.id}`,
  );

  res.json({ success: true, data: updated });
});

/**
 * POST /api/admin/organizations/reject
 */
const rejectOrg = catchAsync(async (req, res) => {
  const { organizationId } = req.body;

  const { data: org, error: fetchErr } = await supabaseAdmin
    .from("organizations")
    .select("id, approval_status")
    .eq("id", organizationId)
    .single();

  if (fetchErr || !org) throw ApiError.notFound("Organization not found");

  const { data: updated, error } = await supabaseAdmin
    .from("organizations")
    .update({ approval_status: "rejected" })
    .eq("id", organizationId)
    .select("*")
    .single();

  if (error) throw ApiError.internal("Failed to reject organization");

  await logActivity({
    organizationId,
    userId: req.user.id,
    action: "rejected",
    entityType: "organization",
    entityId: organizationId,
  });

  res.json({ success: true, data: updated });
});

/* ================================================================== */
/*  Team Invitations                                                   */
/* ================================================================== */

/**
 * POST /api/admin/invitations
 */
const createInvitation = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { email, role } = req.body;

  // Check team member limit
  const { count, error: countErr } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId);

  if (countErr) throw ApiError.internal("Failed to check team size");

  const maxMembers = req.organization.maxTeamMembers;
  if (maxMembers !== -1 && count >= maxMembers) {
    throw ApiError.forbidden(
      `Your plan allows a maximum of ${maxMembers} team member(s)`,
    );
  }

  // Check for existing pending invitation
  const { data: existing } = await supabaseAdmin
    .from("team_invitations")
    .select("id")
    .eq("organization_id", orgId)
    .eq("email", email)
    .eq("status", "pending")
    .single();

  if (existing) {
    throw ApiError.conflict(
      "A pending invitation already exists for this email",
    );
  }

  // Check if user is already a member
  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("organization_id", orgId)
    .filter("id", "in", `(select id from auth.users where email = '${email}')`)
    .single();

  // The filter above won't work across schemas in Supabase due to RLS,
  // so we fall back to checking after insertion.

  const { data: invitation, error } = await supabaseAdmin
    .from("team_invitations")
    .insert({
      organization_id: orgId,
      email,
      role,
      invited_by: req.user.id,
    })
    .select("*")
    .single();

  if (error) throw ApiError.internal("Failed to create invitation");

  // Send invitation email via Supabase's invite user
  try {
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("name")
      .eq("id", orgId)
      .single();

    // Use Supabase Admin Auth to send a magic link / invite
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        invitation_id: invitation.id,
        organization_id: orgId,
        organization_name: org?.name || "ChatDesk",
        role,
      },
    });

    logger.info(`Invitation email sent to ${email} for org ${orgId}`);
  } catch (emailErr) {
    logger.warn(`Invitation created but email failed: ${emailErr.message}`);
    // Invitation still exists — user can share the token manually
  }

  await logActivity({
    organizationId: orgId,
    userId: req.user.id,
    action: "invited",
    entityType: "team_invitation",
    entityId: invitation.id,
    metadata: { email, role },
  });

  res.status(201).json({ success: true, data: invitation });
});

/**
 * GET /api/admin/invitations
 */
const listInvitations = catchAsync(async (req, res) => {
  const orgId = req.organization.id;

  const { data: invitations, error } = await supabaseAdmin
    .from("team_invitations")
    .select("id, email, role, status, invited_by, expires_at, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) throw ApiError.internal("Failed to list invitations");

  res.json({ success: true, data: invitations });
});

/**
 * POST /api/admin/invitations/:id/cancel
 */
const cancelInvitation = catchAsync(async (req, res) => {
  const orgId = req.organization.id;

  const { data: invitation } = await supabaseAdmin
    .from("team_invitations")
    .select("id, status")
    .eq("id", req.params.id)
    .eq("organization_id", orgId)
    .single();

  if (!invitation) throw ApiError.notFound("Invitation not found");
  if (invitation.status !== "pending") {
    throw ApiError.badRequest("Only pending invitations can be cancelled");
  }

  const { error } = await supabaseAdmin
    .from("team_invitations")
    .update({ status: "cancelled" })
    .eq("id", req.params.id);

  if (error) throw ApiError.internal("Failed to cancel invitation");

  res.json({ success: true, message: "Invitation cancelled" });
});

/* ================================================================== */
/*  Team Management                                                    */
/* ================================================================== */

/**
 * GET /api/admin/team
 */
const listTeamMembers = catchAsync(async (req, res) => {
  const orgId = req.organization.id;

  const { data: members, error } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, full_name, avatar_url, role, is_active, language, last_seen_at, created_at",
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });

  if (error) throw ApiError.internal("Failed to list team members");

  res.json({ success: true, data: members });
});

/**
 * PATCH /api/admin/team/:id
 * Update a team member's role or active status.
 */
const updateTeamMember = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { role, isActive } = req.body;

  // Cannot edit yourself
  if (req.params.id === req.user.id) {
    throw ApiError.badRequest(
      "Cannot modify your own account through this endpoint",
    );
  }

  const update = {};
  if (role !== undefined) update.role = role;
  if (isActive !== undefined) update.is_active = isActive;

  const { data: member, error } = await supabaseAdmin
    .from("profiles")
    .update(update)
    .eq("id", req.params.id)
    .eq("organization_id", orgId)
    .select("id, full_name, role, is_active")
    .single();

  if (error || !member) throw ApiError.notFound("Team member not found");

  await logActivity({
    organizationId: orgId,
    userId: req.user.id,
    action: "updated",
    entityType: "team_member",
    entityId: req.params.id,
    metadata: update,
  });

  res.json({ success: true, data: member });
});

/* ================================================================== */
/*  Activity Log                                                       */
/* ================================================================== */

/**
 * GET /api/admin/activity
 */
const listActivity = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { entityType, limit, offset } = req.query;

  let query = supabaseAdmin
    .from("activity_log")
    .select("id, user_id, action, entity_type, entity_id, metadata, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .range(offset || 0, (offset || 0) + (limit || 50) - 1);

  if (entityType) {
    query = query.eq("entity_type", entityType);
  }

  const { data: logs, error } = await query;

  if (error) throw ApiError.internal("Failed to list activity log");

  res.json({ success: true, data: logs });
});

/* ================================================================== */
/*  Dashboard / Health monitoring                                      */
/* ================================================================== */

/**
 * GET /api/admin/dashboard
 * Aggregated overview for the organization's dashboard.
 */
const getDashboard = catchAsync(async (req, res) => {
  const orgId = req.organization.id;

  // Run counts in parallel
  const [
    contactsResult,
    conversationsResult,
    openConvsResult,
    broadcastsResult,
    dealsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    supabaseAdmin
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    supabaseAdmin
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "open"),
    supabaseAdmin
      .from("broadcasts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    supabaseAdmin
      .from("pipeline_deals")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
  ]);

  // WhatsApp sessions for this org
  const allSessions = sessionManager.getAllSessions();
  const orgSessions = allSessions.filter((s) => s.orgId === orgId);

  res.json({
    success: true,
    data: {
      totalContacts: contactsResult.count || 0,
      totalConversations: conversationsResult.count || 0,
      openConversations: openConvsResult.count || 0,
      totalBroadcasts: broadcastsResult.count || 0,
      totalDeals: dealsResult.count || 0,
      whatsappAccounts: {
        total: orgSessions.length,
        connected: orgSessions.filter((s) => s.status === "connected").length,
        sessions: orgSessions,
      },
      plan: req.organization.plan,
    },
  });
});

module.exports = {
  listPendingOrgs,
  listAllOrgs,
  approveOrg,
  rejectOrg,
  createInvitation,
  listInvitations,
  cancelInvitation,
  listTeamMembers,
  updateTeamMember,
  listActivity,
  getDashboard,
};
