const { supabaseAdmin } = require("../config/supabase");
const logger = require("../utils/logger");

/**
 * Record an activity to the activity_log table.
 *
 * @param {object} params
 * @param {string} params.organizationId
 * @param {string|null} params.userId
 * @param {string} params.action   - e.g. "created", "updated", "deleted", "sent"
 * @param {string} params.entityType - e.g. "contact", "conversation", "broadcast"
 * @param {string|null} params.entityId
 * @param {object} params.metadata - extra context
 */
async function logActivity({
  organizationId,
  userId,
  action,
  entityType,
  entityId,
  metadata,
}) {
  try {
    await supabaseAdmin.from("activity_log").insert({
      organization_id: organizationId,
      user_id: userId || null,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      metadata: metadata || {},
    });
  } catch (err) {
    // Never let logging failures break the request
    logger.error(`Activity log write failed: ${err.message}`);
  }
}

/**
 * Express middleware that automatically logs mutating requests.
 * Attach AFTER the route handler has sent a response.
 *
 * Usage:
 *   router.post('/resource', auth, requireOrganization, handler, activityLogger('created', 'resource'));
 *
 * Or call logActivity() directly from services for finer control.
 */
function activityLogger(action, entityType) {
  return (req, _res, next) => {
    // Fire-and-forget — do not make the client wait
    if (req.user && req.organization) {
      const entityId =
        req.params.id || req.params.accountId || req.body?.id || null;

      logActivity({
        organizationId: req.organization.id,
        userId: req.user.id,
        action,
        entityType,
        entityId,
        metadata: {
          method: req.method,
          path: req.originalUrl,
        },
      });
    }
    next();
  };
}

module.exports = { logActivity, activityLogger };
