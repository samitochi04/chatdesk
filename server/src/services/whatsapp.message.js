const {
  downloadMediaMessage,
  getContentType,
  jidNormalizedUser,
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

function getMessageBody(messageContent) {
  if (!messageContent) return null;
  return (
    messageContent.conversation ||
    messageContent.extendedTextMessage?.text ||
    messageContent.imageMessage?.caption ||
    messageContent.videoMessage?.caption ||
    messageContent.documentMessage?.caption ||
    messageContent.buttonsResponseMessage?.selectedDisplayText ||
    messageContent.listResponseMessage?.title ||
    messageContent.templateButtonReplyMessage?.selectedDisplayText ||
    null
  );
}

function normalizePhoneCandidate(value) {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return digits;
}

function normalizeRemoteJid(jid) {
  if (!jid || typeof jid !== "string") return null;

  if (typeof jidNormalizedUser === "function") {
    return jidNormalizedUser(jid);
  }

  if (!jid.includes("@")) return null;
  const [user, server] = jid.split("@");
  const baseUser = user.includes(":") ? user.split(":")[0] : user;
  return `${baseUser}@${server}`;
}

function getPhoneFromJid(jid) {
  if (!jid || typeof jid !== "string" || !jid.includes("@")) return null;

  const [user, server] = jid.split("@");
  if (["g.us", "broadcast", "lid"].includes(server)) return null;

  const baseUser = user.includes(":") ? user.split(":")[0] : user;
  return normalizePhoneCandidate(baseUser);
}

function extractIncomingIdentity(msg) {
  const remoteJid = msg?.key?.remoteJid || null;
  const participantJid = msg?.key?.participant || null;
  const normalizedRemoteJid = normalizeRemoteJid(remoteJid) || remoteJid;

  const candidates = [remoteJid, participantJid, normalizedRemoteJid].filter(
    Boolean,
  );

  let phoneNumber = null;
  for (const candidate of candidates) {
    phoneNumber = getPhoneFromJid(candidate);
    if (phoneNumber) break;
  }

  return {
    remoteJid,
    normalizedRemoteJid,
    phoneNumber,
    displayName: msg?.pushName || null,
  };
}

function isValidUserJid(jid) {
  if (!jid) return false;
  // Skip group chats and broadcasts
  if (jid.endsWith("@g.us")) return false;
  if (jid === "status@broadcast") return false;
  // Allow @s.whatsapp.net, @c.us, and @lid (Baileys v7 linked-device JIDs)
  return true;
}

/** Unwrap ephemeral / viewOnce / documentWithCaption wrappers */
function unwrapMessage(message) {
  if (!message) return message;
  return (
    message.ephemeralMessage?.message ||
    message.viewOnceMessage?.message ||
    message.viewOnceMessageV2?.message ||
    message.documentWithCaptionMessage?.message ||
    message.editedMessage?.message ||
    message
  );
}

/**
 * Core handler for every incoming WhatsApp message (Baileys format).
 */
async function handleIncomingMessage(sock, msg, account, options = {}) {
  const { skipSideEffects = false, skipMediaDownload = false } = options;
  const identity = extractIncomingIdentity(msg);
  if (!identity.remoteJid) return;

  // Skip group messages and status broadcasts
  if (!isValidUserJid(identity.remoteJid)) return;

  // Unwrap ephemeral / viewOnce / documentWithCaption wrappers
  const normalized = unwrapMessage(msg.message);

  // Skip protocol/system messages with no real content
  const contentType = getContentType(normalized);
  if (
    !contentType ||
    contentType === "protocolMessage" ||
    contentType === "senderKeyDistributionMessage" ||
    contentType === "messageContextInfo"
  )
    return;

  const orgId = account.organization_id;
  const waAccountId = account.id;

  // Avoid double-processing when Baileys replays history or reconnect events.
  if (msg.key?.id) {
    const { data: existingMsg } = await supabaseAdmin
      .from("messages")
      .select("id")
      .eq("whatsapp_message_id", msg.key.id)
      .single();

    if (existingMsg) return;
  }

  // Skip messages from the connected account's own number
  if (identity.phoneNumber && identity.phoneNumber === account.phone_number)
    return;

  logger.info(
    `Incoming message from ${identity.phoneNumber || identity.remoteJid}: type=${contentType}`,
  );

  // Only attach to an existing contact. Unknown senders stay unsaved until manually saved.
  const contact = identity.phoneNumber
    ? await findContactByPhone(orgId, identity.phoneNumber)
    : null;

  // Find or create conversation
  const conversation = await findOrCreateConversation(orgId, waAccountId, {
    contactId: contact?.id || null,
    remoteJid: identity.normalizedRemoteJid,
    phoneNumber: identity.phoneNumber,
    displayName: identity.displayName,
  });

  // Store the incoming message
  const msgType = resolveMessageType(normalized);
  let mediaUrl = null;
  if (msgType !== "text" && !skipMediaDownload) {
    try {
      const buffer = await downloadMediaMessage(msg, "buffer", {});
      if (buffer) {
        const ct = getContentType(normalized);
        const mediaObj = normalized?.[ct];
        const mimetype = mediaObj?.mimetype || "application/octet-stream";
        const uploadMediaToStorage = getUploadMediaToStorage();
        mediaUrl = await uploadMediaToStorage(
          { data: buffer, mimetype },
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

  const body = getMessageBody(normalized);

  // For media messages without a caption, set a descriptive content
  // so the conversation preview doesn't show "No messages yet"
  const MEDIA_LABELS = {
    image: "\ud83d\udcf7 Photo",
    video: "\ud83c\udfa5 Video",
    audio: "\ud83c\udfa4 Voice message",
    document: "\ud83d\udcce Document",
    sticker: "Sticker",
    location: "\ud83d\udccd Location",
    contact_card: "\ud83d\udcc7 Contact",
  };
  const contentForDb = body || MEDIA_LABELS[msgType] || null;

  const { data: savedMsg, error: msgError } = await supabaseAdmin
    .from("messages")
    .insert({
      conversation_id: conversation.id,
      organization_id: orgId,
      sender_type: "customer",
      sender_id: null,
      content: contentForDb,
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
  const contactName =
    contact?.name ||
    contact?.phone_number ||
    conversation.participant_name ||
    conversation.participant_phone ||
    "Unknown";
  if (!skipSideEffects) {
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
      metadata: {
        contactId: contact?.id || null,
        conversationId: conversation.id,
      },
    });
  }

  // Check auto-reply rules
  if (body && !skipSideEffects) {
    await checkAutoReply(
      sock,
      identity.normalizedRemoteJid || identity.remoteJid,
      body,
      orgId,
      conversation,
    );
  }

  // Evaluate AI triggers
  if (body && !skipSideEffects) {
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
  if (
    !skipSideEffects &&
    conversation.is_ai_handled &&
    conversation.ai_agent_id &&
    body
  ) {
    try {
      const aiReply = await aiService.handleAIConversation(conversation, body);

      if (aiReply) {
        await sock.sendMessage(identity.normalizedRemoteJid || identity.remoteJid, {
          text: aiReply,
        });

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
 * Find existing contact by phone.
 */
async function findContactByPhone(orgId, phone) {
  const normalizedPhone = normalizePhoneCandidate(phone);
  if (!normalizedPhone) return null;

  const { data, error } = await supabaseAdmin
    .from("contacts")
    .select("*")
    .eq("organization_id", orgId)
    .eq("phone_number", normalizedPhone)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Find existing contact by phone or create a new one.
 */
async function findOrCreateContact(orgId, phone, msg) {
  const normalizedPhone = normalizePhoneCandidate(phone);
  if (!normalizedPhone) {
    throw new Error("Cannot create contact without a valid phone number");
  }

  const { data: existing } = await supabaseAdmin
    .from("contacts")
    .select("*")
    .eq("organization_id", orgId)
    .eq("phone_number", normalizedPhone)
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
      phone_number: normalizedPhone,
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

  return created;
}

/**
 * Find existing open conversation or create a new one.
 */
async function findOrCreateConversation(orgId, waAccountId, identity = {}) {
  const {
    contactId = null,
    remoteJid = null,
    phoneNumber = null,
    displayName = null,
  } = identity;

  const normalizedRemoteJid = normalizeRemoteJid(remoteJid) || remoteJid;
  const normalizedPhone = normalizePhoneCandidate(phoneNumber);

  if (!contactId && !normalizedRemoteJid && !normalizedPhone) {
    throw new Error("Cannot resolve conversation identity");
  }

  let query = supabaseAdmin
    .from("conversations")
    .select("*")
    .eq("organization_id", orgId)
    .eq("whatsapp_account_id", waAccountId)
    .in("status", ["open", "pending"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (contactId) {
    query = query.eq("contact_id", contactId);
  } else if (normalizedRemoteJid) {
    query = query.is("contact_id", null).eq("remote_jid", normalizedRemoteJid);
  } else {
    query = query.is("contact_id", null).eq("participant_phone", normalizedPhone);
  }

  const { data: existing, error: existingError } = await query.maybeSingle();
  if (existingError) {
    logger.error(`Failed to fetch conversation: ${existingError.message}`);
    throw existingError;
  }

  if (existing) return existing;

  if (contactId && normalizedPhone) {
    const { data: anonymousConversation } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("organization_id", orgId)
      .eq("whatsapp_account_id", waAccountId)
      .is("contact_id", null)
      .eq("participant_phone", normalizedPhone)
      .in("status", ["open", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (anonymousConversation) {
      const { data: promoted, error: promoteError } = await supabaseAdmin
        .from("conversations")
        .update({
          contact_id: contactId,
          participant_name:
            anonymousConversation.participant_name || displayName || null,
          remote_jid: anonymousConversation.remote_jid || normalizedRemoteJid,
        })
        .eq("id", anonymousConversation.id)
        .select("*")
        .single();

      if (promoteError) {
        logger.error(`Failed to promote conversation: ${promoteError.message}`);
        throw promoteError;
      }

      return promoted;
    }
  }

  const { data: created, error } = await supabaseAdmin
    .from("conversations")
    .insert({
      organization_id: orgId,
      whatsapp_account_id: waAccountId,
      contact_id: contactId,
      participant_phone: normalizedPhone,
      participant_name: displayName || null,
      remote_jid: normalizedRemoteJid,
      status: "open",
      last_message_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    logger.error(`Failed to create conversation: ${error.message}`);
    throw error;
  }

  logger.info(`Created conversation ${created.id} for account ${waAccountId}`);
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

  let destinationPhone = null;
  if (contactId) {
    const { data: contact, error: contactErr } = await supabaseAdmin
      .from("contacts")
      .select("phone_number")
      .eq("id", contactId)
      .single();

    if (!contactErr && contact?.phone_number) {
      destinationPhone = normalizePhoneCandidate(contact.phone_number);
    }
  }

  if (!destinationPhone) {
    destinationPhone = normalizePhoneCandidate(conversation.participant_phone);
  }

  const normalizedRemoteJid = normalizeRemoteJid(conversation.remote_jid);
  const jid = destinationPhone
    ? `${destinationPhone}@s.whatsapp.net`
    : normalizedRemoteJid;

  if (!jid) {
    throw new Error("Conversation recipient not found");
  }

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
    return { audio: { url: mediaUrl }, ptt: true };
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
function resolveMessageType(messageContent) {
  const contentType = getContentType(messageContent);
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
  findContactByPhone,
  findOrCreateContact,
  findOrCreateConversation,
  checkAutoReply,
  resolveMessageType,
};
