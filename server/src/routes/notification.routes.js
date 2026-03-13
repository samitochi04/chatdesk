const { Router } = require("express");
const { auth } = require("../middlewares/auth");
const {
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  getPreferences,
  updatePreferences,
} = require("../controllers/notification.controller");

const router = Router();

// Notifications are user-scoped, not org-scoped — only auth required
router.use(auth);

router.get("/", listNotifications);
router.get("/unread-count", getUnreadCount);
router.post("/read-all", markAllRead);
router.patch("/:id/read", markRead);

router.get("/preferences", getPreferences);
router.put("/preferences", updatePreferences);

module.exports = router;
