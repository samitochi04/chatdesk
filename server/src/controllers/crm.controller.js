const { supabaseAdmin } = require("../config/supabase");
const { logActivity } = require("../services/activity.service");
const {
  createNotification,
  notifyOrgMembers,
} = require("./notification.controller");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

/* ================================================================== */
/*  Contacts                                                           */
/* ================================================================== */

const listContacts = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { search, classification, tag, page, limit, sort, order } = req.query;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from("contacts")
    .select("*, contact_tags(tag_id, tags(id, name, color))", {
      count: "exact",
    })
    .eq("organization_id", orgId);

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,phone_number.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }
  if (classification) query = query.eq("classification", classification);
  if (tag) query = query.filter("contact_tags.tag_id", "eq", tag);

  const sortCol =
    sort === "name"
      ? "name"
      : sort === "last_conversation_at"
        ? "last_conversation_at"
        : sort === "total_orders"
          ? "total_orders"
          : "created_at";

  query = query
    .order(sortCol, { ascending: order === "asc", nullsFirst: false })
    .range(from, to);

  const { data, count, error } = await query;
  if (error) throw ApiError.internal("Failed to list contacts");

  res.json({
    success: true,
    data,
    pagination: { page, limit, total: count },
  });
});

const getContact = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { id } = req.params;

  const { data: contact, error } = await supabaseAdmin
    .from("contacts")
    .select("*, contact_tags(tag_id, tags(id, name, color))")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  if (error || !contact) throw ApiError.notFound("Contact not found");
  res.json({ success: true, data: contact });
});

const createContact = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { phoneNumber, name, email, classification, notes, tags } = req.body;

  const { data: existing } = await supabaseAdmin
    .from("contacts")
    .select("id")
    .eq("organization_id", orgId)
    .eq("phone_number", phoneNumber)
    .single();
  if (existing)
    throw ApiError.conflict("A contact with this phone number already exists");

  const { data: contact, error } = await supabaseAdmin
    .from("contacts")
    .insert({
      organization_id: orgId,
      phone_number: phoneNumber,
      name: name || null,
      email: email || null,
      classification,
      notes: notes || null,
    })
    .select()
    .single();
  if (error) throw ApiError.internal("Failed to create contact");

  // Assign tags if provided
  if (tags && tags.length > 0) {
    const tagRows = tags.map((tagId) => ({
      contact_id: contact.id,
      tag_id: tagId,
      assigned_by: req.user.id,
    }));
    await supabaseAdmin.from("contact_tags").insert(tagRows);
  }

  // Notify org members
  notifyOrgMembers({
    orgId,
    type: "new_contact",
    title: `New contact: ${name || phoneNumber}`,
    body: `Added by team member`,
    link: `/dashboard/contacts`,
    excludeUserId: req.user.id,
  });

  // Log activity
  logActivity({
    organizationId: orgId,
    userId: req.user.id,
    action: "created",
    entityType: "contact",
    entityId: contact.id,
    metadata: { phoneNumber, name },
  });

  res.status(201).json({ success: true, data: contact });
});

const updateContact = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { id } = req.params;
  const updates = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.email !== undefined) updates.email = req.body.email;
  if (req.body.classification) updates.classification = req.body.classification;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  if (req.body.totalOrders !== undefined)
    updates.total_orders = req.body.totalOrders;
  if (req.body.totalSpent !== undefined)
    updates.total_spent = req.body.totalSpent;

  const { data: contact, error } = await supabaseAdmin
    .from("contacts")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .select()
    .single();

  if (error) throw ApiError.internal("Failed to update contact");
  if (!contact) throw ApiError.notFound("Contact not found");

  res.json({ success: true, data: contact });
});

const deleteContact = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("contacts")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) throw ApiError.internal("Failed to delete contact");
  res.json({ success: true, message: "Contact deleted" });
});

/* ================================================================== */
/*  Tags                                                               */
/* ================================================================== */

const listTags = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { data, error } = await supabaseAdmin
    .from("tags")
    .select("*")
    .eq("organization_id", orgId)
    .order("name");

  if (error) throw ApiError.internal("Failed to list tags");
  res.json({ success: true, data });
});

const createTag = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { name, color } = req.body;

  const { data: tag, error } = await supabaseAdmin
    .from("tags")
    .insert({ organization_id: orgId, name, color })
    .select()
    .single();

  if (error) {
    if (error.code === "23505")
      throw ApiError.conflict("A tag with this name already exists");
    throw ApiError.internal("Failed to create tag");
  }
  res.status(201).json({ success: true, data: tag });
});

