const jwt = require("jsonwebtoken");
const config = require("../config");
const { supabaseAdmin } = require("../config/supabase");
const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");

/**
 * Verifies the Supabase JWT from the Authorization header,
 * then attaches `req.user` with profile + organization context.
 */
const auth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Missing or malformed authorization header");
    }

    const token = header.split(" ")[1];

    // Verify JWT with Supabase's JWT secret
    let decoded;
    try {
      decoded = jwt.verify(token, config.supabase.jwtSecret);
    } catch (err) {
      throw ApiError.unauthorized("Invalid or expired token");
    }

    const userId = decoded.sub;
    if (!userId) {
      throw ApiError.unauthorized("Token missing subject");
    }

    // Fetch profile with organization data
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, organization_id, full_name, role, is_active, language")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      throw ApiError.unauthorized("User profile not found");
    }

    if (!profile.is_active) {
      throw ApiError.forbidden("Account is deactivated");
    }

    // Attach to request
    req.user = {
      id: profile.id,
      organizationId: profile.organization_id,
      fullName: profile.full_name,
      role: profile.role,
      isActive: profile.is_active,
      language: profile.language,
    };
    req.accessToken = token;

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Restrict access to specific roles.
 * Usage: requireRole('super_admin', 'owner')
 */
const requireRole = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden("Insufficient permissions"));
    }
    next();
  };
};

/**
 * Requires the user to belong to an approved organization.
 */
const requireOrganization = async (req, _res, next) => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    if (!req.user.organizationId) {
      throw ApiError.forbidden("No organization assigned");
    }

    const { data: org, error } = await supabaseAdmin
      .from("organizations")
      .select(
        "id, approval_status, subscription_plan, can_broadcast, can_use_analytics, can_advanced_automation, can_export_data, can_data_analysis, max_whatsapp_numbers, max_team_members",
      )
      .eq("id", req.user.organizationId)
      .single();

    if (error || !org) {
      throw ApiError.forbidden("Organization not found");
    }
    if (org.approval_status !== "approved") {
      throw ApiError.forbidden("Organization is not approved");
    }

    req.organization = {
      id: org.id,
      plan: org.subscription_plan,
      canBroadcast: org.can_broadcast,
      canUseAnalytics: org.can_use_analytics,
      canAdvancedAutomation: org.can_advanced_automation,
      canExportData: org.can_export_data,
      canDataAnalysis: org.can_data_analysis,
      maxWhatsappNumbers: org.max_whatsapp_numbers,
      maxTeamMembers: org.max_team_members,
    };

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { auth, requireRole, requireOrganization };
