const {
  downloadMediaMessage,
  getContentType,
} = require("@whiskeysockets/baileys");
const { supabaseAdmin } = require("../config/supabase");
const aiService = require("./ai.service");
const emailService = require("./email.service");
const { logActivity } = require("./activity.service");
const logger = require("../utils/logger");

// Lazy-loaded to avoid circular dependency
function getUploadMediaToStorage() {
  return require("./whatsapp.session").uploadMediaToStorage;
}

/**
 * Create in-app notification for specific org members.
 */
async function notifyOrgMembers({
  orgId,
  type,
  title,
  body,
  link,
  excludeUserId,
  emailData,
}) {
  try {
    const { data: members } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("organization_id", orgId)
      .eq("is_active", true);

    if (!members || members.length === 0) return;

    const notifications = [];
    const emailRecipients = [];
    for (const m of members) {
      if (m.id === excludeUserId) continue;

      const { data: prefs } = await supabaseAdmin
        .from("notification_preferences")
        .select("*")
        .eq("user_id", m.id)
        .single();

      const appKey = `${type}_app`;
      const emailKey = `${type}_email`;
      const shouldNotifyApp = !prefs || prefs[appKey] !== false;
      const shouldNotifyEmail = prefs && prefs[emailKey] === true;

      if (shouldNotifyApp) {
        notifications.push({
          organization_id: orgId,
          user_id: m.id,
          type,
          title,
          body: body || null,
          link: link || null,
        });
      }

      if (shouldNotifyEmail) {
        emailRecipients.push(m.id);
      }
    }

    if (notifications.length > 0) {
      await supabaseAdmin.from("notifications").insert(notifications);
    }

    if (emailRecipients.length > 0 && emailData) {
      for (const userId of emailRecipients) {
        try {
          const {
            data: { user },
          } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (!user?.email) continue;

          if (type === "new_message") {
            await emailService.sendNewMessageEmail({
              to: user.email,
              contactName: emailData.contactName,
              messagePreview: emailData.messagePreview,
            });
          } else if (type === "new_contact") {
            await emailService.sendNewContactEmail({
              to: user.email,
              contactName: emailData.contactName,
              contactPhone: emailData.contactPhone,
            });
          }
        } catch (err) {
          logger.error(
            `Failed to send email notification to ${userId}: ${err.message}`,
          );
        }
      }
    }
  } catch (err) {
    logger.error(`Failed to create notifications: ${err.message}`);
  }
}

/* ── Helpers to extract body/phone from Baileys message ── */

function getMessageBody(msg) {
  const m = msg.message;
  if (!m) return null;
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedDisplayText ||
    m.listResponseMessage?.title ||
    m.templateButtonReplyMessage?.selectedDisplayText ||
    null
  );
}

function getPhoneFromJid(jid) {
  return jid?.replace("@s.whatsapp.net", "").replace("@c.us", "") || "";
}

/**
 * Core handler for every incoming WhatsApp message (Baileys format).
 */
