const { Router } = require("express");
const {
  auth,
  requireRole,
  requireOrganization,
} = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const schemas = require("../validations/admin.validation");
const ctrl = require("../controllers/admin.controller");

const router = Router();

/* ------------------------------------------------------------------ */
/*  Super-admin routes — organization approval                         */
/* ------------------------------------------------------------------ */

router.get(
  "/organizations/pending",
  auth,
  requireRole("super_admin"),
  ctrl.listPendingOrgs,
);

router.get(
  "/organizations",
  auth,
  requireRole("super_admin"),
  ctrl.listAllOrgs,
);

router.post(
  "/organizations/approve",
  auth,
  requireRole("super_admin"),
  validate(schemas.approveOrg),
  ctrl.approveOrg,
);

router.post(
  "/organizations/reject",
  auth,
  requireRole("super_admin"),
  validate(schemas.rejectOrg),
  ctrl.rejectOrg,
);

/* ------------------------------------------------------------------ */
/*  Super-admin platform-wide routes (no org context needed)           */
/* ------------------------------------------------------------------ */

router.get(
  "/platform/stats",
  auth,
  requireRole("super_admin"),
  ctrl.getPlatformStats,
);

router.get(
  "/platform/users",
  auth,
  requireRole("super_admin"),
  ctrl.listAllUsers,
);

router.get(
  "/platform/invitations",
  auth,
  requireRole("super_admin"),
  ctrl.listAllInvitations,
);

router.post(
  "/platform/invitations/:id/cancel",
  auth,
  requireRole("super_admin"),
  validate(schemas.idParam, "params"),
  ctrl.cancelAnyInvitation,
);

router.post(
  "/organizations/create",
  auth,
  requireRole("super_admin"),
  validate(schemas.createOrg),
  ctrl.createOrganization,
);

router.get(
  "/organizations/:id",
  auth,
  requireRole("super_admin"),
  validate(schemas.idParam, "params"),
  ctrl.getOrgDetail,
);

router.patch(
  "/organizations/:id",
  auth,
  requireRole("super_admin"),
  validate(schemas.idParam, "params"),
  validate(schemas.updateOrg),
  ctrl.updateOrg,
);

router.patch(
  "/platform/users/:id",
  auth,
  requireRole("super_admin"),
  validate(schemas.idParam, "params"),
  validate(schemas.updateUser),
  ctrl.updateUser,
);

/* ------------------------------------------------------------------ */
/*  Org-scoped routes (require auth + org context)                     */
/* ------------------------------------------------------------------ */

router.use(auth, requireOrganization);

/* ---- Team invitations ---- */

router.post(
  "/invitations",
  requireRole("owner"),
  validate(schemas.createInvitation),
  ctrl.createInvitation,
);

router.get("/invitations", ctrl.listInvitations);

router.post(
  "/invitations/:id/cancel",
  requireRole("owner"),
  validate(schemas.idParam, "params"),
  ctrl.cancelInvitation,
);

/* ---- Team members ---- */

router.get("/team", ctrl.listTeamMembers);

router.patch(
  "/team/:id",
  requireRole("owner"),
  validate(schemas.idParam, "params"),
  ctrl.updateTeamMember,
);

/* ---- Activity log ---- */

router.get(
  "/activity",
  validate(schemas.activityQuery, "query"),
  ctrl.listActivity,
);

/* ---- Dashboard ---- */

router.get("/dashboard", ctrl.getDashboard);

/* ---- Analytics ---- */

router.get("/analytics", ctrl.getAnalytics);

module.exports = router;
