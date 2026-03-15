const Joi = require("joi");

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(4000),

  SUPABASE_URL: Joi.string().uri().required(),
  SUPABASE_ANON_KEY: Joi.string().required(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
  SUPABASE_JWT_SECRET: Joi.string().required(),

  OPENAI_API_KEY: Joi.string().allow("").default(""),

  SMTP_HOST: Joi.string().default("smtp.gmail.com"),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().allow("").default(""),
  SMTP_PASS: Joi.string().allow("").default(""),
  SMTP_SECURE: Joi.boolean().default(false),
  EMAIL_FROM: Joi.string().default("ChatDesk <noreply@chatdesk.org>"),
  SUPPORT_EMAIL: Joi.string().email().allow("").default(""),
  OWNER_EMAIL: Joi.string().email().allow("").default(""),

  CORS_ORIGINS: Joi.string().default("https://chatdesk.org"),

  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: Joi.number().default(100),

  LOG_LEVEL: Joi.string()
    .valid("error", "warn", "info", "debug")
    .default("info"),
}).unknown(true);

const { error, value: env } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

const config = {
  env: env.NODE_ENV,
  port: env.PORT,

  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: env.SUPABASE_JWT_SECRET,
  },

  openai: {
    apiKey: env.OPENAI_API_KEY,
  },

  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    secure: env.SMTP_SECURE,
    from: env.EMAIL_FROM,
    contactEmail: env.SUPPORT_EMAIL,
  },

  ownerEmail: env.OWNER_EMAIL,

  cors: {
    origins: env.CORS_ORIGINS.split(",").map((o) => o.trim()),
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  },

  logLevel: env.LOG_LEVEL,
};

module.exports = config;