async function handleIncomingMessage(sock, msg, account) {
  const remoteJid = msg.key.remoteJid;
  if (!remoteJid) return;

  // Skip group messages and status broadcasts
  if (remoteJid.endsWith("@g.us")) return;
  if (remoteJid === "status@broadcast") return;

  const orgId = account.organization_id;
  const waAccountId = account.id;
  const rawPhone = getPhoneFromJid(remoteJid);

  // Find or create contact
  const contact = await findOrCreateContact(orgId, rawPhone, msg);

  // Find or create conversation
  const conversation = await findOrCreateConversation(
    orgId,
    waAccountId,
    contact.id,
  );

  // Store the incoming message
  const msgType = resolveMessageType(msg);
  let mediaUrl = null;
  if (msgType !== "text") {
    try {
      const buffer = await downloadMediaMessage(msg, "buffer", {});
      if (buffer) {
        const contentType = getContentType(msg.message);
        const mediaObj = msg.message?.[contentType];
        const mimetype = mediaObj?.mimetype || "application/octet-stream";
        const uploadMediaToStorage = getUploadMediaToStorage();
        mediaUrl = await uploadMediaToStorage(
          { data: buffer.toString("base64"), mimetype },
          orgId,
          conversation.id,
        );
      }
    } catch (err) {
      logger.warn(
        `Failed to download media for message ${msg.key.id}: ${err.message}`,
      );
    }
  }

  const body = getMessageBody(msg);

  const { data: savedMsg, error: msgError } = await supabaseAdmin
    .from("messages")
    .insert({
      conversation_id: conversation.id,
      organization_id: orgId,
      sender_type: "customer",
      sender_id: null,
      content: body,
      message_type: msgType,
      media_url: mediaUrl,
      whatsapp_message_id: msg.key.id || null,
      status: "delivered",
    })
    .select("id")
    .single();

  if (msgError) {
    logger.error(`Failed to save incoming message: ${msgError.message}`);
    return;
  }

  // Notify org members
  const contactName = contact.name || contact.phone_number;
  notifyOrgMembers({
    orgId,
    type: "new_message",
    title: `New message from ${contactName}`,
    body: body ? body.substring(0, 100) : "[media]",
    link: `/dashboard/conversations?id=${conversation.id}`,
    emailData: {
      contactName,
      messagePreview: body ? body.substring(0, 200) : "[media]",
    },
  });

  logActivity({
    organizationId: orgId,
    userId: null,
    action: "received",
    entityType: "message",
    entityId: savedMsg.id,
    metadata: { contactId: contact.id, conversationId: conversation.id },
  });

  // Check auto-reply rules
  if (body) {
    await checkAutoReply(sock, remoteJid, body, orgId, conversation);
  }

  // Evaluate AI triggers
  if (body) {
    try {
      const matchedTriggers = await aiService.evaluateTriggers(
        orgId,
        { body },
        contact,
        conversation,
      );
      for (const trigger of matchedTriggers) {
        await aiService.executeTriggerAction(trigger, {
          orgId,
          contact,
          conversation,
        });
      }
      if (matchedTriggers.some((t) => t.action_type === "assign_agent")) {
        const { data: refreshed } = await supabaseAdmin
          .from("conversations")
          .select("*")
          .eq("id", conversation.id)
          .single();
        if (refreshed) {
          Object.assign(conversation, refreshed);
        }
      }
    } catch (err) {
      logger.error(`Trigger evaluation error: ${err.message}`);
    }
  }

  // AI agent handling
  if (conversation.is_ai_handled && conversation.ai_agent_id && body) {
    try {
      const aiReply = await aiService.handleAIConversation(conversation, body);

      if (aiReply) {
        await sock.sendMessage(remoteJid, { text: aiReply });

        await supabaseAdmin.from("messages").insert({
          conversation_id: conversation.id,
          organization_id: orgId,
          sender_type: "ai_agent",
          sender_id: conversation.ai_agent_id,
          content: aiReply,
          message_type: "text",
          status: "sent",
        });
      }
    } catch (err) {
      logger.error(
        `AI agent error for conv ${conversation.id}: ${err.message}`,
      );
    }
  }
}

/**
 * Find existing contact by phone or create a new one.
 */
