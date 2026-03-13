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

/* ---- Update organization ---- */

const updateOrg = Joi.object({
  subscriptionPlan: Joi.string()
    .valid("starter", "growth", "business")
    .required(),
});

/* ---- Create organization (super_admin) ---- */

const createOrg = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  slug: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-z0-9-]+$/)
    .required(),
  subscriptionPlan: Joi.string()
    .valid("starter", "growth", "business")
    .default("starter"),
});

/* ---- Update user (super_admin) ---- */

const updateUser = Joi.object({
  organizationId: Joi.string().uuid().allow(null).optional(),
  role: Joi.string().valid("super_admin", "owner", "admin", "agent").optional(),
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
  updateOrg,
  createOrg,
  updateUser,
  createInvitation,
  cancelInvitation,
  exportQuery,
  activityQuery,
  idParam,
};
