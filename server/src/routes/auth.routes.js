const { Router } = require("express");
const { sendEmail } = require("../services/email.service");
const { auth } = require("../middlewares/auth");
const { supabaseAdmin } = require("../config/supabase");
const config = require("../config");
const logger = require("../utils/logger");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");

const router = Router();

/**
 * POST /api/auth/signup-notify
 * Called by the frontend after a successful signup to notify the owner.
 * No auth required (user hasn't confirmed email yet).
 * Rate-limited via the global rate limiter.
 */
router.post(
  "/signup-notify",
  catchAsync(async (req, res) => {
    const { name, email } = req.body;

    if (!email || typeof email !== "string") {
      throw ApiError.badRequest("Email is required");
    }

    if (!config.ownerEmail) {
      logger.warn("OWNER_EMAIL not configured — skipping signup notification");
      return res.json({ success: true });
    }

    const safeName = (name || "Unknown").slice(0, 200);
    const safeEmail = email.slice(0, 200);

    await sendEmail({
      to: config.ownerEmail,
      subject: `[ChatDesk] New User Signup: ${safeName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">New User Registration</h2>
          <p>A new user has signed up on ChatDesk:</p>
          <div style="background-color: #f3f4f6; padding: 16px; margin: 16px 0; border-radius: 8px; border-left: 4px solid #2563eb;">
            <p style="margin: 4px 0;"><strong>Name:</strong> ${safeName}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${safeEmail}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="color: #666; font-size: 12px;">This is an automated notification from ChatDesk.</p>
        </div>
      `,
      text: `New user signup on ChatDesk:\nName: ${safeName}\nEmail: ${safeEmail}\nDate: ${new Date().toLocaleString()}`,
    });

    logger.info(`Signup notification sent for ${safeEmail}`);
    res.json({ success: true });
  }),
);

/**
 * POST /api/auth/onboarding
 * Authenticated user submits business info for account setup.
 * Sends the info to the owner via email.
 */
router.post(
  "/onboarding",
  auth,
  catchAsync(async (req, res) => {
    const { businessName, phone, businessType, country } = req.body;

    if (!businessName || typeof businessName !== "string") {
      throw ApiError.badRequest("Business name is required");
    }

    const userId = req.user.id;

    // Get the user's email from auth
    const { data: authUser } =
      await supabaseAdmin.auth.admin.getUserById(userId);
    const userEmail = authUser?.user?.email || "unknown";
    const userName = req.user.fullName || "Unknown";

    const safeBiz = businessName.slice(0, 200);
    const safePhone = (phone || "").slice(0, 50);
    const safeType = (businessType || "").slice(0, 100);
    const safeCountry = (country || "").slice(0, 100);

    if (config.ownerEmail) {
      await sendEmail({
        to: config.ownerEmail,
        subject: `[ChatDesk] Onboarding Request: ${safeBiz}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">New Onboarding Request</h2>
            <p>A user has submitted their business information for account setup:</p>
            <div style="background-color: #f3f4f6; padding: 16px; margin: 16px 0; border-radius: 8px; border-left: 4px solid #2563eb;">
              <p style="margin: 4px 0;"><strong>User:</strong> ${userName} (${userEmail})</p>
              <p style="margin: 4px 0;"><strong>Business Name:</strong> ${safeBiz}</p>
              <p style="margin: 4px 0;"><strong>Phone:</strong> ${safePhone || "N/A"}</p>
              <p style="margin: 4px 0;"><strong>Business Type:</strong> ${safeType || "N/A"}</p>
              <p style="margin: 4px 0;"><strong>Country:</strong> ${safeCountry || "N/A"}</p>
              <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p>Please create an organization and assign this user in the admin panel.</p>
            <p style="color: #666; font-size: 12px;">This is an automated notification from ChatDesk.</p>
          </div>
        `,
        text: `New onboarding request:\nUser: ${userName} (${userEmail})\nBusiness: ${safeBiz}\nPhone: ${safePhone}\nType: ${safeType}\nCountry: ${safeCountry}`,
      });
    }

    logger.info(`Onboarding request submitted by ${userId} for "${safeBiz}"`);
    res.json({ success: true, message: "Onboarding request submitted" });
  }),
);

module.exports = router;
