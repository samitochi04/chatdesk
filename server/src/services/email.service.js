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

/**
 * Send notification email for a new incoming WhatsApp message.
 */
async function sendNewMessageEmail({ to, contactName, messagePreview }) {
  const subject = `New message from ${contactName || "Unknown Contact"}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1;">ChatDesk</h2>
      <p>You have a new message from <strong>${escapeHtml(contactName || "Unknown Contact")}</strong>.</p>
      ${messagePreview ? `<div style="background-color: #f3f4f6; border-left: 4px solid #6366f1; padding: 12px 16px; margin: 16px 0; border-radius: 4px; color: #374151;">${escapeHtml(messagePreview)}</div>` : ""}
      <p style="color: #666; font-size: 12px; margin-top: 24px;">Log in to ChatDesk to reply.</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
}

/**
 * Send notification email for a new contact created.
 */
async function sendNewContactEmail({ to, contactName, contactPhone }) {
  const subject = `New contact: ${contactName || contactPhone || "Unknown"}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1;">ChatDesk</h2>
      <p>A new contact has been added to your organization:</p>
      <div style="background-color: #f3f4f6; padding: 12px 16px; margin: 16px 0; border-radius: 8px;">
        <p style="margin: 4px 0;"><strong>Name:</strong> ${escapeHtml(contactName || "N/A")}</p>
        <p style="margin: 4px 0;"><strong>Phone:</strong> ${escapeHtml(contactPhone || "N/A")}</p>
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 24px;">Log in to ChatDesk to view the contact.</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
}

/**
 * Send notification email for a deal stage update.
 */
async function sendDealUpdateEmail({ to, dealTitle, stageName, contactName }) {
  const subject = `Deal "${dealTitle}" moved to ${stageName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1;">ChatDesk</h2>
      <p>A deal has been updated in your pipeline:</p>
      <div style="background-color: #f3f4f6; padding: 12px 16px; margin: 16px 0; border-radius: 8px;">
        <p style="margin: 4px 0;"><strong>Deal:</strong> ${escapeHtml(dealTitle)}</p>
        <p style="margin: 4px 0;"><strong>Stage:</strong> ${escapeHtml(stageName)}</p>
        ${contactName ? `<p style="margin: 4px 0;"><strong>Contact:</strong> ${escapeHtml(contactName)}</p>` : ""}
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 24px;">Log in to ChatDesk to view the pipeline.</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
}

/**
 * Send notification email for broadcast completion.
 */
async function sendBroadcastEmail({ to, broadcastName }) {
  const subject = `Broadcast "${broadcastName || "Broadcast"}" started sending`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1;">ChatDesk</h2>
      <p>A broadcast has started sending:</p>
      <div style="background-color: #f3f4f6; padding: 12px 16px; margin: 16px 0; border-radius: 8px;">
        <p style="margin: 4px 0;"><strong>Broadcast:</strong> ${escapeHtml(broadcastName || "Broadcast")}</p>
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 24px;">Log in to ChatDesk to check its status.</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
}

module.exports = {
  sendEmail,
  sendInvitationEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendNewMessageEmail,
  sendNewContactEmail,
  sendDealUpdateEmail,
  sendBroadcastEmail,
};
