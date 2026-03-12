const { Router } = require("express");
const { auth, requireOrganization } = require("../middlewares/auth");
const {
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  getPreferences,
  updatePreferences,
} = require("../controllers/notification.controller");

const router = Router();

router.use(auth, requireOrganization);

router.get("/", listNotifications);
router.get("/unread-count", getUnreadCount);
router.post("/read-all", markAllRead);
router.patch("/:id/read", markRead);

router.get("/preferences", getPreferences);
router.put("/preferences", updatePreferences);

module.exports = router;
