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
/*  Knowledge Base Loader                                              */
/* ------------------------------------------------------------------ */

/**
 * Load active knowledge base entries for an AI agent (and org-wide ones).
 * Returns concatenated text to inject into the system prompt.
 */
async function loadKnowledgeBase(orgId, agentId) {
  const { data: entries } = await supabaseAdmin
    .from("ai_knowledge_base")
    .select("title, content")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .or(
      agentId
        ? `ai_agent_id.eq.${agentId},ai_agent_id.is.null`
        : "ai_agent_id.is.null",
    )
    .order("created_at", { ascending: true })
    .limit(20);

  if (!entries || entries.length === 0) return "";

  return entries.map((e) => `### ${e.title}\n${e.content}`).join("\n\n");
}

/* ------------------------------------------------------------------ */
/*  Enhanced System Prompt Builder                                     */
/* ------------------------------------------------------------------ */

/**
 * Build an enhanced system prompt with knowledge base, business context,
 * and vendor-like behavior instructions.
 */
function buildSystemPrompt(agent, knowledgeBase, orgContext) {
  const parts = [];

  // Base system prompt from agent config
  if (agent.system_prompt) {
    parts.push(agent.system_prompt);
  }

  // Agent type-specific instructions
  const typeInstructions = {
    auto_reply:
      "You are a helpful customer service assistant. Answer questions accurately and politely. If you cannot answer, let the customer know a team member will follow up.",
    marketing:
      "You are a marketing assistant. Engage potential customers, highlight product benefits, and guide them toward a purchase. Be persuasive but not pushy.",
    follow_up:
      "You are a follow-up assistant. Re-engage customers who haven't responded, check on their satisfaction, and encourage repeat business.",
    support:
      "You are a customer support assistant. Help resolve issues, provide troubleshooting steps, and escalate when needed.",
    custom: "",
  };

  if (!agent.system_prompt && typeInstructions[agent.type]) {
    parts.push(typeInstructions[agent.type]);
  }

  // Automation mode instructions
  const agentConfig = agent.configuration || {};
  if (agentConfig.automation_mode) {
    parts.push(
      "IMPORTANT: You are operating in full automation mode. Handle all conversations independently without human intervention. " +
        "Be confident in your responses. Only indicate you need to escalate if the customer explicitly requests to speak with a human, " +
        "or if the question is completely outside your knowledge base.",
    );
  }

  // Vendor-like behavior
  if (agentConfig.vendor_style) {
    parts.push(
      "Communicate as if you are the business owner or a dedicated vendor representative. " +
        "Use a warm, personal tone. Remember customer preferences from the conversation. " +
        "Proactively suggest products or services based on the conversation context.",
    );
  }

  // Organization context
  if (orgContext) {
    parts.push(`\nBusiness Context:\n- Business: ${orgContext.name || "N/A"}`);
  }

  // Knowledge base content
  if (knowledgeBase) {
    parts.push(
      "\n--- KNOWLEDGE BASE (use this information to answer questions) ---\n" +
        knowledgeBase +
        "\n--- END KNOWLEDGE BASE ---",
    );
  }

  // Response guidelines
  parts.push(
    "\nResponse guidelines:" +
      "\n- Keep responses concise and WhatsApp-friendly (short paragraphs, use emojis sparingly)." +
      "\n- If you don't know something, say so honestly rather than making up information." +
      "\n- Always be respectful and professional.",
  );

  return parts.join("\n\n");
}

/* ------------------------------------------------------------------ */
/*  AI Agent Conversation                                              */
/* ------------------------------------------------------------------ */

/**
 * Handle an incoming message for an AI-assigned conversation.
 *
 * 1. Load the AI agent's system prompt + config
 * 2. Load knowledge base content
 * 3. Fetch recent conversation history
 * 4. Build enhanced system prompt
 * 5. Send to OpenAI
 * 6. Return the AI reply text (caller is responsible for sending via WA + storing)
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

  const orgId = conversation.organization_id;

  // Load knowledge base
  const knowledgeBase = await loadKnowledgeBase(orgId, agentId);

  // Load org context
  let orgContext = null;
  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();
  if (org) orgContext = org;

  // Fetch recent message history (last 30 messages for better context window)
  const { data: history } = await supabaseAdmin
    .from("messages")
    .select("sender_type, content, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })
    .limit(30);

  // Build messages array
  const messages = [];

  // Enhanced system prompt
  const systemPrompt = buildSystemPrompt(agent, knowledgeBase, orgContext);
  messages.push({ role: "system", content: systemPrompt });

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
/*  Trigger Evaluation                                                 */
/* ------------------------------------------------------------------ */

/**
 * Evaluate AI triggers for an incoming message.
 * Returns matching triggers sorted by priority.
 */
