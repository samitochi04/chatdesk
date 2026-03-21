const Joi = require("joi");

const CONTACT_CLASSIFICATIONS = [
  "new_lead",
  "interested",
  "said_no",
  "bought",
  "didnt_buy",
];

const createBroadcast = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  messageTemplate: Joi.string().trim().min(1).max(4000).required(),
  whatsappAccountId: Joi.string().uuid().required(),
  targetTagIds: Joi.array().items(Joi.string().uuid()).default([]),
  targetClassifications: Joi.array()
    .items(Joi.string().valid(...CONTACT_CLASSIFICATIONS))
    .default([]),
  scheduledAt: Joi.date().iso().allow(null),
});

const scheduleBroadcast = Joi.object({
  broadcastId: Joi.string().uuid().required(),
});

const sendBroadcast = Joi.object({
  broadcastId: Joi.string().uuid().required(),
  delayMs: Joi.number().integer().min(1000).max(30000).default(3000),
});

const idParam = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = {
  createBroadcast,
  scheduleBroadcast,
  sendBroadcast,
  idParam,
};
