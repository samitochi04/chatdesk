const OpenAI = require("openai");
const config = require("../config");
const { supabaseAdmin } = require("../config/supabase");
const logger = require("../utils/logger");

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/* ------------------------------------------------------------------ */
/*  Core OpenAI call                                                   */
/* ------------------------------------------------------------------ */

/**
 * Send a chat completion request to OpenAI.
 *
 * @param {Array<{role:string, content:string}>} messages
 * @param {object} opts - model, temperature, max_tokens overrides
 * @returns {string} The assistant reply text
 */
async function chatCompletion(messages, opts = {}) {
  const model = opts.model || "gpt-4o-mini";
  const temperature = opts.temperature ?? 0.7;
  const maxTokens = opts.maxTokens ?? 1024;

  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  });

  return response.choices[0]?.message?.content?.trim() || "";
}

/* ------------------------------------------------------------------ */
/*  AI Agent Conversation                                              */
/* ------------------------------------------------------------------ */

/**
 * Handle an incoming message for an AI-assigned conversation.
 *
 * 1. Load the AI agent's system prompt + config
 * 2. Fetch recent conversation history
 * 3. Send to OpenAI
 * 4. Return the AI reply text (caller is responsible for sending via WA + storing)
 */
async function handleAIConversation(conversation, incomingContent) {
  const agentId = conversation.ai_agent_id;

  // Load agent
  const { data: agent, error: agentErr } = await supabaseAdmin
    .from("ai_agents")
    .select("*")
    .eq("id", agentId)
    .eq("is_active", true)
    .single();

  if (agentErr || !agent) {
    logger.warn(`AI agent ${agentId} not found or inactive, skipping`);
    return null;
  }

  // Fetch recent message history (last 20 messages for context window)
  const { data: history } = await supabaseAdmin
    .from("messages")
    .select("sender_type, content, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })
    .limit(20);

  // Build messages array
  const messages = [];

  if (agent.system_prompt) {
    messages.push({ role: "system", content: agent.system_prompt });
  }

  // Map DB messages to OpenAI roles
  if (history) {
    for (const msg of history) {
      if (!msg.content) continue;
      const role = msg.sender_type === "customer" ? "user" : "assistant";
      messages.push({ role, content: msg.content });
    }
  }

  // Append the new incoming message
  messages.push({ role: "user", content: incomingContent });

  // Agent config overrides
  const agentConfig = agent.configuration || {};

  try {
    const reply = await chatCompletion(messages, {
      model: agent.model,
      temperature: agentConfig.temperature,
      maxTokens: agentConfig.max_tokens,
    });

    logger.info(`AI agent "${agent.name}" replied to conv ${conversation.id}`);
    return reply;
  } catch (err) {
    logger.error(`OpenAI error for agent ${agent.name}: ${err.message}`);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Customer Classification                                            */
/* ------------------------------------------------------------------ */

/**
 * Classify a contact based on their conversation history.
 * Updates the contact record with the new classification.
 *
 * @param {string} orgId
 * @param {string} contactId
 * @returns {{ classification: string, reasoning: string }}
 */
async function classifyContact(orgId, contactId) {
  // Fetch contact
  const { data: contact, error: contactErr } = await supabaseAdmin
    .from("contacts")
    .select("id, name, phone_number, classification, total_orders, total_spent")
    .eq("id", contactId)
    .eq("organization_id", orgId)
    .single();

  if (contactErr || !contact) {
    throw new Error("Contact not found");
  }

  // Fetch all conversations for this contact in this org
  const { data: conversations } = await supabaseAdmin
    .from("conversations")
    .select("id, status, created_at, closed_at")
    .eq("organization_id", orgId)
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!conversations || conversations.length === 0) {
    return {
      classification: contact.classification,
      reasoning: "No conversations to analyze",
    };
  }

  // Fetch messages across these conversations (last 50)
  const convIds = conversations.map((c) => c.id);
  const { data: messages } = await supabaseAdmin
    .from("messages")
    .select("sender_type, content, created_at")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: true })
    .limit(50);

  if (!messages || messages.length === 0) {
    return {
      classification: contact.classification,
      reasoning: "No messages to analyze",
    };
  }

  // Build transcript
  const transcript = messages
    .filter((m) => m.content)
    .map((m) => {
      const who = m.sender_type === "customer" ? "Customer" : "Agent";
      return `${who}: ${m.content}`;
    })
    .join("\n");

  const systemPrompt = `You are a CRM assistant. Based on the conversation transcript below, classify this customer into EXACTLY one of these categories:
- interested: The customer showed interest in buying
- said_no: The customer declined or is not interested
- bought: The customer completed a purchase
- didnt_buy: The customer was interested but did not purchase
- new_lead: Not enough information yet

Also consider:
- Total orders placed: ${contact.total_orders}
- Total amount spent: ${contact.total_spent}

Reply ONLY with valid JSON: {"classification": "<category>", "reasoning": "<one sentence explanation>"}`;

  try {
    const raw = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcript },
      ],
      { temperature: 0.3, maxTokens: 256 },
    );

    const result = JSON.parse(raw);
    const validClasses = [
      "new_lead",
      "interested",
      "said_no",
      "bought",
      "didnt_buy",
    ];
    if (!validClasses.includes(result.classification)) {
      result.classification = "new_lead";
    }

    // Update contact
    await supabaseAdmin
      .from("contacts")
      .update({ classification: result.classification })
      .eq("id", contactId)
      .eq("organization_id", orgId);

    logger.info(
      `Classified contact ${contactId} as "${result.classification}"`,
    );
    return result;
  } catch (err) {
    logger.error(
      `Classification failed for contact ${contactId}: ${err.message}`,
    );
    throw new Error("Failed to classify contact");
  }
}

