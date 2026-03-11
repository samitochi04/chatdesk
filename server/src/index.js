require("dotenv/config");
const app = require("./app");
const config = require("./config");
const logger = require("./utils/logger");
const { restoreAllSessions } = require("./services/whatsapp.session");
const { handleIncomingMessage } = require("./services/whatsapp.message");

const server = app.listen(config.port, async () => {
  logger.info(`ChatDesk server running on port ${config.port} [${config.env}]`);

  // Restore previously active WhatsApp sessions
  try {
    await restoreAllSessions(handleIncomingMessage);
  } catch (err) {
    logger.error(`Failed to restore WhatsApp sessions: ${err.message}`);
  }
});

// Graceful shutdown
const { sessions, destroySession } = require("./services/whatsapp.session");
const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);

  // Destroy all WhatsApp sessions
  for (const [accountId] of sessions) {
    try {
      await destroySession(accountId);
    } catch (err) {
      logger.warn(`Error closing WA session ${accountId}: ${err.message}`);
    }
  }

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