async function evaluateTriggers(orgId, message, contact, conversation) {
  const { data: triggers } = await supabaseAdmin
    .from("ai_triggers")
    .select("*")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (!triggers || triggers.length === 0) return [];

  const matched = [];
  const messageText = (message.body || "").toLowerCase().trim();

  for (const trigger of triggers) {
    const conditions = trigger.conditions || {};

    switch (trigger.trigger_type) {
      case "keyword": {
        const keywords = conditions.keywords || [];
        const matchMode = conditions.match || "any";
        const keywordMatched =
          matchMode === "all"
            ? keywords.every((kw) => messageText.includes(kw.toLowerCase()))
            : keywords.some((kw) => messageText.includes(kw.toLowerCase()));
        if (keywordMatched) matched.push(trigger);
        break;
      }

      case "classification": {
        const classifications = conditions.classifications || [];
        if (
          contact?.classification &&
          classifications.includes(contact.classification)
        ) {
          matched.push(trigger);
        }
        break;
      }

      case "new_contact": {
        // Check if the contact was just created (within last 60 seconds)
        if (contact?.created_at) {
          const created = new Date(contact.created_at);
          const now = new Date();
          if (now - created < 60000) {
            matched.push(trigger);
          }
        }
        break;
      }

      case "intent": {
        // Intent detection via keywords that suggest purchase intent
        const intentKeywords = {
          purchase_intent: [
            "buy",
            "order",
            "purchase",
            "price",
            "cost",
            "how much",
            "payment",
            "pay",
          ],
          complaint: [
            "problem",
            "issue",
            "broken",
            "not working",
            "refund",
            "complaint",
            "unhappy",
          ],
          inquiry: [
            "available",
            "do you have",
            "tell me about",
            "information",
            "details",
          ],
        };

        const intents = conditions.intents || [];
        for (const intent of intents) {
          const keywords = intentKeywords[intent] || [];
          if (keywords.some((kw) => messageText.includes(kw))) {
            matched.push(trigger);
            break;
          }
        }
        break;
      }

      // no_response and schedule triggers are handled by a separate scheduler, not here
      default:
        break;
    }
  }

  return matched;
}

/**
 * Execute a matched trigger's action.
 */
async function executeTriggerAction(trigger, context) {
  const { orgId, contact, conversation } = context;
  const actionConfig = trigger.action_config || {};

  try {
    switch (trigger.action_type) {
      case "assign_agent": {
        if (actionConfig.agent_id && conversation) {
          await supabaseAdmin
            .from("conversations")
            .update({
              ai_agent_id: actionConfig.agent_id,
              is_ai_handled: true,
            })
            .eq("id", conversation.id);
          logger.info(
            `Trigger "${trigger.name}": assigned agent ${actionConfig.agent_id} to conv ${conversation.id}`,
          );
        }
        break;
      }

      case "notify_team": {
        const { data: members } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("organization_id", orgId)
          .eq("is_active", true);

        if (members && members.length > 0) {
          const notifications = members.map((m) => ({
            organization_id: orgId,
            user_id: m.id,
            type: "system",
            title: actionConfig.title || `Trigger: ${trigger.name}`,
            body: actionConfig.body || null,
            link: actionConfig.link || null,
          }));
          await supabaseAdmin.from("notifications").insert(notifications);
          logger.info(
            `Trigger "${trigger.name}": notified ${members.length} team members`,
          );
        }
        break;
      }

      case "classify": {
        if (contact) {
          await classifyContact(orgId, contact.id);
          logger.info(
            `Trigger "${trigger.name}": classified contact ${contact.id}`,
          );
        }
        break;
      }

      case "tag_contact": {
        if (contact && actionConfig.tag_name) {
          // Find or create tag
          let { data: tag } = await supabaseAdmin
            .from("tags")
            .select("id")
            .eq("organization_id", orgId)
            .eq("name", actionConfig.tag_name)
            .single();

          if (!tag) {
            const { data: newTag } = await supabaseAdmin
              .from("tags")
              .insert({
                organization_id: orgId,
                name: actionConfig.tag_name,
                color: "#F59E0B",
              })
              .select("id")
              .single();
            tag = newTag;
          }

          if (tag) {
            await supabaseAdmin
              .from("contact_tags")
              .upsert(
                { contact_id: contact.id, tag_id: tag.id },
                { onConflict: "contact_id,tag_id" },
              );
            logger.info(
              `Trigger "${trigger.name}": tagged contact ${contact.id} with "${actionConfig.tag_name}"`,
            );
          }
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    logger.error(
      `Failed to execute trigger "${trigger.name}" action: ${err.message}`,
    );
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
  loadKnowledgeBase,
  evaluateTriggers,
  executeTriggerAction,
};
