const { Router } = require("express");
const {
  auth,
  requireRole,
  requireOrganization,
} = require("../middlewares/auth");
const { requireFeature } = require("../middlewares/planGate");
const validate = require("../middlewares/validate");
const schemas = require("../validations/broadcast.validation");
const ctrl = require("../controllers/broadcast.controller");

const router = Router();

// All broadcast routes: auth + org + canBroadcast (growth / business only)
router.use(auth, requireOrganization, requireFeature("canBroadcast"));

router.post(
  "/",
  requireRole("owner", "admin"),
  validate(schemas.createBroadcast),
  ctrl.createBroadcast,
);

router.post(
  "/schedule",
  requireRole("owner", "admin"),
  validate(schemas.scheduleBroadcast),
  ctrl.scheduleBroadcast,
);

router.post(
  "/send",
  requireRole("owner", "admin"),
  validate(schemas.sendBroadcast),
  ctrl.sendBroadcast,
);

router.get("/", ctrl.listBroadcasts);

router.get("/:id", validate(schemas.idParam, "params"), ctrl.getBroadcast);

router.get(
  "/:id/recipients",
  validate(schemas.idParam, "params"),
  ctrl.listRecipients,
);

router.post(
  "/:id/cancel",
  requireRole("owner", "admin"),
  validate(schemas.idParam, "params"),
  ctrl.cancelBroadcast,
);

router.delete(
  "/:id",
  requireRole("owner"),
  validate(schemas.idParam, "params"),
  ctrl.deleteBroadcast,
);

module.exports = router;
