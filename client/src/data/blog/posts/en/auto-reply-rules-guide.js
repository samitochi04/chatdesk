const post = {
  slug: "auto-reply-rules-guide",
  title: "The Complete Guide to Auto-Reply Rules on ChatDesk",
  excerpt:
    "Master ChatDesk's auto-reply system: create keyword-triggered rules, connect AI agents, set priorities, and automate your WhatsApp customer responses.",
  author: "kwame",
  category: "tips",
  date: "2026-03-03",
  readTime: 6,
  coverImage:
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
  content: `
## Never Miss a Customer Message Again

Your customers expect instant responses. Studies show that 82% of consumers expect a reply within 10 minutes of reaching out on messaging platforms. ChatDesk's Auto-Reply system ensures every message gets an immediate response — even when your team is offline.

## How Auto-Reply Rules Work

Auto-reply rules are simple: when a customer message contains specific **trigger keywords**, ChatDesk automatically sends a **pre-written response** — or triggers an **AI agent** to generate a contextual reply.

The system checks incoming messages against all active rules sorted by priority. The first matching rule triggers.

## Creating Your First Auto-Reply Rule

Navigate to **Dashboard → Auto-Replies** and click **Create Rule**.

### Configure the Rule

1. **Rule Name** — A descriptive label (e.g., "Pricing Enquiry")
2. **Trigger Keywords** — Comma-separated words that activate this rule (e.g., "price, pricing, cost, how much, combien")
3. **Response Text** — The message sent when keywords match:
   \`\`\`
   Thanks for your interest! Here are our prices:
   
   📦 Starter: $12/month
   🚀 Growth: $25/month
   💼 Business: $49/month
   
   Reply with the plan name for more details!
   \`\`\`
4. **Assign AI Agent** (optional) — Instead of a static response, let an AI agent generate a contextual reply
5. **Priority** — Higher numbers are checked first (useful when multiple rules might match)
6. **Active Toggle** — Enable or disable the rule instantly

### Preview Your Rule

Before saving, ChatDesk shows a preview: *"When customer says 'price', auto-reply: Thanks for your interest!..."*

## Rule Priority System

When a message matches multiple rules, the rule with the **highest priority number** wins. This lets you create a hierarchy:

| Priority | Rule | Keywords |
|---|---|---|
| **100** | VIP Greeting | "hello, hi" (for VIP contacts) |
| **50** | General Greeting | "hello, hi, hey" |
| **80** | Pricing | "price, cost, how much" |
| **30** | Catch-All | "help, support, info" |

## Static Reply vs AI Agent Reply

### Static Reply
Best for predictable questions with fixed answers:
- Business hours
- Location/address
- Pricing tables
- Order tracking links

### AI Agent Reply
Best for nuanced conversations:
- Product recommendations
- Custom quotes
- Troubleshooting
- Follow-up questions

When you assign an AI agent to a rule, the static response text becomes the fallback — used only if the AI service is unavailable.

## Real-World Auto-Reply Examples

### For a Restaurant
- **Keywords**: "menu, food, order"
- **Response**: "🍽️ Here's today's menu: [link]. To order, reply with your items!"

### For an Online Store
- **Keywords**: "delivery, shipping, track"
- **Response**: "📦 Delivery takes 2-5 business days within Nigeria. Track your order here: [link]"

### For a Service Business
- **Keywords**: "appointment, book, schedule"
- **Response**: "📅 Book your appointment here: [link]. Available slots: Mon-Fri, 9 AM - 5 PM."

## Best Practices

1. **Start with 3-5 rules** covering your most common questions
2. **Use multiple keywords per rule** — customers phrase things differently
3. **Keep responses concise** — Under 160 characters gets the highest read rates
4. **Include a call-to-action** — "Reply YES to confirm" or "Click here to order"
5. **Review and update monthly** — Add new keywords as you discover common patterns
6. **Use emojis sparingly** — They increase engagement but don't overdo it

## Monitoring Performance

Check your **Analytics** dashboard to see:
- How many auto-replies were triggered
- Which rules fire most frequently
- Customer satisfaction after auto-replies

---

Auto-reply rules are available on all ChatDesk plans. [Get started now](https://chatdesk.org/signup).
  `,
};

export default post;
