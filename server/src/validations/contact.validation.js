const Joi = require("joi");

const sendContactMessage = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().required(),
  subject: Joi.string().trim().min(3).max(200).required(),
  message: Joi.string().trim().min(10).max(5000).required(),
});

module.exports = { sendContactMessage };
