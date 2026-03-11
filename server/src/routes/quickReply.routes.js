const { Router } = require("express");
const { auth, requireOrganization } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const schemas = require("../validations/quickReply.validation");
const ctrl = require("../controllers/quickReply.controller");

const router = Router();

router.use(auth, requireOrganization);

router.post("/", validate(schemas.createQuickReply), ctrl.createQuickReply);
router.get("/", ctrl.listQuickReplies);
router.patch(
  "/:id",
  validate(schemas.idParam, "params"),
  ctrl.updateQuickReply,
);
router.delete(
  "/:id",
  validate(schemas.idParam, "params"),
  ctrl.deleteQuickReply,
);

module.exports = router;
