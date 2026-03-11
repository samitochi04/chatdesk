const { Router } = require("express");
const {
  auth,
  requireRole,
  requireOrganization,
} = require("../middlewares/auth");
const { requireFeature } = require("../middlewares/planGate");
const validate = require("../middlewares/validate");
const schemas = require("../validations/admin.validation");
const ctrl = require("../controllers/export.controller");

const router = Router();

// CSV export: auth + org + business plan only
router.get(
  "/",
  auth,
  requireOrganization,
  requireRole("owner", "admin"),
  requireFeature("canExportData"),
  validate(schemas.exportQuery, "query"),
  ctrl.exportCsv,
);

module.exports = router;
