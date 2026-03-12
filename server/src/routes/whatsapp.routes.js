const { Router } = require("express");
const ctrl = require("../controllers/whatsapp.controller");
const {
  auth,
  requireRole,
  requireOrganization,
} = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const schemas = require("../validations/whatsapp.validation");
const { whatsappSendLimiter } = require("../middlewares/rateLimiter");
const { cacheMiddleware } = require("../middlewares/cache");

const router = Router();

// All routes require authentication + approved organization
router.use(auth, requireOrganization);

// ── Account management ──────────────────────

router.get("/accounts", cacheMiddleware("waAccounts", 5), ctrl.listAccounts);

router.post(
  "/accounts",
  requireRole("owner", "admin"),
  validate(schemas.registerAccount),
  ctrl.registerAccount,
);

router.get(
  "/accounts/:accountId/status",
  validate(schemas.accountIdParam, "params"),
  ctrl.getAccountStatus,
);

router.post(
  "/accounts/:accountId/connect",
  requireRole("owner", "admin"),
  validate(schemas.accountIdParam, "params"),
  ctrl.connectAccount,
);

router.post(
  "/accounts/:accountId/disconnect",
  requireRole("owner", "admin"),
  validate(schemas.accountIdParam, "params"),
  ctrl.disconnectAccount,
);

router.delete(
  "/accounts/:accountId",
  requireRole("owner"),
  validate(schemas.accountIdParam, "params"),
  ctrl.deleteAccount,
);

// ── Messaging ───────────────────────────────

router.post(
  "/messages/send",
  whatsappSendLimiter,
  validate(schemas.sendMessage),
  ctrl.sendMessageHandler,
);

// ── Session monitoring ──────────────────────

router.get("/sessions", ctrl.listSessions);

module.exports = router;