const deleteTag = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("tags")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) throw ApiError.internal("Failed to delete tag");
  res.json({ success: true, message: "Tag deleted" });
});

const assignTags = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const contactId = req.params.id;
  const { tagIds } = req.body;

  // Verify contact belongs to org
  const { data: contact } = await supabaseAdmin
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("organization_id", orgId)
    .single();
  if (!contact) throw ApiError.notFound("Contact not found");

  // Remove existing tags and re-assign
  await supabaseAdmin.from("contact_tags").delete().eq("contact_id", contactId);

  if (tagIds.length > 0) {
    const rows = tagIds.map((tagId) => ({
      contact_id: contactId,
      tag_id: tagId,
      assigned_by: req.user.id,
    }));
    const { error } = await supabaseAdmin.from("contact_tags").insert(rows);
    if (error) throw ApiError.internal("Failed to assign tags");
  }

  res.json({ success: true, message: "Tags updated" });
});

/* ================================================================== */
/*  Conversations                                                      */
/* ================================================================== */

const listConversations = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { status, search, page, limit } = req.query;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from("conversations")
    .select(
      "*, contacts(id, name, phone_number, avatar_url), profiles:assigned_to(id, full_name), ai_agents(id, name)",
      { count: "exact" },
    )
    .eq("organization_id", orgId);

  if (status) query = query.eq("status", status);
  if (search) {
    // Find contacts matching the search term first
    const { data: matchedContacts } = await supabaseAdmin
      .from("contacts")
      .select("id")
      .eq("organization_id", orgId)
      .or(`name.ilike.%${search}%,phone_number.ilike.%${search}%`);

    const contactIds = (matchedContacts || []).map((c) => c.id);

    if (contactIds.length > 0) {
      // Match conversations by contact OR by message preview
      query = query.or(
        `contact_id.in.(${contactIds.join(",")}),last_message_preview.ilike.%${search}%`,
      );
    } else {
      // No matching contacts — search only by message preview
      query = query.ilike("last_message_preview", `%${search}%`);
    }
  }

  query = query
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .range(from, to);

  const { data, count, error } = await query;
  if (error) throw ApiError.internal("Failed to list conversations");

  res.json({
    success: true,
    data,
    pagination: { page, limit, total: count },
  });
});

const getConversation = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { id } = req.params;

  const { data: conversation, error } = await supabaseAdmin
    .from("conversations")
    .select(
      "*, contacts(id, name, phone_number, avatar_url, classification), profiles:assigned_to(id, full_name), ai_agents(id, name)",
    )
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  if (error || !conversation) throw ApiError.notFound("Conversation not found");

  // Reset unread count
  await supabaseAdmin
    .from("conversations")
    .update({ unread_count: 0 })
    .eq("id", id);

  res.json({ success: true, data: conversation });
});

const updateConversation = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { id } = req.params;
  const updates = {};

  if (req.body.status) {
    updates.status = req.body.status;
    if (req.body.status === "closed") {
      updates.closed_at = new Date().toISOString();
      updates.closed_by = req.user.id;
    }
  }
  if (req.body.assignedTo !== undefined)
    updates.assigned_to = req.body.assignedTo;

  const { data, error } = await supabaseAdmin
    .from("conversations")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .select()
    .single();

  if (error) throw ApiError.internal("Failed to update conversation");
  if (!data) throw ApiError.notFound("Conversation not found");

  logActivity({
    organizationId: orgId,
    userId: req.user.id,
    action: "updated",
    entityType: "conversation",
    entityId: id,
    metadata: { status: req.body.status, assignedTo: req.body.assignedTo },
  });

  res.json({ success: true, data });
});

/* ================================================================== */
/*  Messages                                                           */
/* ================================================================== */

const listMessages = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const conversationId = req.params.id;
  const { page, limit } = req.query;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Verify conversation belongs to org
  const { data: conv } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("organization_id", orgId)
    .single();
  if (!conv) throw ApiError.notFound("Conversation not found");

  const { data, count, error } = await supabaseAdmin
    .from("messages")
    .select("*", { count: "exact" })
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) throw ApiError.internal("Failed to list messages");

  res.json({
    success: true,
    data,
    pagination: { page, limit, total: count },
  });
});

