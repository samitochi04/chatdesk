const { supabaseAdmin } = require("../config/supabase");
const logger = require("../utils/logger");

/**
 * Core handler for every incoming WhatsApp message.
 *
 * Flow:
 *  1. Ignore non-chat messages (status broadcasts, etc.)
 *  2. Find or create the contact
 *  3. Find or create the conversation
 *  4. Store the message
 *  5. Check auto-reply rules → send canned response if matched
 *  6. If conversation is AI-handled, forward to AI agent (Step 3 placeholder)
 */
async function handleIncomingMessage(client, message, account) {
  // 1. Ignore group messages and status broadcasts
  const chat = await message.getChat();
  if (chat.isGroup) return;
  if (message.from === "status@broadcast") return;

  const orgId = account.organization_id;
  const waAccountId = account.id;
  // WhatsApp phone format: "5511999998888@c.us"
  const rawPhone = message.from.replace("@c.us", "");

  // 2. Find or create contact
  const contact = await findOrCreateContact(orgId, rawPhone, message);

  // 3. Find or create conversation
  const conversation = await findOrCreateConversation(
    orgId,
    waAccountId,
    contact.id,
  );

  // 4. Store the incoming message
  const msgType = resolveMessageType(message);
  let mediaUrl = null;
  if (message.hasMedia) {
    try {
      const media = await message.downloadMedia();
      if (media) {
        mediaUrl = `data:${media.mimetype};base64,${media.data}`;
      }
    } catch (err) {
      logger.warn(
        `Failed to download media for message ${message.id._serialized}: ${err.message}`,
      );
    }
  }

  const { data: savedMsg, error: msgError } = await supabaseAdmin
    .from("messages")
    .insert({
      conversation_id: conversation.id,
      organization_id: orgId,
      sender_type: "customer",
      sender_id: null,
      content: message.body || null,
      message_type: msgType,
      media_url: mediaUrl,
      whatsapp_message_id: message.id._serialized || null,
      status: "delivered",
    })
    .select("id")
    .single();

  if (msgError) {
    logger.error(`Failed to save incoming message: ${msgError.message}`);
    return;
  }

  // 5. Check auto-reply rules
  if (message.body) {
    await checkAutoReply(client, message, orgId, conversation);
  }

  // 6. AI agent handling (placeholder — implemented in Step 3)
  if (conversation.is_ai_handled && conversation.ai_agent_id) {
    // Will be filled in Step 3: aiService.handleConversation(...)
    logger.debug(
      `AI agent ${conversation.ai_agent_id} should handle message in conv ${conversation.id}`,
    );
  }
}

/**
 * Find existing contact by phone or create a new one.
 */
async function findOrCreateContact(orgId, phone, message) {
  const { data: existing } = await supabaseAdmin
    .from("contacts")
    .select("*")
    .eq("organization_id", orgId)
    .eq("phone_number", phone)
    .single();

  if (existing) return existing;

  // Try to get the contact name from WhatsApp
  let contactName = null;
  try {
    const waContact = await message.getContact();
    contactName = waContact.pushname || waContact.name || null;
  } catch (_) {
    // ignore
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
  return created;
}

/**
 * Find existing open conversation or create a new one.
 */
async function findOrCreateConversation(orgId, waAccountId, contactId) {
  // Look for an open/pending conversation for this contact + WA account
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
 * Rules are sorted by priority DESC — first match wins.
 */
async function checkAutoReply(client, message, orgId, conversation) {
  const { data: rules, error } = await supabaseAdmin
    .from("auto_reply_rules")
    .select("*")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (error || !rules || rules.length === 0) return;

  const text = message.body.toLowerCase().trim();

  for (const rule of rules) {
    const matched = rule.trigger_keywords.some((keyword) =>
      text.includes(keyword.toLowerCase().trim()),
    );

    if (matched) {
      logger.info(
        `Auto-reply rule "${rule.name}" matched for conv ${conversation.id}`,
      );

      // Send the canned response via WhatsApp
      try {
        await client.sendMessage(message.from, rule.response_text);
      } catch (err) {
        logger.error(`Failed to send auto-reply: ${err.message}`);
        return;
      }

      // Store the auto-reply message in DB
      await supabaseAdmin.from("messages").insert({
        conversation_id: conversation.id,
        organization_id: orgId,
        sender_type: "ai_agent",
        sender_id: rule.ai_agent_id || null,
        content: rule.response_text,
        message_type: "text",
        status: "sent",
      });

      break; // first match wins
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

  // Get the contact's phone number
  const { data: contact, error: contactErr } = await supabaseAdmin
    .from("contacts")
    .select("phone_number")
    .eq("id", contactId)
    .single();

  if (contactErr || !contact) {
    throw new Error("Contact not found");
  }

  const chatId = `${contact.phone_number}@c.us`;

  // Send via WhatsApp
  let waMessage;
  try {
    if (messageType === "text" || !mediaUrl) {
      waMessage = await session.client.sendMessage(chatId, content);
    } else {
      // For media messages, we'd need to handle MessageMedia
      // For now send as text with a note about media
      waMessage = await session.client.sendMessage(
        chatId,
        content || "[media]",
      );
    }
  } catch (err) {
    logger.error(`Failed to send WA message to ${chatId}: ${err.message}`);
    throw err;
  }

  // Store the outgoing message in DB
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
      whatsapp_message_id: waMessage?.id?._serialized || null,
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
 * Map whatsapp-web.js message types to our DB enum values.
 */
function resolveMessageType(message) {
  if (message.type === "chat") return "text";
  if (message.type === "image") return "image";
  if (message.type === "video") return "video";
  if (message.type === "ptt" || message.type === "audio") return "audio";
  if (message.type === "document") return "document";
  if (message.type === "location") return "location";
  if (message.type === "sticker") return "sticker";
  if (message.type === "vcard" || message.type === "multi_vcard")
    return "contact_card";
  return "text";
}

module.exports = {
  handleIncomingMessage,
  sendMessage,
  findOrCreateContact,
  findOrCreateConversation,
  checkAutoReply,
};
