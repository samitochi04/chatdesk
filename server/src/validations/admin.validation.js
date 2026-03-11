const Joi = require("joi");

/* ---- Organization approval ---- */

const approveOrg = Joi.object({
  organizationId: Joi.string().uuid().required(),
  subscriptionPlan: Joi.string()
    .valid("starter", "growth", "business")
    .required(),
});

const rejectOrg = Joi.object({
  organizationId: Joi.string().uuid().required(),
});

/* ---- Team invitations ---- */

const createInvitation = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid("admin", "agent").default("agent"),
});

const cancelInvitation = Joi.object({
  id: Joi.string().uuid().required(),
});

/* ---- CSV export ---- */

const exportQuery = Joi.object({
  type: Joi.string()
    .valid("contacts", "conversations", "pipeline_deals")
    .required(),
});

/* ---- Activity log query ---- */

const activityQuery = Joi.object({
  entityType: Joi.string().max(50),
  limit: Joi.number().integer().min(1).max(500).default(50),
  offset: Joi.number().integer().min(0).default(0),
});

/* ---- ID param ---- */

const idParam = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = {
  approveOrg,
  rejectOrg,
  createInvitation,
  cancelInvitation,
  exportQuery,
  activityQuery,
  idParam,
};
