const { Router } = require("express");
const { auth } = require("../middlewares/auth");
const { supabaseAdmin } = require("../config/supabase");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const logger = require("../utils/logger");

const router = Router();

/**
 * GET /api/invite/:token
 * Public — returns invitation details (no auth needed for viewing).
 */
router.get(
  "/:token",
  catchAsync(async (req, res) => {
    const { token } = req.params;

    const { data: invitation, error } = await supabaseAdmin
      .from("team_invitations")
      .select(
        "id, email, role, status, expires_at, created_at, organizations(id, name)",
      )
      .eq("token", token)
      .single();

    if (error || !invitation) {
      throw ApiError.notFound("Invitation not found");
    }

    res.json({ success: true, data: invitation });
  }),
);

/**
 * POST /api/invite/:token/accept
 * Auth required — accepts the invitation and assigns user to the org.
 */
router.post(
  "/:token/accept",
  auth,
  catchAsync(async (req, res) => {
    const { token } = req.params;
    const userId = req.user.id;

    // Fetch invitation
    const { data: invitation, error: invErr } = await supabaseAdmin
      .from("team_invitations")
      .select("id, email, role, status, expires_at, organization_id")
      .eq("token", token)
      .single();

    if (invErr || !invitation) {
      throw ApiError.notFound("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw ApiError.badRequest("This invitation is no longer valid");
    }

    if (new Date(invitation.expires_at) < new Date()) {
      // Mark as expired
      await supabaseAdmin
        .from("team_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);
      throw ApiError.badRequest("This invitation has expired");
    }

    // Verify the authenticated user's email matches the invitation
    const {
      data: { user },
    } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (!user || user.email !== invitation.email) {
      throw ApiError.forbidden(
        "This invitation was sent to a different email address. Please sign in with the correct account.",
      );
    }

    // Check if user already belongs to an org
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (profile?.organization_id) {
      throw ApiError.badRequest(
        "You already belong to an organization. Please contact support to transfer.",
      );
    }

    // Assign the user to the organization with the invited role
    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({
        organization_id: invitation.organization_id,
        role: invitation.role,
      })
      .eq("id", userId);

    if (updateErr) {
      throw ApiError.internal("Failed to assign organization");
    }

    // Mark invitation as accepted
    await supabaseAdmin
      .from("team_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    logger.info(
      `User ${userId} accepted invitation ${invitation.id} and joined org ${invitation.organization_id} as ${invitation.role}`,
    );

    res.json({ success: true, message: "Invitation accepted" });
  }),
);

module.exports = router;
