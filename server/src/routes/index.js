const { Router } = require("express");
const healthRoutes = require("./health.routes");
const whatsappRoutes = require("./whatsapp.routes");
const aiRoutes = require("./ai.routes");

const router = Router();

router.use("/health", healthRoutes);
router.use("/whatsapp", whatsappRoutes);
router.use("/ai", aiRoutes);

// Future route groups (Steps 4-5):
// router.use('/broadcasts', broadcastRoutes);
// router.use('/admin', adminRoutes);
// router.use('/export', exportRoutes);

module.exports = router;
