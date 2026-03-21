const { supabaseAdmin } = require("../config/supabase");
const logger = require("../utils/logger");

// Lazy-require to break circular dependency with whatsapp.session
function getSessionManager() {
  return require("./whatsapp.session");
}

/** Default delay between individual messages (ms) — anti-ban */
const DEFAULT_DELAY_MS = 3000;

/** Maximum concurrent broadcast workers */
let activeBroadcasts = 0;
const MAX_CONCURRENT = 3;

/* ================================================================== */
/*  Schedule a broadcast                                               */
/* ================================================================== */

/**
 * Resolve recipients from target tags, populate broadcast_recipients,
 * and move the broadcast to "scheduled" status.
 *
 * @param {string} broadcastId
 * @param {string} orgId
 * @returns {object} Updated broadcast row
 */
async function scheduleBroadcast(broadcastId, orgId) {
  // Load broadcast
  const { data: broadcast, error: bErr } = await supabaseAdmin
    .from("broadcasts")
    .select("*")
    .eq("id", broadcastId)
    .eq("organization_id", orgId)
    .single();

  if (bErr || !broadcast) throw new Error("Broadcast not found");
  if (!["draft"].includes(broadcast.status)) {
    throw new Error(
      `Cannot schedule a broadcast with status "${broadcast.status}"`,
    );
  }

  // Resolve contacts from classification criteria (primary) or legacy tags
  let contactIds = [];

  if (
    broadcast.target_classifications &&
    broadcast.target_classifications.length > 0
  ) {
    const { data: classifiedContacts } = await supabaseAdmin
      .from("contacts")
      .select("id")
      .eq("organization_id", orgId)
      .in("classification", broadcast.target_classifications);

    if (classifiedContacts) {
      contactIds = classifiedContacts.map((c) => c.id);
    }
  } else if (broadcast.target_tag_ids && broadcast.target_tag_ids.length > 0) {
    const { data: taggedContacts } = await supabaseAdmin
      .from("contact_tags")
      .select("contact_id")
      .in("tag_id", broadcast.target_tag_ids);

    if (taggedContacts) {
      // Deduplicate
      contactIds = [...new Set(taggedContacts.map((tc) => tc.contact_id))];
    }
  } else {
    // No tags specified → all contacts in the org
    const { data: allContacts } = await supabaseAdmin
      .from("contacts")
      .select("id")
      .eq("organization_id", orgId);

    if (allContacts) {
      contactIds = allContacts.map((c) => c.id);
    }
  }

  if (contactIds.length === 0) {
    throw new Error("No recipients found for the selected filters");
  }

  // Insert broadcast_recipients (ignore duplicates with onConflict)
  const rows = contactIds.map((contactId) => ({
    broadcast_id: broadcastId,
    contact_id: contactId,
    status: "pending",
  }));

  // Insert in batches of 500
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error: insertErr } = await supabaseAdmin
      .from("broadcast_recipients")
      .upsert(batch, {
        onConflict: "broadcast_id,contact_id",
        ignoreDuplicates: true,
      });

    if (insertErr) {
      logger.error(
        `Failed to insert broadcast recipients: ${insertErr.message}`,
      );
      throw new Error("Failed to populate recipients");
    }
  }

  // Update broadcast status
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from("broadcasts")
    .update({
      status: "scheduled",
      total_recipients: contactIds.length,
      scheduled_at: broadcast.scheduled_at || new Date().toISOString(),
    })
    .eq("id", broadcastId)
    .select("*")
    .single();

  if (updateErr) throw new Error("Failed to update broadcast status");

  logger.info(
    `Broadcast ${broadcastId} scheduled with ${contactIds.length} recipient(s)`,
  );
  return updated;
}

/* ================================================================== */
/*  Sending Worker                                                     */
/* ================================================================== */

/**
 * Start sending a broadcast. Runs asynchronously — the caller does not
 * need to await completion.
 *
 * @param {string} broadcastId
 * @param {object} options - { delayMs }
 */
async function startSending(broadcastId, options = {}) {
  if (activeBroadcasts >= MAX_CONCURRENT) {
    throw new Error(
      "Too many broadcasts sending concurrently, try again later",
    );
  }

  const delayMs = options.delayMs ?? DEFAULT_DELAY_MS;

  // Load broadcast
  const { data: broadcast, error: bErr } = await supabaseAdmin
    .from("broadcasts")
    .select("*")
    .eq("id", broadcastId)
    .single();

  if (bErr || !broadcast) throw new Error("Broadcast not found");
  if (!["scheduled"].includes(broadcast.status)) {
    throw new Error(
      `Broadcast status is "${broadcast.status}", expected "scheduled"`,
    );
  }

  // Verify WhatsApp session
  const session = getSessionManager().getSession(broadcast.whatsapp_account_id);
  if (!session || session.status !== "connected") {
    throw new Error("WhatsApp account is not connected");
  }

  // Mark as sending
  await supabaseAdmin
    .from("broadcasts")
    .update({ status: "sending" })
    .eq("id", broadcastId);

  // Fire-and-forget the actual sending loop
  activeBroadcasts++;
  processBroadcast(broadcast, session, delayMs).finally(() => {
    activeBroadcasts--;
  });
}