/* ------------------------------------------------------------------ */
/*  Data Analysis & Growth Suggestions                                 */
/* ------------------------------------------------------------------ */

/**
 * Run an AI-powered analysis for the organization.
 *
 * @param {string} orgId
 * @param {string} analysisType - one of the ai_analyses.analysis_type enum values
 * @param {{ periodStart?: string, periodEnd?: string }} opts
 * @returns {object} The saved ai_analyses row
 */
async function runAnalysis(orgId, analysisType, opts = {}) {
  const periodStart = opts.periodStart || thirtyDaysAgo();
  const periodEnd = opts.periodEnd || today();

  // Gather data scoped to the period
  const data = await gatherAnalysisData(
    orgId,
    analysisType,
    periodStart,
    periodEnd,
  );

  const systemPrompt = buildAnalysisPrompt(analysisType);

  const raw = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(data) },
    ],
    { temperature: 0.4, maxTokens: 2048 },
  );

  let content;
  try {
    content = JSON.parse(raw);
  } catch {
    content = { raw_text: raw };
  }

  // Store analysis
  const { data: saved, error } = await supabaseAdmin
    .from("ai_analyses")
    .insert({
      organization_id: orgId,
      analysis_type: analysisType,
      title: content.title || `${formatAnalysisType(analysisType)} Report`,
      summary: content.summary || null,
      content,
      period_start: periodStart,
      period_end: periodEnd,
    })
    .select("*")
    .single();

  if (error) {
    logger.error(`Failed to save analysis: ${error.message}`);
    throw new Error("Failed to save analysis");
  }

  logger.info(`Saved ${analysisType} analysis ${saved.id} for org ${orgId}`);
  return saved;
}

/* ------------------------------------------------------------------ */
/*  Analysis helpers                                                   */
/* ------------------------------------------------------------------ */

async function gatherAnalysisData(orgId, analysisType, periodStart, periodEnd) {
  const result = {};

  // Conversations in period
  const { data: conversations } = await supabaseAdmin
    .from("conversations")
    .select("id, status, created_at, closed_at, is_ai_handled")
    .eq("organization_id", orgId)
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd);

  result.totalConversations = conversations?.length || 0;
  result.closedConversations =
    conversations?.filter((c) => c.status === "closed").length || 0;
  result.aiHandled = conversations?.filter((c) => c.is_ai_handled).length || 0;

  // Messages count
  const { count: messageCount } = await supabaseAdmin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd);

  result.totalMessages = messageCount || 0;

  // Contact classifications
  const { data: contacts } = await supabaseAdmin
    .from("contacts")
    .select("classification")
    .eq("organization_id", orgId);

  if (contacts) {
    result.contactBreakdown = {};
    for (const c of contacts) {
      result.contactBreakdown[c.classification] =
        (result.contactBreakdown[c.classification] || 0) + 1;
    }
  }

  // Type-specific data
  if (analysisType === "sales_performance") {
    const { data: deals } = await supabaseAdmin
      .from("pipeline_deals")
      .select("value, stage_id, created_at")
      .eq("organization_id", orgId)
      .gte("created_at", periodStart)
      .lte("created_at", periodEnd);

    result.deals = deals || [];
    result.totalDealValue =
      deals?.reduce((sum, d) => sum + Number(d.value || 0), 0) || 0;
  }

  if (analysisType === "response_quality") {
    // Sample recent messages with response times
    const { data: recentConvs } = await supabaseAdmin
      .from("conversations")
      .select("id, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (recentConvs && recentConvs.length > 0) {
      const convIds = recentConvs.map((c) => c.id);
      const { data: msgs } = await supabaseAdmin
        .from("messages")
        .select("conversation_id, sender_type, created_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: true });

      result.sampleMessageFlow = msgs || [];
    }
  }

  return result;
}

function buildAnalysisPrompt(analysisType) {
  const base =
    'You are a business analytics AI for an African WhatsApp CRM. Analyze the data and respond ONLY with valid JSON: {"title": "...", "summary": "...", "insights": [...], "recommendations": [...]}';

  const specifics = {
    customer_behavior:
      "Focus on customer engagement patterns, message volumes, lead conversion rates, and classification distribution.",
    growth_suggestion:
      "Identify growth opportunities, underserved segments, optimal messaging times, and actionable strategies to increase sales.",
    conversation_insights:
      "Analyze conversation flow, resolution rates, AI vs human handling, and common topics.",
    sales_performance:
      "Evaluate deal pipeline performance, conversion rates, average deal values, and sales velocity.",
    response_quality:
      "Assess response times, first-response speed, customer satisfaction signals, and team efficiency.",
    classification_summary:
      "Summarize the distribution of customer classifications and recommend follow-up strategies for each segment.",
  };

  return `${base}\n\nSpecific focus: ${specifics[analysisType] || specifics.customer_behavior}`;
}

function formatAnalysisType(type) {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function thirtyDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = {
  chatCompletion,
  handleAIConversation,
  classifyContact,
  runAnalysis,
};
