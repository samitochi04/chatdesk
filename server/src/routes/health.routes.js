const { Router } = require("express");
const catchAsync = require("../utils/catchAsync");

const router = Router();

router.get(
  "/",
  catchAsync(async (_req, res) => {
    res.json({
      success: true,
      message: "ChatDesk API is running",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    });
  }),
);

module.exports = router;
