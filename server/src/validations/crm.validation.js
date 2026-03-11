const Joi = require("joi");

/* ================================================================== */
/*  Common                                                             */
/* ================================================================== */

const idParam = Joi.object({
  id: Joi.string().uuid().required(),
});

/* ================================================================== */
/*  CRM Contacts                                                       */
/* ================================================================== */

const listContacts = Joi.object({
  search: Joi.string().max(200).allow(""),
  classification: Joi.string().valid(
    "new_lead",
    "interested",
    "said_no",
    "bought",
    "didnt_buy",
  ),
  tag: Joi.string().uuid(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(25),
  sort: Joi.string()
    .valid("name", "created_at", "last_conversation_at", "total_orders")
    .default("created_at"),
  order: Joi.string().valid("asc", "desc").default("desc"),
});

const createContact = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^\d{7,15}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must contain 7-15 digits",
    }),
  name: Joi.string().max(200).allow("", null),
  email: Joi.string().email().allow("", null),
  classification: Joi.string()
    .valid("new_lead", "interested", "said_no", "bought", "didnt_buy")
    .default("new_lead"),
  notes: Joi.string().max(5000).allow("", null),
  tags: Joi.array().items(Joi.string().uuid()).default([]),
});

const updateContact = Joi.object({
  name: Joi.string().max(200).allow("", null),
  email: Joi.string().email().allow("", null),
  classification: Joi.string().valid(
    "new_lead",
    "interested",
    "said_no",
    "bought",
    "didnt_buy",
  ),
  notes: Joi.string().max(5000).allow("", null),
  totalOrders: Joi.number().integer().min(0),
  totalSpent: Joi.number().min(0),
});

/* ================================================================== */
/*  Tags                                                               */
/* ================================================================== */

const createTag = Joi.object({
  name: Joi.string().max(50).required(),
  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .default("#6B7280"),
});

const assignTags = Joi.object({
  tagIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

/* ================================================================== */
/*  Conversations                                                      */
/* ================================================================== */

const listConversations = Joi.object({
  status: Joi.string().valid("open", "closed", "pending", "archived"),
  search: Joi.string().max(200).allow(""),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(25),
});

const updateConversation = Joi.object({
  status: Joi.string().valid("open", "closed", "pending", "archived"),
  assignedTo: Joi.string().uuid().allow(null),
});

const listMessages = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

const createNote = Joi.object({
  content: Joi.string().max(5000).required(),
});

/* ================================================================== */
/*  Pipeline                                                           */
/* ================================================================== */

const createStage = Joi.object({
  name: Joi.string().max(100).required(),
  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .default("#6B7280"),
  position: Joi.number().integer().min(0),
  isWon: Joi.boolean().default(false),
  isLost: Joi.boolean().default(false),
});

const updateStage = Joi.object({
  name: Joi.string().max(100),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
  position: Joi.number().integer().min(0),
  isWon: Joi.boolean(),
  isLost: Joi.boolean(),
});

const reorderStages = Joi.object({
  stages: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().uuid().required(),
        position: Joi.number().integer().min(0).required(),
      }),
    )
    .min(1)
    .required(),
});

const createDeal = Joi.object({
  contactId: Joi.string().uuid().required(),
  stageId: Joi.string().uuid().required(),
  title: Joi.string().max(200).required(),
  value: Joi.number().min(0).allow(null),
  currency: Joi.string().max(3).default("NGN"),
  assignedTo: Joi.string().uuid().allow(null),
  notes: Joi.string().max(5000).allow("", null),
  expectedCloseDate: Joi.date().allow(null),
});

const updateDeal = Joi.object({
  stageId: Joi.string().uuid(),
  title: Joi.string().max(200),
  value: Joi.number().min(0).allow(null),
  currency: Joi.string().max(3),
  assignedTo: Joi.string().uuid().allow(null),
  notes: Joi.string().max(5000).allow("", null),
  expectedCloseDate: Joi.date().allow(null),
  lostReason: Joi.string().max(500).allow("", null),
});

module.exports = {
  idParam,
  listContacts,
  createContact,
  updateContact,
  createTag,
  assignTags,
  listConversations,
  updateConversation,
  listMessages,
  createNote,
  createStage,
  updateStage,
  reorderStages,
  createDeal,
  updateDeal,
};