/* ================================================================== */
/*  Conversation Notes                                                 */
/* ================================================================== */

const listNotes = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const conversationId = req.params.id;

  // Verify conversation belongs to org
  const { data: conv } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("organization_id", orgId)
    .single();
  if (!conv) throw ApiError.notFound("Conversation not found");

  const { data, error } = await supabaseAdmin
    .from("conversation_notes")
    .select("*, profiles:author_id(id, full_name)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false });

  if (error) throw ApiError.internal("Failed to list notes");
  res.json({ success: true, data });
});

const createNote = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const conversationId = req.params.id;
  const { content } = req.body;

  // Verify conversation belongs to org
  const { data: conv } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("organization_id", orgId)
    .single();
  if (!conv) throw ApiError.notFound("Conversation not found");

  const { data: note, error } = await supabaseAdmin
    .from("conversation_notes")
    .insert({
      conversation_id: conversationId,
      author_id: req.user.id,
      content,
    })
    .select("*, profiles:author_id(id, full_name)")
    .single();

  if (error) throw ApiError.internal("Failed to create note");
  res.status(201).json({ success: true, data: note });
});

/* ================================================================== */
/*  Pipeline Stages                                                    */
/* ================================================================== */

const listStages = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { data, error } = await supabaseAdmin
    .from("pipeline_stages")
    .select("*")
    .eq("organization_id", orgId)
    .order("position");

  if (error) throw ApiError.internal("Failed to list stages");

  // Auto-seed default stages if none exist
  if (data.length === 0) {
    const defaults = [
      { name: "New Lead", position: 0, color: "#3B82F6" },
      { name: "Interested", position: 1, color: "#F59E0B" },
      { name: "Negotiating", position: 2, color: "#8B5CF6" },
      { name: "Won", position: 3, color: "#10B981", is_won: true },
      { name: "Lost", position: 4, color: "#EF4444", is_lost: true },
    ];
    const rows = defaults.map((s) => ({ ...s, organization_id: orgId }));
    const { data: seeded, error: seedErr } = await supabaseAdmin
      .from("pipeline_stages")
      .insert(rows)
      .select();
    if (seedErr) throw ApiError.internal("Failed to seed pipeline stages");
    return res.json({ success: true, data: seeded });
  }

  res.json({ success: true, data });
});

const createStage = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { name, color, position, isWon, isLost } = req.body;

  const insertData = {
    organization_id: orgId,
    name,
    color,
    is_won: isWon || false,
    is_lost: isLost || false,
  };

  if (position !== undefined) {
    insertData.position = position;
  } else {
    // Put at end
    const { count } = await supabaseAdmin
      .from("pipeline_stages")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId);
    insertData.position = count || 0;
  }

  const { data: stage, error } = await supabaseAdmin
    .from("pipeline_stages")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    if (error.code === "23505")
      throw ApiError.conflict("A stage with this name already exists");
    throw ApiError.internal("Failed to create stage");
  }
  res.status(201).json({ success: true, data: stage });
});

const updateStage = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { id } = req.params;
  const updates = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.color !== undefined) updates.color = req.body.color;
  if (req.body.position !== undefined) updates.position = req.body.position;
  if (req.body.isWon !== undefined) updates.is_won = req.body.isWon;
  if (req.body.isLost !== undefined) updates.is_lost = req.body.isLost;

  const { data, error } = await supabaseAdmin
    .from("pipeline_stages")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .select()
    .single();

  if (error) throw ApiError.internal("Failed to update stage");
  if (!data) throw ApiError.notFound("Stage not found");

  res.json({ success: true, data });
});

const deleteStage = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { id } = req.params;

  // Check no deals in this stage
  const { count } = await supabaseAdmin
    .from("pipeline_deals")
    .select("id", { count: "exact", head: true })
    .eq("stage_id", id);

  if (count > 0)
    throw ApiError.badRequest(
      "Cannot delete a stage that has deals. Move deals first.",
    );

  const { error } = await supabaseAdmin
    .from("pipeline_stages")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) throw ApiError.internal("Failed to delete stage");
  res.json({ success: true, message: "Stage deleted" });
});

const reorderStages = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { stages } = req.body;

  const updates = stages.map(({ id, position }) =>
    supabaseAdmin
      .from("pipeline_stages")
      .update({ position })
      .eq("id", id)
      .eq("organization_id", orgId),
  );
  await Promise.all(updates);

  res.json({ success: true, message: "Stages reordered" });
});

