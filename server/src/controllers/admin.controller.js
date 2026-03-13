const { supabaseAdmin } = require("../config/supabase");
const { logActivity } = require("../services/activity.service");
const { sendInvitationEmail } = require("../services/email.service");
const sessionManager = require("../services/whatsapp.session");
const config = require("../config");
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
/*  Platform-wide endpoints (super_admin only, no org context)         */
/* ================================================================== */

/**
 * GET /api/admin/platform/stats
 * Global platform statistics across all organizations.
 */
const getPlatformStats = catchAsync(async (req, res) => {
  const [
    orgsResult,
    usersResult,
    contactsResult,
    conversationsResult,
    messagesResult,
    broadcastsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("organizations")
      .select("id", { count: "exact", head: true }),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("contacts").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("conversations")
      .select("id", { count: "exact", head: true }),
    supabaseAdmin.from("messages").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("broadcasts")
      .select("id", { count: "exact", head: true }),
  ]);

  // Org breakdown by status
  const [pendingOrgs, approvedOrgs, rejectedOrgs] = await Promise.all([
    supabaseAdmin
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("approval_status", "pending"),
    supabaseAdmin
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("approval_status", "approved"),
    supabaseAdmin
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("approval_status", "rejected"),
  ]);

  // Plan breakdown
  const [starterOrgs, growthOrgs, businessOrgs] = await Promise.all([
    supabaseAdmin
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("subscription_plan", "starter"),
    supabaseAdmin
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("subscription_plan", "growth"),
    supabaseAdmin
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("subscription_plan", "business"),
  ]);

  res.json({
    success: true,
    data: {
      totalOrganizations: orgsResult.count || 0,
      totalUsers: usersResult.count || 0,
      totalContacts: contactsResult.count || 0,
      totalConversations: conversationsResult.count || 0,
      totalMessages: messagesResult.count || 0,
      totalBroadcasts: broadcastsResult.count || 0,
      orgsByStatus: {
        pending: pendingOrgs.count || 0,
        approved: approvedOrgs.count || 0,
        rejected: rejectedOrgs.count || 0,
      },
      orgsByPlan: {
        starter: starterOrgs.count || 0,
        growth: growthOrgs.count || 0,
        business: businessOrgs.count || 0,
      },
    },
  });
});

/**
 * GET /api/admin/platform/users
 * All users across all organizations.
 */
const listAllUsers = catchAsync(async (req, res) => {
  const { data: users, error } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, full_name, avatar_url, role, is_active, language, organization_id, last_seen_at, created_at, organizations!organization_id(id, name, slug)",
    )
    .order("created_at", { ascending: false });

  if (error) throw ApiError.internal("Failed to list users");

  res.json({ success: true, data: users });
});

/**
 * GET /api/admin/platform/invitations
 * All invitations across all organizations.
 */
const listAllInvitations = catchAsync(async (req, res) => {
  const { data: invitations, error } = await supabaseAdmin
    .from("team_invitations")
    .select(
      "id, email, role, status, invited_by, expires_at, created_at, organization_id, organizations(id, name, slug)",
    )
    .order("created_at", { ascending: false });

  if (error) throw ApiError.internal("Failed to list invitations");

  res.json({ success: true, data: invitations });
});

/**
 * POST /api/admin/platform/invitations/:id/cancel
 * Super-admin can cancel any invitation.
 */
