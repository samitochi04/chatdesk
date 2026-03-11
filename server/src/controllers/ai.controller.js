const { supabaseAdmin } = require("../config/supabase");
const aiService = require("../services/ai.service");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const logger = require("../utils/logger");

/* ================================================================== */
/*  AI Agents CRUD                                                     */
/* ================================================================== */

/**
 * POST /api/ai/agents
 */
const createAgent = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const {
    name,
    type,
    description,
    systemPrompt,
    model,
    isActive,
    configuration,
  } = req.body;

  const { data: agent, error } = await supabaseAdmin
    .from("ai_agents")
    .insert({
      organization_id: orgId,
      name,
      type,
      description: description || null,
      system_prompt: systemPrompt || null,
      model: model || "gpt-4o-mini",
      is_active: isActive ?? true,
      configuration: configuration || {},
    })
    .select("*")
    .single();

  if (error) throw ApiError.internal("Failed to create AI agent");

  res.status(201).json({ success: true, data: agent });
});

/**
 * GET /api/ai/agents
 */
const listAgents = catchAsync(async (req, res) => {
  const orgId = req.organization.id;

  const { data: agents, error } = await supabaseAdmin
    .from("ai_agents")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });

  if (error) throw ApiError.internal("Failed to list agents");

  res.json({ success: true, data: agents });
});

/**
 * GET /api/ai/agents/:id
 */
const getAgent = catchAsync(async (req, res) => {
  const orgId = req.organization.id;

  const { data: agent, error } = await supabaseAdmin
    .from("ai_agents")
    .select("*")
    .eq("id", req.params.id)
    .eq("organization_id", orgId)
    .single();

  if (error || !agent) throw ApiError.notFound("AI agent not found");

  res.json({ success: true, data: agent });
});

/**
 * PATCH /api/ai/agents/:id
 */
const updateAgent = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const {
    name,
    type,
    description,
    systemPrompt,
    model,
    isActive,
    configuration,
  } = req.body;

  const update = {};
  if (name !== undefined) update.name = name;
  if (type !== undefined) update.type = type;
  if (description !== undefined) update.description = description;
  if (systemPrompt !== undefined) update.system_prompt = systemPrompt;
  if (model !== undefined) update.model = model;
  if (isActive !== undefined) update.is_active = isActive;
  if (configuration !== undefined) update.configuration = configuration;

  const { data: agent, error } = await supabaseAdmin
    .from("ai_agents")
    .update(update)
    .eq("id", req.params.id)
    .eq("organization_id", orgId)
    .select("*")
    .single();

  if (error || !agent) throw ApiError.notFound("AI agent not found");

  res.json({ success: true, data: agent });
});

/**
 * DELETE /api/ai/agents/:id
 */
const deleteAgent = catchAsync(async (req, res) => {
  const orgId = req.organization.id;

  const { data: agent } = await supabaseAdmin
    .from("ai_agents")
    .select("id")
    .eq("id", req.params.id)
    .eq("organization_id", orgId)
    .single();

  if (!agent) throw ApiError.notFound("AI agent not found");

  const { error } = await supabaseAdmin
    .from("ai_agents")
    .delete()
    .eq("id", req.params.id);

  if (error) throw ApiError.internal("Failed to delete agent");

  res.json({ success: true, message: "AI agent deleted" });
});

/* ================================================================== */
/*  Auto-Reply Rules CRUD                                              */
/* ================================================================== */

/**
 * POST /api/ai/rules
 */
const createRule = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { name, triggerKeywords, responseText, aiAgentId, isActive, priority } =
    req.body;

  // Validate aiAgentId belongs to org if provided
  if (aiAgentId) {
    const { data: agentCheck } = await supabaseAdmin
      .from("ai_agents")
      .select("id")
      .eq("id", aiAgentId)
      .eq("organization_id", orgId)
      .single();

    if (!agentCheck)
      throw ApiError.badRequest("AI agent not found in your organization");
  }

  const { data: rule, error } = await supabaseAdmin
    .from("auto_reply_rules")
    .insert({
      organization_id: orgId,
      ai_agent_id: aiAgentId || null,
      name,
      trigger_keywords: triggerKeywords,
      response_text: responseText,
      is_active: isActive ?? true,
      priority: priority ?? 0,
    })
    .select("*")
    .single();

  if (error) throw ApiError.internal("Failed to create auto-reply rule");

  res.status(201).json({ success: true, data: rule });
});

/**
 * GET /api/ai/rules
 */
const listRules = catchAsync(async (req, res) => {
  const orgId = req.organization.id;

  const { data: rules, error } = await supabaseAdmin
    .from("auto_reply_rules")
    .select("*, ai_agents(id, name)")
    .eq("organization_id", orgId)
    .order("priority", { ascending: false });

  if (error) throw ApiError.internal("Failed to list rules");

  res.json({ success: true, data: rules });
});

/**
 * GET /api/ai/rules/:id
 */
