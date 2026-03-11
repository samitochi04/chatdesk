const ApiError = require("../utils/ApiError");

/**
 * Gate access to features based on the organization's subscription plan.
 *
 * Usage:
 *   router.post('/broadcasts', auth, requireOrganization, requireFeature('canBroadcast'), ...)
 *
 * Feature flags (set on req.organization by requireOrganization middleware):
 *   canBroadcast, canUseAnalytics, canAdvancedAutomation, canExportData, canDataAnalysis
 */
const requireFeature = (featureFlag) => {
  return (req, _res, next) => {
    if (!req.organization) {
      return next(ApiError.forbidden("No organization context"));
    }
    if (!req.organization[featureFlag]) {
      return next(
        ApiError.forbidden(
          `Your current plan (${req.organization.plan}) does not include this feature`,
        ),
      );
    }
    next();
  };
};

module.exports = { requireFeature };