/* ================================================================== */
/*  Pipeline Deals                                                     */
/* ================================================================== */

const listDeals = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { data, error } = await supabaseAdmin
    .from("pipeline_deals")
    .select(
      "*, contacts(id, name, phone_number), pipeline_stages(id, name, color, position, is_won, is_lost), profiles:assigned_to(id, full_name)",
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) throw ApiError.internal("Failed to list deals");
  res.json({ success: true, data });
});

const getDeal = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { id } = req.params;

  const { data: deal, error } = await supabaseAdmin
    .from("pipeline_deals")
    .select(
      "*, contacts(id, name, phone_number), pipeline_stages(id, name, color), profiles:assigned_to(id, full_name)",
    )
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  if (error || !deal) throw ApiError.notFound("Deal not found");
  res.json({ success: true, data: deal });
});

const createDeal = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const {
    contactId,
    stageId,
    title,
    value,
    currency,
    assignedTo,
    notes,
    expectedCloseDate,
  } = req.body;

  const { data: deal, error } = await supabaseAdmin
    .from("pipeline_deals")
    .insert({
      organization_id: orgId,
      contact_id: contactId,
      stage_id: stageId,
      title,
      value: value || null,
      currency,
      assigned_to: assignedTo || null,
      notes: notes || null,
      expected_close_date: expectedCloseDate || null,
    })
    .select(
      "*, contacts(id, name, phone_number), pipeline_stages(id, name, color, position, is_won, is_lost)",
    )
    .single();

  if (error) throw ApiError.internal("Failed to create deal");

  logActivity({
    organizationId: orgId,
    userId: req.user.id,
    action: "created",
    entityType: "deal",
    entityId: deal.id,
    metadata: { title, stageId },
  });

  res.status(201).json({ success: true, data: deal });
});

const updateDeal = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { id } = req.params;
  const updates = {};

  if (req.body.stageId !== undefined) updates.stage_id = req.body.stageId;
  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.value !== undefined) updates.value = req.body.value;
  if (req.body.currency !== undefined) updates.currency = req.body.currency;
  if (req.body.assignedTo !== undefined)
    updates.assigned_to = req.body.assignedTo;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  if (req.body.expectedCloseDate !== undefined)
    updates.expected_close_date = req.body.expectedCloseDate;
  if (req.body.lostReason !== undefined)
    updates.lost_reason = req.body.lostReason;

  // Auto-set won_at / lost_at if moving to won/lost stage
  if (req.body.stageId) {
    const { data: stage } = await supabaseAdmin
      .from("pipeline_stages")
      .select("is_won, is_lost")
      .eq("id", req.body.stageId)
      .single();
    if (stage?.is_won) updates.won_at = new Date().toISOString();
    if (stage?.is_lost) updates.lost_at = new Date().toISOString();
  }

  const { data: deal, error } = await supabaseAdmin
    .from("pipeline_deals")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .select(
      "*, contacts(id, name, phone_number), pipeline_stages(id, name, color, position, is_won, is_lost)",
    )
    .single();

  if (error) throw ApiError.internal("Failed to update deal");
  if (!deal) throw ApiError.notFound("Deal not found");

  // Notify on stage change
  if (req.body.stageId && deal.pipeline_stages) {
    notifyOrgMembers({
      orgId,
      type: "deal_update",
      title: `Deal "${deal.title}" moved to ${deal.pipeline_stages.name}`,
      body: deal.contacts?.name || null,
      link: `/dashboard/pipeline`,
      excludeUserId: req.user.id,
    });
  }

  // Log activity
  logActivity({
    organizationId: orgId,
    userId: req.user.id,
    action: "updated",
    entityType: "deal",
    entityId: id,
    metadata: { stageId: req.body.stageId, title: deal.title },
  });

  res.json({ success: true, data: deal });
});

const deleteDeal = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("pipeline_deals")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) throw ApiError.internal("Failed to delete deal");
  res.json({ success: true, message: "Deal deleted" });
});

module.exports = {
  // Contacts
  listContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  // Tags
  listTags,
  createTag,
  deleteTag,
  assignTags,
  // Conversations
  listConversations,
  getConversation,
  updateConversation,
  listMessages,
  listNotes,
  createNote,
  // Pipeline
  listStages,
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
  listDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
};