/**
 * Internal: process all pending recipients for a broadcast.
 */
async function processBroadcast(broadcast, session, delayMs) {
  const broadcastId = broadcast.id;

  try {
    // Load pending recipients with contact phone numbers
    const { data: recipients, error: rErr } = await supabaseAdmin
      .from("broadcast_recipients")
      .select("id, contact_id, contacts(phone_number)")
      .eq("broadcast_id", broadcastId)
      .eq("status", "pending");

    if (rErr || !recipients) {
      logger.error(`Failed to load recipients for broadcast ${broadcastId}`);
      await markBroadcastStatus(broadcastId, "failed");
      return;
    }

    let sentCount = 0;
    let failCount = 0;

    for (const recipient of recipients) {
      const phone = recipient.contacts?.phone_number;
      if (!phone) {
        await updateRecipientStatus(
          recipient.id,
          "failed",
          "Missing phone number",
        );
        failCount++;
        continue;
      }

      const jid = `${phone}@s.whatsapp.net`;

      try {
        const waMsg = await session.sock.sendMessage(jid, {
          text: broadcast.message_template,
        });

        await supabaseAdmin
          .from("broadcast_recipients")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            whatsapp_message_id: waMsg?.key?.id || null,
          })
          .eq("id", recipient.id);

        sentCount++;
      } catch (err) {
        logger.warn(
          `Broadcast ${broadcastId}: failed to send to ${phone}: ${err.message}`,
        );
        await updateRecipientStatus(recipient.id, "failed", err.message);
        failCount++;
      }

      // Anti-ban delay between messages
      if (delayMs > 0) {
        await sleep(delayMs);
      }
    }

    // Finalize broadcast
    await supabaseAdmin
      .from("broadcasts")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        delivered_count: sentCount,
      })
      .eq("id", broadcastId);

    logger.info(
      `Broadcast ${broadcastId} complete: ${sentCount} sent, ${failCount} failed`,
    );
  } catch (err) {
    logger.error(`Broadcast ${broadcastId} worker crashed: ${err.message}`);
    await markBroadcastStatus(broadcastId, "failed");
  }
}

/* ================================================================== */
/*  Delivery Tracking                                                  */
/* ================================================================== */

/**
 * Called from the message_ack handler in whatsapp.session.js.
 * Updates broadcast_recipients status when receipts arrive.
 *
 * @param {string} waMessageId - The serialized WhatsApp message ID
 * @param {string} newStatus - "sent" | "delivered" | "read"
 */
async function handleBroadcastAck(waMessageId, newStatus) {
  if (!waMessageId) return;

  const timestampCol =
    newStatus === "delivered"
      ? "delivered_at"
      : newStatus === "read"
        ? "read_at"
        : null;

  const update = { status: newStatus };
  if (timestampCol) {
    update[timestampCol] = new Date().toISOString();
  }

  const { data: recipient, error } = await supabaseAdmin
    .from("broadcast_recipients")
    .update(update)
    .eq("whatsapp_message_id", waMessageId)
    .select("broadcast_id")
    .single();

  // No match means this ack isn't for a broadcast message — that's fine
  if (error || !recipient) return;

  // Roll up counts on the broadcasts row
  await rollUpCounts(recipient.broadcast_id);
}

/**
 * Recalculate delivered_count, read_count on the broadcast from recipients.
 */
async function rollUpCounts(broadcastId) {
  const { data: stats } = await supabaseAdmin
    .from("broadcast_recipients")
    .select("status")
    .eq("broadcast_id", broadcastId);

  if (!stats) return;

  const delivered = stats.filter(
    (r) => r.status === "delivered" || r.status === "read",
  ).length;
  const read = stats.filter((r) => r.status === "read").length;

  await supabaseAdmin
    .from("broadcasts")
    .update({ delivered_count: delivered, read_count: read })
    .eq("id", broadcastId);
}

/* ================================================================== */
/*  Cancel broadcast                                                   */
/* ================================================================== */

async function cancelBroadcast(broadcastId, orgId) {
  const { data: broadcast } = await supabaseAdmin
    .from("broadcasts")
    .select("id, status")
    .eq("id", broadcastId)
    .eq("organization_id", orgId)
    .single();

  if (!broadcast) throw new Error("Broadcast not found");
  if (!["draft", "scheduled"].includes(broadcast.status)) {
    throw new Error(
      `Cannot cancel a broadcast with status "${broadcast.status}"`,
    );
  }

  await supabaseAdmin
    .from("broadcasts")
    .update({ status: "cancelled" })
    .eq("id", broadcastId);

  logger.info(`Broadcast ${broadcastId} cancelled`);
}

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

async function updateRecipientStatus(recipientId, status, reason) {
  await supabaseAdmin
    .from("broadcast_recipients")
    .update({ status, failed_reason: reason || null })
    .eq("id", recipientId);
}

async function markBroadcastStatus(broadcastId, status) {
  await supabaseAdmin
    .from("broadcasts")
    .update({ status })
    .eq("id", broadcastId);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  scheduleBroadcast,
  startSending,
  handleBroadcastAck,
  cancelBroadcast,
  rollUpCounts,
};
