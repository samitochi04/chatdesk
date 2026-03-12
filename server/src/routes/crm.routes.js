const { Router } = require("express");
const ctrl = require("../controllers/crm.controller");
const { auth, requireOrganization } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const s = require("../validations/crm.validation");
const { cacheMiddleware } = require("../middlewares/cache");

const router = Router();

router.use(auth, requireOrganization);

// ── Contacts ────────────────────────────────

router.get(
  "/contacts",
  validate(s.listContacts, "query"),
  cacheMiddleware("contacts", 5),
  ctrl.listContacts,
);
router.get("/contacts/:id", validate(s.idParam, "params"), ctrl.getContact);
router.post("/contacts", validate(s.createContact), ctrl.createContact);
router.patch(
  "/contacts/:id",
  validate(s.idParam, "params"),
  validate(s.updateContact),
  ctrl.updateContact,
);
router.delete(
  "/contacts/:id",
  validate(s.idParam, "params"),
  ctrl.deleteContact,
);

// ── Contact tags ────────────────────────────

router.put(
  "/contacts/:id/tags",
  validate(s.idParam, "params"),
  validate(s.assignTags),
  ctrl.assignTags,
);

// ── Tags ────────────────────────────────────

router.get("/tags", cacheMiddleware("tags", 30), ctrl.listTags);
router.post("/tags", validate(s.createTag), ctrl.createTag);
router.delete("/tags/:id", validate(s.idParam, "params"), ctrl.deleteTag);

// ── Conversations ───────────────────────────

router.get(
  "/conversations",
  validate(s.listConversations, "query"),
  cacheMiddleware("conversations", 3),
  ctrl.listConversations,
);
router.get(
  "/conversations/:id",
  validate(s.idParam, "params"),
  ctrl.getConversation,
);
router.patch(
  "/conversations/:id",
  validate(s.idParam, "params"),
  validate(s.updateConversation),
  ctrl.updateConversation,
);

// ── Messages ────────────────────────────────

router.get(
  "/conversations/:id/messages",
  validate(s.idParam, "params"),
  validate(s.listMessages, "query"),
  ctrl.listMessages,
);

// ── Conversation Notes ──────────────────────

router.get(
  "/conversations/:id/notes",
  validate(s.idParam, "params"),
  ctrl.listNotes,
);
router.post(
  "/conversations/:id/notes",
  validate(s.idParam, "params"),
  validate(s.createNote),
  ctrl.createNote,
);

// ── Pipeline Stages ─────────────────────────

router.get(
  "/pipeline/stages",
  cacheMiddleware("pipeline", 10),
  ctrl.listStages,
);
router.post("/pipeline/stages", validate(s.createStage), ctrl.createStage);
router.patch(
  "/pipeline/stages/:id",
  validate(s.idParam, "params"),
  validate(s.updateStage),
  ctrl.updateStage,
);
router.delete(
  "/pipeline/stages/:id",
  validate(s.idParam, "params"),
  ctrl.deleteStage,
);
router.put(
  "/pipeline/stages/reorder",
  validate(s.reorderStages),
  ctrl.reorderStages,
);

// ── Pipeline Deals ──────────────────────────

router.get("/pipeline/deals", cacheMiddleware("deals", 5), ctrl.listDeals);
router.get("/pipeline/deals/:id", validate(s.idParam, "params"), ctrl.getDeal);
router.post("/pipeline/deals", validate(s.createDeal), ctrl.createDeal);
router.patch(
  "/pipeline/deals/:id",
  validate(s.idParam, "params"),
  validate(s.updateDeal),
  ctrl.updateDeal,
);
router.delete(
  "/pipeline/deals/:id",
  validate(s.idParam, "params"),
  ctrl.deleteDeal,
);

module.exports = router;
