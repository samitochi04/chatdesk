const winston = require("winston");
const fs = require("fs");
const path = require("path");
const config = require("../config");

const LOG_RETENTION_DAYS = 7;
const LOG_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const LOG_FILES = ["error.log", "combined.log"];
const logsDir = path.join(process.cwd(), "logs");

function truncateOldLogsIfNeeded() {
  const cutoff = Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;

  for (const fileName of LOG_FILES) {
    const filePath = path.join(logsDir, fileName);
    try {
      if (!fs.existsSync(filePath)) continue;

      const stat = fs.statSync(filePath);
      if (stat.mtimeMs < cutoff) {
        fs.truncateSync(filePath, 0);
      }
    } catch {
      // Ignore cleanup errors to avoid impacting app startup/runtime.
    }
  }
}

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

truncateOldLogsIfNeeded();
setInterval(truncateOldLogsIfNeeded, LOG_CLEANUP_INTERVAL_MS).unref();

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "chatdesk-server" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

if (config.env !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack }) => {
          return `${timestamp} ${level}: ${stack || message}`;
        }),
      ),
    }),
  );
}

module.exports = logger;