async function findOrCreateContact(orgId, phone, msg) {
  const { data: existing } = await supabaseAdmin
    .from("contacts")
    .select("*")
    .eq("organization_id", orgId)
    .eq("phone_number", phone)
    .single();

  if (existing) return existing;

  // Try to get contact name from Baileys message pushName
  let contactName = null;
  if (msg && msg.pushName) {
    contactName = msg.pushName;
  }

  const { data: created, error } = await supabaseAdmin
    .from("contacts")
    .insert({
      organization_id: orgId,
      phone_number: phone,
      name: contactName,
      classification: "new_lead",
      last_conversation_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    logger.error(`Failed to create contact for ${phone}: ${error.message}`);
    throw error;
  }

  logger.info(
    `Auto-created contact ${created.id} for phone ${phone} in org ${orgId}`,
  );

  notifyOrgMembers({
    orgId,
    type: "new_contact",
    title: `New contact: ${contactName || phone}`,
    body: `Phone: ${phone}`,
    link: `/dashboard/contacts`,
    emailData: {
      contactName: contactName || null,
      contactPhone: phone,
    },
  });

  logActivity({
    organizationId: orgId,
    userId: null,
    action: "created",
    entityType: "contact",
    entityId: created.id,
    metadata: { phone, source: "whatsapp_auto" },
  });

  return created;
}

/**
 * Find existing open conversation or create a new one.
 */
async function findOrCreateConversation(orgId, waAccountId, contactId) {
  const { data: existing } = await supabaseAdmin
    .from("conversations")
    .select("*")
    .eq("organization_id", orgId)
    .eq("whatsapp_account_id", waAccountId)
    .eq("contact_id", contactId)
    .in("status", ["open", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) return existing;

  const { data: created, error } = await supabaseAdmin
    .from("conversations")
    .insert({
      organization_id: orgId,
      whatsapp_account_id: waAccountId,
      contact_id: contactId,
      status: "open",
      last_message_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    logger.error(`Failed to create conversation: ${error.message}`);
    throw error;
  }

  logger.info(`Created conversation ${created.id} for contact ${contactId}`);
  return created;
}

/**
 * Check if the incoming message matches any auto-reply rule for this org.
 */
async function checkAutoReply(
  sock,
  remoteJid,
  messageBody,
  orgId,
  conversation,
) {
  const { data: rules, error } = await supabaseAdmin
    .from("auto_reply_rules")
    .select("*")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (error || !rules || rules.length === 0) return;

  const text = messageBody.toLowerCase().trim();

  for (const rule of rules) {
    const matched = rule.trigger_keywords.some((keyword) =>
      text.includes(keyword.toLowerCase().trim()),
    );

    if (matched) {
      logger.info(
        `Auto-reply rule "${rule.name}" matched for conv ${conversation.id}`,
      );

      let replyText = rule.response_text;

      if (rule.ai_agent_id) {
        try {
          const aiReply = await aiService.handleAIConversation(
            { ...conversation, ai_agent_id: rule.ai_agent_id },
            messageBody,
          );
          if (aiReply) {
            replyText = aiReply;
          }
        } catch (err) {
          logger.error(
            `AI agent error for auto-reply rule "${rule.name}": ${err.message}`,
          );
        }
      }

      try {
        await sock.sendMessage(remoteJid, { text: replyText });
      } catch (err) {
        logger.error(`Failed to send auto-reply: ${err.message}`);
        return;
      }

      await supabaseAdmin.from("messages").insert({
        conversation_id: conversation.id,
        organization_id: orgId,
        sender_type: "ai_agent",
        sender_id: rule.ai_agent_id || null,
        content: replyText,
        message_type: "text",
        status: "sent",
      });

      break;
    }
  }
}

/**
 * Send an outgoing message from a team member through WhatsApp.
 */
async function sendMessage(
  session,
  conversation,
  { content, messageType, mediaUrl, senderId },
) {
  const orgId = conversation.organization_id;
  const contactId = conversation.contact_id;

  const { data: contact, error: contactErr } = await supabaseAdmin
    .from("contacts")
    .select("phone_number")
    .eq("id", contactId)
    .single();

  if (contactErr || !contact) {
    throw new Error("Contact not found");
  }

  const jid = `${contact.phone_number}@s.whatsapp.net`;

  let waMessage;
  try {
    if (
      (messageType === "text" || messageType === "contact_card") &&
      !mediaUrl
    ) {
      waMessage = await session.sock.sendMessage(jid, { text: content });
    } else if (mediaUrl) {
      // Determine media type and send accordingly
      const mediaContent = buildMediaContent(messageType, mediaUrl, content);
      waMessage = await session.sock.sendMessage(jid, mediaContent);
    } else {
      waMessage = await session.sock.sendMessage(jid, {
        text: content || "[media]",
      });
    }
  } catch (err) {
    logger.error(`Failed to send WA message to ${jid}: ${err.message}`);
    throw err;
  }

  const { data: savedMsg, error: msgError } = await supabaseAdmin
    .from("messages")
    .insert({
      conversation_id: conversation.id,
      organization_id: orgId,
      sender_type: "team_member",
      sender_id: senderId,
      content: content || null,
      message_type: messageType || "text",
      media_url: mediaUrl || null,
      whatsapp_message_id: waMessage?.key?.id || null,
      status: "sent",
    })
    .select("*")
    .single();

  if (msgError) {
    logger.error(`Failed to store outgoing message: ${msgError.message}`);
    throw msgError;
  }

  return savedMsg;
}

/**
 * Build Baileys media content object from URL.
 */
function buildMediaContent(messageType, mediaUrl, caption) {
  if (messageType === "image") {
    return { image: { url: mediaUrl }, caption: caption || undefined };
  }
  if (messageType === "video") {
    return { video: { url: mediaUrl }, caption: caption || undefined };
  }
  if (messageType === "audio") {
    return { audio: { url: mediaUrl }, mimetype: "audio/mpeg" };
  }
  if (messageType === "document") {
    return {
      document: { url: mediaUrl },
      mimetype: "application/octet-stream",
      fileName: caption || "document",
    };
  }
  // Default: try as document
  return {
    document: { url: mediaUrl },
    mimetype: "application/octet-stream",
    fileName: caption || "file",
  };
}

/**
 * Map Baileys message types to our DB enum values.
 */
function resolveMessageType(msg) {
  const contentType = getContentType(msg.message);
  if (!contentType) return "text";

  if (contentType === "conversation" || contentType === "extendedTextMessage")
    return "text";
  if (contentType === "imageMessage") return "image";
  if (contentType === "videoMessage") return "video";
  if (contentType === "audioMessage") return "audio";
  if (contentType === "documentMessage") return "document";
  if (
    contentType === "locationMessage" ||
    contentType === "liveLocationMessage"
  )
    return "location";
  if (contentType === "stickerMessage") return "sticker";
  if (
    contentType === "contactMessage" ||
    contentType === "contactsArrayMessage"
  )
    return "contact_card";
  return "text";
}

module.exports = {
  handleIncomingMessage,
  sendMessage,
  findOrCreateContact,
  findOrCreateConversation,
  checkAutoReply,
  resolveMessageType,
};
