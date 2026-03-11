require("dotenv/config");
const app = require("./app");
const config = require("./config");
const logger = require("./utils/logger");

const server = app.listen(config.port, () => {
  logger.info(`ChatDesk server running on port ${config.port} [${config.env}]`);
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});
