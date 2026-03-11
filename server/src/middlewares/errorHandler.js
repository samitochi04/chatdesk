const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");
const config = require("../config");

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let details = err.details || null;

  // Joi validation errors
  if (err.isJoi) {
    statusCode = 400;
    message = "Validation error";
    details = err.details.map((d) => d.message);
  }

  // Log only server errors (5xx) with stack
  if (statusCode >= 500) {
    logger.error(err.stack || err.message);
  } else {
    logger.warn(`${statusCode} — ${message}`);
  }

  const response = {
    success: false,
    message,
    ...(details && { details }),
    ...(config.env === "development" &&
      statusCode >= 500 && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
