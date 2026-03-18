const { Router } = require("express");
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const whatsappRoutes = require("./whatsapp.routes");
const aiRoutes = require("./ai.routes");
const broadcastRoutes = require("./broadcast.routes");
const adminRoutes = require("./admin.routes");
const exportRoutes = require("./export.routes");
const contactRoutes = require("./contact.routes");
const crmRoutes = require("./crm.routes");
const quickReplyRoutes = require("./quickReply.routes");
const notificationRoutes = require("./notification.routes");
const inviteRoutes = require("./invite.routes");

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/whatsapp", whatsappRoutes);
router.use("/ai", aiRoutes);
router.use("/broadcasts", broadcastRoutes);
router.use("/admin", adminRoutes);
router.use("/export", exportRoutes);
router.use("/contact", contactRoutes);
router.use("/crm", crmRoutes);
router.use("/quick-replies", quickReplyRoutes);
router.use("/notifications", notificationRoutes);
router.use("/invite", inviteRoutes);

module.exports = router;