const getRule = catchAsync(async (req, res) => {
  const orgId = req.organization.id;

  const { data: rule, error } = await supabaseAdmin
    .from("auto_reply_rules")
    .select("*, ai_agents(id, name)")
    .eq("id", req.params.id)
    .eq("organization_id", orgId)
    .single();

  if (error || !rule) throw ApiError.notFound("Auto-reply rule not found");

  res.json({ success: true, data: rule });
});

/**
 * PATCH /api/ai/rules/:id
 */
const updateRule = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { name, triggerKeywords, responseText, aiAgentId, isActive, priority } =
    req.body;

  const update = {};
  if (name !== undefined) update.name = name;
  if (triggerKeywords !== undefined) update.trigger_keywords = triggerKeywords;
  if (responseText !== undefined) update.response_text = responseText;
  if (aiAgentId !== undefined) update.ai_agent_id = aiAgentId;
  if (isActive !== undefined) update.is_active = isActive;
  if (priority !== undefined) update.priority = priority;

  const { data: rule, error } = await supabaseAdmin
    .from("auto_reply_rules")
    .update(update)
    .eq("id", req.params.id)
    .eq("organization_id", orgId)
    .select("*")
    .single();

  if (error || !rule) throw ApiError.notFound("Auto-reply rule not found");

  res.json({ success: true, data: rule });
});

/**
 * DELETE /api/ai/rules/:id
 */
const deleteRule = catchAsync(async (req, res) => {
  const orgId = req.organization.id;

  const { data: rule } = await supabaseAdmin
    .from("auto_reply_rules")
    .select("id")
    .eq("id", req.params.id)
    .eq("organization_id", orgId)
    .single();

  if (!rule) throw ApiError.notFound("Auto-reply rule not found");

  const { error } = await supabaseAdmin
    .from("auto_reply_rules")
    .delete()
    .eq("id", req.params.id);

  if (error) throw ApiError.internal("Failed to delete rule");

  res.json({ success: true, message: "Auto-reply rule deleted" });
});

/* ================================================================== */
/*  Assign / Remove AI Agent from Conversation                         */
/* ================================================================== */

/**
 * POST /api/ai/conversations/assign
 */
const assignAgentToConversation = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { conversationId, agentId } = req.body;

  // Verify conversation ownership
  const { data: conv } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("organization_id", orgId)
    .single();

  if (!conv) throw ApiError.notFound("Conversation not found");

  // If assigning (not removing), verify agent belongs to org
  if (agentId) {
    const { data: agentCheck } = await supabaseAdmin
      .from("ai_agents")
      .select("id")
      .eq("id", agentId)
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .single();

    if (!agentCheck)
      throw ApiError.badRequest("AI agent not found or inactive");
  }

  const { data: updated, error } = await supabaseAdmin
    .from("conversations")
    .update({
      ai_agent_id: agentId || null,
      is_ai_handled: !!agentId,
    })
    .eq("id", conversationId)
    .select("id, ai_agent_id, is_ai_handled")
    .single();

  if (error) throw ApiError.internal("Failed to assign agent");

  const action = agentId ? "assigned" : "removed";
  res.json({ success: true, message: `AI agent ${action}`, data: updated });
});

/* ================================================================== */
/*  Customer Classification                                            */
/* ================================================================== */

/**
 * POST /api/ai/classify
 */
const classifyContactHandler = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { contactId } = req.body;

  const result = await aiService.classifyContact(orgId, contactId);

  res.json({ success: true, data: result });
});

/* ================================================================== */
/*  Data Analysis                                                      */
/* ================================================================== */

/**
 * POST /api/ai/analyze
 */
const runAnalysisHandler = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { analysisType, periodStart, periodEnd } = req.body;

  const analysis = await aiService.runAnalysis(orgId, analysisType, {
    periodStart,
    periodEnd,
  });

  res.status(201).json({ success: true, data: analysis });
});

/**
 * GET /api/ai/analyses
 */
const listAnalyses = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { type, limit } = req.query;

  let query = supabaseAdmin
    .from("ai_analyses")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("analysis_type", type);
  }

  const maxResults = Math.min(parseInt(limit, 10) || 20, 100);
  query = query.limit(maxResults);

  const { data: analyses, error } = await query;

  if (error) throw ApiError.internal("Failed to list analyses");

  res.json({ success: true, data: analyses });
});

/**
 * GET /api/ai/analyses/:id
 */
const getAnalysis = catchAsync(async (req, res) => {
  const orgId = req.organization.id;

  const { data: analysis, error } = await supabaseAdmin
    .from("ai_analyses")
    .select("*")
    .eq("id", req.params.id)
    .eq("organization_id", orgId)
    .single();

  if (error || !analysis) throw ApiError.notFound("Analysis not found");

  res.json({ success: true, data: analysis });
});

module.exports = {
  createAgent,
  listAgents,
  getAgent,
  updateAgent,
  deleteAgent,
  createRule,
  listRules,
  getRule,
  updateRule,
  deleteRule,
  assignAgentToConversation,
  classifyContactHandler,
  runAnalysisHandler,
  listAnalyses,
  getAnalysis,
};
