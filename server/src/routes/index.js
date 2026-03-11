const { Router } = require("express");
const healthRoutes = require("./health.routes");
const whatsappRoutes = require("./whatsapp.routes");
const aiRoutes = require("./ai.routes");
const broadcastRoutes = require("./broadcast.routes");

const router = Router();

router.use("/health", healthRoutes);
router.use("/whatsapp", whatsappRoutes);
router.use("/ai", aiRoutes);
router.use("/broadcasts", broadcastRoutes);

// Future route groups (Step 5):
// router.use('/admin', adminRoutes);
// router.use('/export', exportRoutes);

module.exports = router;
