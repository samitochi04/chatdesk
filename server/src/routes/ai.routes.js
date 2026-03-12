const { Router } = require("express");
const {
  auth,
  requireRole,
  requireOrganization,
} = require("../middlewares/auth");
const { requireFeature } = require("../middlewares/planGate");
const validate = require("../middlewares/validate");
const schemas = require("../validations/ai.validation");
const ctrl = require("../controllers/ai.controller");
const { cacheMiddleware } = require("../middlewares/cache");

const router = Router();

// All routes require auth + org context
router.use(auth, requireOrganization);

/* ------------------------------------------------------------------ */
/*  AI Agents — advanced automation (growth / business plans)          */
/* ------------------------------------------------------------------ */

router.post(
  "/agents",
  requireRole("owner", "admin"),
  requireFeature("canAdvancedAutomation"),
  validate(schemas.createAgent),
  ctrl.createAgent,
);

router.get("/agents", cacheMiddleware("agents", 10), ctrl.listAgents);

router.get("/agents/:id", validate(schemas.idParam, "params"), ctrl.getAgent);

router.patch(
  "/agents/:id",
  requireRole("owner", "admin"),
  requireFeature("canAdvancedAutomation"),
  validate(schemas.idParam, "params"),
  validate(schemas.updateAgent),
  ctrl.updateAgent,
);

router.delete(
  "/agents/:id",
  requireRole("owner"),
  requireFeature("canAdvancedAutomation"),
  validate(schemas.idParam, "params"),
  ctrl.deleteAgent,
);

/* ------------------------------------------------------------------ */
/*  Auto-Reply Rules — available to ALL plans                          */
/* ------------------------------------------------------------------ */

router.post(
  "/rules",
  requireRole("owner", "admin"),
  validate(schemas.createRule),
  ctrl.createRule,
);

router.get("/rules", cacheMiddleware("rules", 10), ctrl.listRules);

router.get("/rules/:id", validate(schemas.idParam, "params"), ctrl.getRule);

router.patch(
  "/rules/:id",
  requireRole("owner", "admin"),
  validate(schemas.idParam, "params"),
  validate(schemas.updateRule),
  ctrl.updateRule,
);

router.delete(
  "/rules/:id",
  requireRole("owner", "admin"),
  validate(schemas.idParam, "params"),
  ctrl.deleteRule,
);

/* ------------------------------------------------------------------ */
/*  Assign AI Agent to Conversation — advanced automation              */
/* ------------------------------------------------------------------ */

router.post(
  "/conversations/assign",
  requireFeature("canAdvancedAutomation"),
  validate(schemas.assignAgent),
  ctrl.assignAgentToConversation,
);

/* ------------------------------------------------------------------ */
/*  Customer Classification — advanced automation                      */
/* ------------------------------------------------------------------ */

router.post(
  "/classify",
  requireFeature("canAdvancedAutomation"),
  validate(schemas.classifyContact),
  ctrl.classifyContactHandler,
);

/* ------------------------------------------------------------------ */
/*  Data Analysis — data analysis feature (growth / business plans)    */
/* ------------------------------------------------------------------ */

router.post(
  "/analyze",
  requireRole("owner", "admin"),
  requireFeature("canDataAnalysis"),
  validate(schemas.runAnalysis),
  ctrl.runAnalysisHandler,
);

router.get("/analyses", requireFeature("canDataAnalysis"), ctrl.listAnalyses);

router.get(
  "/analyses/:id",
  requireFeature("canDataAnalysis"),
  validate(schemas.idParam, "params"),
  ctrl.getAnalysis,
);

module.exports = router;
