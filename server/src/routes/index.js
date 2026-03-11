const { Router } = require("express");
const healthRoutes = require("./health.routes");

const router = Router();

router.use("/health", healthRoutes);

// Future route groups (Steps 2-5):
// router.use('/whatsapp', whatsappRoutes);
// router.use('/ai', aiRoutes);
// router.use('/broadcasts', broadcastRoutes);
// router.use('/admin', adminRoutes);
// router.use('/export', exportRoutes);

module.exports = router;
