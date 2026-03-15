const post = {
  slug: "setting-up-ai-agents",
  title: "How to Set Up AI Agents on ChatDesk for Automated WhatsApp Replies",
  excerpt:
    "A complete guide to creating and configuring AI-powered agents on ChatDesk that automatically respond to customer messages on WhatsApp using OpenAI GPT models.",
  author: "amara",
  category: "gettingStarted",
  date: "2026-03-01",
  readTime: 8,
  coverImage:
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
  content: `
## What Are ChatDesk AI Agents?

ChatDesk AI Agents are configurable, AI-powered assistants that automatically respond to incoming WhatsApp messages on your behalf. Built on OpenAI's GPT models, each agent can be customised with a unique personality, knowledge base, and conversation style tailored to your business.

Think of AI agents as virtual team members that work 24/7 — handling routine questions, qualifying leads, and providing instant responses while your team focuses on high-value interactions.

## AI Agent Types

ChatDesk offers five agent types, each designed for a specific use case:

| Type | Best For |
|---|---|
| **Auto-Reply** | Answering common questions (pricing, hours, location) |
| **Marketing** | Engaging contacts with promotional content |
| **Follow-Up** | Re-engaging leads who haven't responded |
| **Support** | Handling customer issues and troubleshooting |
| **Custom** | Any specialised use case you define |

## Creating Your First AI Agent

### Step 1: Navigate to AI Agents

Go to **Dashboard → AI Agents** and click **Create Agent**.

### Step 2: Configure Basic Settings

- **Agent Name** — Give it a descriptive name (e.g., "Customer Support Bot")
- **Type** — Select the appropriate type from the dropdown
- **Model** — Choose your OpenAI model:
  - **GPT-4o-mini** — Fast and cost-effective for simple tasks
  - **GPT-4o** — Best balance of speed and intelligence
  - **GPT-4 Turbo** — Maximum intelligence for complex conversations
  - **GPT-3.5 Turbo** — Fastest, good for high-volume simple replies

### Step 3: Write Your System Prompt

The system prompt is the most important part. It defines your agent's personality, knowledge, and boundaries. Here's a template:

\`\`\`
You are a helpful customer support assistant for [Your Business Name], 
a [description of your business] based in [location].

Your job is to:
- Answer questions about our products/services
- Provide pricing information
- Help customers place orders
- Be friendly and professional

Important rules:
- Always respond in the customer's language
- Never make promises about delivery times you can't keep
- If you don't know the answer, tell the customer you'll connect them with a team member
- Keep responses under 200 words
\`\`\`

### Step 4: Adjust Advanced Settings

- **Temperature** (0–2): Controls creativity. Lower values (0.3–0.5) give consistent, factual responses. Higher values (0.8–1.2) produce more creative replies.
- **Max Tokens** (64–4096): Limits response length. 256–512 tokens works well for most business conversations.

### Step 5: Activate and Save

Toggle the **Active** switch on and click Save. Your agent is ready to use.

## Assigning AI Agents to Conversations

Once created, you can assign an AI agent to any conversation:

1. Open a conversation in the **Conversations** tab
2. In the right sidebar, find the **AI Agent** dropdown
3. Select your agent
4. The agent will now automatically respond to incoming messages in that conversation

## How the AI Processes Messages

When a customer sends a message to a conversation with an assigned AI agent:

1. ChatDesk receives the WhatsApp message
2. The system loads the agent's configuration and system prompt
3. Recent conversation history is included for context
4. The message is sent to OpenAI's API
5. The AI-generated response is sent back through WhatsApp
6. The response appears in your ChatDesk dashboard

The entire process takes 2–5 seconds.

## AI-Powered Contact Classification

ChatDesk's AI doesn't just reply — it also classifies contacts:

- **New Lead** — First interaction, no clear intent
- **Interested** — Shows purchase intent
- **Said No** — Explicitly declined
- **Bought** — Completed a purchase after conversation
- **Didn't Buy** — Engaged but never converted

This classification happens automatically based on conversation content, powered by AI analysis.

## Tips for Better AI Performance

1. **Be specific in your system prompt** — The more context you provide, the better the responses
2. **Test with real scenarios** — Send test messages and refine the prompt based on results
3. **Start with auto-reply type** — It's the simplest and most effective for beginners
4. **Monitor regularly** — Review AI responses in your conversation history
5. **Use low temperature for support** — Factual accuracy matters more than creativity here

---

AI agents are available on Growth and Business plans. [Upgrade your ChatDesk plan](https://chatdesk.org/signup) to unlock AI automation.
  `,
};

export default post;
