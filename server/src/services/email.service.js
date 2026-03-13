const nodemailer = require("nodemailer");
const config = require("../config");
const logger = require("../utils/logger");

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

/**
 * Send an email using the configured SMTP transport.
 */
async function sendEmail({ to, subject, html, text }) {
  if (!config.smtp.user || !config.smtp.pass) {
    logger.warn("SMTP not configured — skipping email send");
    return null;
  }

  const info = await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject,
    html,
    text,
  });

  logger.info(`Email sent to ${to}: ${info.messageId}`);
  return info;
}

/**
 * Send a team invitation email.
 */
async function sendInvitationEmail({ to, orgName, role, inviteUrl }) {
  const subject = `You're invited to join ${orgName} on ChatDesk`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1;">ChatDesk</h2>
      <p>You've been invited to join <strong>${escapeHtml(orgName)}</strong> as a <strong>${escapeHtml(role)}</strong>.</p>
      <p>Click the button below to accept your invitation and set up your account:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${escapeHtml(inviteUrl)}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Accept Invitation
        </a>
      </div>
      <p style="color: #666; font-size: 12px;">This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
}

/**
 * Send a password reset email.
 */
async function sendPasswordResetEmail({ to, resetUrl }) {
  const subject = "Reset your ChatDesk password";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1;">ChatDesk</h2>
      <p>We received a request to reset your password.</p>
      <p>Click the button below to set a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${escapeHtml(resetUrl)}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Reset Password
        </a>
      </div>
      <p style="color: #666; font-size: 12px;">If you didn't request this, you can safely ignore this email. This link expires in 1 hour.</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
}

/**
 * Send a verification / welcome email.
 */
async function sendVerificationEmail({ to, verifyUrl, name }) {
  const subject = "Verify your ChatDesk account";
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hi,";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1;">ChatDesk</h2>
      <p>${greeting}</p>
      <p>Welcome to ChatDesk! Please verify your email address to get started:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${escapeHtml(verifyUrl)}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Verify Email
        </a>
      </div>
      <p style="color: #666; font-size: 12px;">If you didn't create a ChatDesk account, you can safely ignore this email.</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = {
  sendEmail,
  sendInvitationEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
};
