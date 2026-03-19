const Joi = require("joi");

const registerAccount = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^\d{7,15}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must contain 7-15 digits only",
    }),
  displayName: Joi.string().max(100).allow("", null),
});

const sendMessage = Joi.object({
  conversationId: Joi.string().uuid().required(),
  content: Joi.string().max(4096).allow("", null).default(""),
  messageType: Joi.string()
    .valid(
      "text",
      "image",
      "video",
      "audio",
      "document",
      "location",
      "sticker",
      "contact_card",
    )
    .default("text"),
  mediaUrl: Joi.string().uri().allow(null, "").optional(),
});

const accountIdParam = Joi.object({
  accountId: Joi.string().uuid().required(),
});

module.exports = {
  registerAccount,
  sendMessage,
  accountIdParam,
};
