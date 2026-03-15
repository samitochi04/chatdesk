require("dotenv/config");
const app = require("./app");
const config = require("./config");
const logger = require("./utils/logger");
const { restoreAllSessions } = require("./services/whatsapp.session");
const { handleIncomingMessage } = require("./services/whatsapp.message");
const { supabaseAdmin } = require("./config/supabase");
const { sendEmail } = require("./services/email.service");

const server = app.listen(config.port, async () => {
  logger.info(`ChatDesk server running on port ${config.port} [${config.env}]`);

  // Restore previously active WhatsApp sessions
  try {
    await restoreAllSessions(handleIncomingMessage);
  } catch (err) {
    logger.error(`Failed to restore WhatsApp sessions: ${err.message}`);
  }

  // Listen for new user signups and notify owner
  if (config.ownerEmail) {
    supabaseAdmin
      .channel("new-signups")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        async (payload) => {
          try {
            const profile = payload.new;
            const name = profile.full_name || "Unknown";

            // Fetch the user's email from auth.users via admin API
            const { data: authUser } =
              await supabaseAdmin.auth.admin.getUserById(profile.id);
            const email = authUser?.user?.email || "unknown";

            logger.info(`New signup: ${name} (${email})`);

            await sendEmail({
              to: config.ownerEmail,
              subject: `[ChatDesk] New User Signup: ${name}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #2563eb;">New User Registration</h2>
                  <p>A new user has signed up on ChatDesk:</p>
                  <div style="background-color: #f3f4f6; padding: 16px; margin: 16px 0; border-radius: 8px; border-left: 4px solid #2563eb;">
                    <p style="margin: 4px 0;"><strong>Name:</strong> ${name}</p>
                    <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                  </div>
                  <p style="color: #666; font-size: 12px;">This is an automated notification from ChatDesk.</p>
                </div>
              `,
              text: `New user signup on ChatDesk:\nName: ${name}\nEmail: ${email}\nDate: ${new Date().toLocaleString()}`,
            });
          } catch (err) {
            logger.error(`Failed to send signup notification: ${err.message}`);
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          logger.info("Listening for new user signups");
        }
      });
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
