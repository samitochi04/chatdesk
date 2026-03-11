const { Router } = require("express");
const healthRoutes = require("./health.routes");
const whatsappRoutes = require("./whatsapp.routes");

const router = Router();

router.use("/health", healthRoutes);
router.use("/whatsapp", whatsappRoutes);

// Future route groups (Steps 3-5):
// router.use('/ai', aiRoutes);
// router.use('/broadcasts', broadcastRoutes);
// router.use('/admin', adminRoutes);
// router.use('/export', exportRoutes);

module.exports = router;
