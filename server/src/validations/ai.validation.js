const Joi = require("joi");

const validAnalysisTypes = [
  "customer_behavior",
  "growth_suggestion",
  "conversation_insights",
  "sales_performance",
  "response_quality",
  "classification_summary",
];

const validAgentTypes = [
  "auto_reply",
  "marketing",
  "follow_up",
  "support",
  "custom",
];

/* ---- AI Agent CRUD ---- */

const createAgent = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  type: Joi.string()
    .valid(...validAgentTypes)
    .required(),
  description: Joi.string().max(500).allow("", null),
  systemPrompt: Joi.string().max(4000).allow("", null),
  model: Joi.string()
    .valid("gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo")
    .default("gpt-4o-mini"),
  isActive: Joi.boolean().default(true),
  configuration: Joi.object({
    temperature: Joi.number().min(0).max(2),
    max_tokens: Joi.number().integer().min(64).max(4096),
  }).default({}),
});

const updateAgent = Joi.object({
  name: Joi.string().trim().min(1).max(100),
  type: Joi.string().valid(...validAgentTypes),
  description: Joi.string().max(500).allow("", null),
  systemPrompt: Joi.string().max(4000).allow("", null),
  model: Joi.string().valid(
    "gpt-4o-mini",
    "gpt-4o",
    "gpt-4-turbo",
    "gpt-3.5-turbo",
  ),
  isActive: Joi.boolean(),
  configuration: Joi.object({
    temperature: Joi.number().min(0).max(2),
    max_tokens: Joi.number().integer().min(64).max(4096),
  }),
}).min(1);

/* ---- Auto-Reply Rules CRUD ---- */

const createRule = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  triggerKeywords: Joi.array()
    .items(Joi.string().trim().min(1).max(100))
    .min(1)
    .required(),
  responseText: Joi.string().trim().min(1).max(2000).required(),
  aiAgentId: Joi.string().uuid().allow(null),
  isActive: Joi.boolean().default(true),
  priority: Joi.number().integer().min(0).max(1000).default(0),
});

const updateRule = Joi.object({
  name: Joi.string().trim().min(1).max(100),
  triggerKeywords: Joi.array()
    .items(Joi.string().trim().min(1).max(100))
    .min(1),
  responseText: Joi.string().trim().min(1).max(2000),
  aiAgentId: Joi.string().uuid().allow(null),
  isActive: Joi.boolean(),
  priority: Joi.number().integer().min(0).max(1000),
}).min(1);

/* ---- Classification ---- */

const classifyContact = Joi.object({
  contactId: Joi.string().uuid().required(),
});

/* ---- Assign AI Agent to Conversation ---- */

const assignAgent = Joi.object({
  conversationId: Joi.string().uuid().required(),
  agentId: Joi.string().uuid().allow(null).required(),
});

/* ---- Data Analysis ---- */

const runAnalysis = Joi.object({
  analysisType: Joi.string()
    .valid(...validAnalysisTypes)
    .required(),
  periodStart: Joi.date().iso().allow(null),
  periodEnd: Joi.date().iso().allow(null),
});

/* ---- ID param ---- */

const idParam = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = {
  createAgent,
  updateAgent,
  createRule,
  updateRule,
  classifyContact,
  assignAgent,
  runAnalysis,
  idParam,
};