const cancelAnyInvitation = catchAsync(async (req, res) => {
  const { data: invitation } = await supabaseAdmin
    .from("team_invitations")
    .select("id, status")
    .eq("id", req.params.id)
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

/**
 * GET /api/admin/organizations/:id
 * Detailed view of one org, including its members.
 */
const getOrgDetail = catchAsync(async (req, res) => {
  const { data: org, error: orgErr } = await supabaseAdmin
    .from("organizations")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (orgErr || !org) throw ApiError.notFound("Organization not found");

  const { data: members } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, avatar_url, role, is_active, created_at")
    .eq("organization_id", req.params.id)
    .order("created_at", { ascending: true });

  const [contactsResult, conversationsResult, broadcastsResult] =
    await Promise.all([
      supabaseAdmin
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", req.params.id),
      supabaseAdmin
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", req.params.id),
      supabaseAdmin
        .from("broadcasts")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", req.params.id),
    ]);

  res.json({
    success: true,
    data: {
      ...org,
      members: members || [],
      stats: {
        totalContacts: contactsResult.count || 0,
        totalConversations: conversationsResult.count || 0,
        totalBroadcasts: broadcastsResult.count || 0,
      },
    },
  });
});

/**
 * PATCH /api/admin/organizations/:id
 * Super-admin can update any org's plan (triggers set_plan_features).
 */
const updateOrg = catchAsync(async (req, res) => {
  const { subscriptionPlan } = req.body;

  const update = {};
  if (subscriptionPlan) update.subscription_plan = subscriptionPlan;

  const { data: org, error } = await supabaseAdmin
    .from("organizations")
    .update(update)
    .eq("id", req.params.id)
    .select("*")
    .single();

  if (error || !org) throw ApiError.notFound("Organization not found");

  logger.info(
    `Organization ${req.params.id} plan updated to "${subscriptionPlan}" by ${req.user.id}`,
  );

  res.json({ success: true, data: org });
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

  // Check team member limit (super_admin bypasses)
  if (req.user.role !== "super_admin") {
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

  // Send invitation email via nodemailer
  try {
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("name")
      .eq("id", orgId)
      .single();

    const frontendOrigin = config.cors.origins[0] || "http://localhost:5173";
    const inviteUrl = `${frontendOrigin}/invite/${invitation.token}`;

    await sendInvitationEmail({
      to: email,
      orgName: org?.name || "ChatDesk",
      role,
      inviteUrl,
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
    waAccountsResult,
    waConnectedResult,
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
    supabaseAdmin
      .from("whatsapp_accounts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    supabaseAdmin
      .from("whatsapp_accounts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "connected"),
  ]);

  res.json({
    success: true,
    data: {
      totalContacts: contactsResult.count || 0,
      totalConversations: conversationsResult.count || 0,
      openConversations: openConvsResult.count || 0,
      totalBroadcasts: broadcastsResult.count || 0,
      totalDeals: dealsResult.count || 0,
      whatsappAccounts: {
        total: waAccountsResult.count || 0,
        connected: waConnectedResult.count || 0,
      },
      plan: req.organization.plan,
    },
  });
});

/**
 * GET /api/admin/analytics
 * Real analytics data for the organization's analytics page.
 */
const getAnalytics = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const days = parseInt(req.query.days) || 7;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  // Messages per day
  const { data: messages } = await supabaseAdmin
    .from("messages")
    .select("created_at")
    .eq("organization_id", orgId)
    .gte("created_at", sinceISO);

  const msgsByDay = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    msgsByDay[key] = 0;
  }
  if (messages) {
    for (const m of messages) {
      const key = m.created_at.split("T")[0];
      if (msgsByDay[key] !== undefined) msgsByDay[key]++;
    }
  }
  const messagesPerDay = Object.entries(msgsByDay).map(([date, count]) => ({
    date,
    messages: count,
  }));

  // Contact classification breakdown
  const { data: contacts } = await supabaseAdmin
    .from("contacts")
    .select("classification")
    .eq("organization_id", orgId);

  const classBreakdown = {};
  if (contacts) {
    for (const c of contacts) {
      const cls = c.classification || "new_lead";
      classBreakdown[cls] = (classBreakdown[cls] || 0) + 1;
    }
  }
  const classificationData = Object.entries(classBreakdown).map(
    ([name, count]) => ({ name, count }),
  );

  // Pipeline stages with deal counts + values
  const { data: stages } = await supabaseAdmin
    .from("pipeline_stages")
    .select("id, name, color, position")
    .eq("organization_id", orgId)
    .order("position", { ascending: true });

  const { data: deals } = await supabaseAdmin
    .from("pipeline_deals")
    .select("stage_id, value")
    .eq("organization_id", orgId);

  const pipelineData = (stages || []).map((s, i) => {
    const stageDeals = (deals || []).filter((d) => d.stage_id === s.id);
    return {
      name: s.name,
      value: stageDeals.length,
      totalValue: stageDeals.reduce((sum, d) => sum + Number(d.value || 0), 0),
      fill: ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"][
        i % 6
      ],
    };
  });

  res.json({
    success: true,
    data: {
      messagesPerDay,
      classificationData,
      pipelineData,
    },
  });
});

/* ================================================================== */
/*  Super-admin: Create Organization                                   */
/* ================================================================== */

const createOrganization = catchAsync(async (req, res) => {
  const { name, slug, subscriptionPlan } = req.body;

  const { data: org, error } = await supabaseAdmin
    .from("organizations")
    .insert({
      name,
      slug,
      subscription_plan: subscriptionPlan || "starter",
      approval_status: "approved",
      approved_by: req.user.id,
      approved_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw ApiError.conflict("An organization with this slug already exists");
    }
    throw ApiError.internal("Failed to create organization");
  }

  logger.info(`Organization "${name}" created by super_admin ${req.user.id}`);

  res.status(201).json({ success: true, data: org });
});

/* ================================================================== */
/*  Super-admin: Update User (assign org, change role)                 */
/* ================================================================== */

const updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { organizationId, role } = req.body;

  const updates = {};
  if (organizationId !== undefined)
    updates.organization_id = organizationId || null;
  if (role) updates.role = role;

  if (Object.keys(updates).length === 0) {
    throw ApiError.badRequest("No fields to update");
  }

  const { data: user, error } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select(
      "id, full_name, role, organization_id, is_active, created_at, organizations!organization_id(id, name)",
    )
    .single();

  if (error) throw ApiError.internal("Failed to update user");
  if (!user) throw ApiError.notFound("User not found");

  logger.info(
    `User ${id} updated by super_admin ${req.user.id}: ${JSON.stringify(updates)}`,
  );

  res.json({ success: true, data: user });
});

module.exports = {
  listPendingOrgs,
  listAllOrgs,
  approveOrg,
  rejectOrg,
  getPlatformStats,
  listAllUsers,
  listAllInvitations,
  cancelAnyInvitation,
  getOrgDetail,
  updateOrg,
  createOrganization,
  updateUser,
  createInvitation,
  listInvitations,
  cancelInvitation,
  listTeamMembers,
  updateTeamMember,
  listActivity,
  getDashboard,
  getAnalytics,
};
