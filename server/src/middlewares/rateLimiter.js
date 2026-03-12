const rateLimit = require("express-rate-limit");

/**
 * Key generator — rate-limit per authenticated user (by JWT sub),
 * falling back to IP for unauthenticated requests.
 */
function keyGenerator(req) {
  return req.user?.id || req.ip;
}

/**
 * General API limiter — generous limits for normal dashboard use.
 * 300 requests per minute per user.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    success: false,
    message: "Too many requests, please try again in a moment.",
  },
});

/**
 * Stricter limiter for auth routes (login, register, password reset).
 * 20 requests per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts, please try again later.",
  },
});

/**
 * WhatsApp send limiter — protect against spam / WhatsApp bans.
 * 60 messages per minute per user.
 */
const whatsappSendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    success: false,
    message: "Message rate limit reached. Please slow down.",
  },
});

module.exports = { apiLimiter, authLimiter, whatsappSendLimiter };
