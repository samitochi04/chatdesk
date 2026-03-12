const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const config = require("./config");
const { apiLimiter } = require("./middlewares/rateLimiter");
const errorHandler = require("./middlewares/errorHandler");
const ApiError = require("./utils/ApiError");
const routes = require("./routes");

const app = express();

// ── Security ────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
  }),
);

// ── Parsing ─────────────────────────────────
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ─────────────────────────────────
if (config.env !== "test") {
  app.use(morgan("short"));
}

// ── Rate limiting ───────────────────────────
app.use("/api", apiLimiter);

// ── API Routes ──────────────────────────────
app.use("/api", routes);

// ── 404 catch-all ───────────────────────────
app.use((_req, _res, next) => {
  next(ApiError.notFound("Route not found"));
});

// ── Global error handler ────────────────────
app.use(errorHandler);

module.exports = app;
