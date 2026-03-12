const { Router } = require("express");
const { auth, requireOrganization } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const schemas = require("../validations/quickReply.validation");
const ctrl = require("../controllers/quickReply.controller");
const { cacheMiddleware } = require("../middlewares/cache");

const router = Router();

router.use(auth, requireOrganization);

router.post("/", validate(schemas.createQuickReply), ctrl.createQuickReply);
router.get("/", cacheMiddleware("quickReplies", 10), ctrl.listQuickReplies);
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
