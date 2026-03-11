const Joi = require("joi");

const createQuickReply = Joi.object({
  title: Joi.string().trim().min(1).max(100).required(),
  content: Joi.string().trim().min(1).max(2000).required(),
  shortcut: Joi.string().trim().max(50).allow("", null),
});

const updateQuickReply = Joi.object({
  title: Joi.string().trim().min(1).max(100),
  content: Joi.string().trim().min(1).max(2000),
  shortcut: Joi.string().trim().max(50).allow("", null),
});

const idParam = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = { createQuickReply, updateQuickReply, idParam };
