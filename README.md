# ChatDesk

A WhatsApp CRM SaaS platform that helps African businesses manage customer conversations, automate replies with AI, track sales pipelines, and run broadcast campaigns — all from a single dashboard.

## Features

- **WhatsApp Integration** — Connect business WhatsApp numbers; view and reply to all messages from the dashboard.
- **Team Collaboration** — Multiple team members can handle conversations on the same number, with internal notes and assignments.
- **AI Agents** — Assign conversations to AI agents (marketing, follow-up, support) for automated replies; configure keyword-triggered auto-responses.
- **Customer Database (CRM)** — Auto-created customer profiles with phone, name, tags (VIP, repeat buyer…), classification (interested, bought, said no…), order history.
- **Sales Pipeline** — Track leads through customisable stages: New Lead → Interested → Negotiating → Won / Lost.
- **Broadcast Campaigns** — Send promotional messages to contacts filtered by tags.
- **Data Analysis & Growth Suggestions** — AI-powered analytics on customer behaviour, conversation quality, and sales performance.
- **Internationalisation** — English & French (i18n).

## Subscription Plans (B2B — no payment module)

Users sign up and are approved by a platform super-admin who assigns a plan.

| Feature | Starter | Growth | Business |
|---|---|---|---|
| WhatsApp numbers | 1 | 3 | 10 |
| Team members | 2 | 5 | Unlimited |
| Auto-reply / CRM | Yes | Yes | Yes |
| Broadcast | — | Yes | Yes |
| Analytics | — | Yes | Yes |
| Advanced automation | — | — | Yes |
| Export CSV | — | — | Yes |
| Data analysis | — | — | Yes |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, Tailwind CSS, i18n (EN/FR) |
| Backend | Node.js + Express.js |
| Database | Supabase (PostgreSQL) |
| WhatsApp | whatsapp-web.js |
| AI | OpenAI API (GPT-4o-mini) |
| Deployment | Docker & Docker Compose |

## Database

The complete Supabase schema lives in `database/schema.sql`. It contains:

- **19 tables** — organizations, profiles, whatsapp_accounts, contacts, tags, contact_tags, ai_agents, auto_reply_rules, conversations, messages, pipeline_stages, pipeline_deals, broadcasts, broadcast_recipients, quick_replies, conversation_notes, activity_log, ai_analyses, team_invitations.
- **13 enums** — subscription_plan, user_role, approval_status, whatsapp_status, conversation_status, message_type, message_status, sender_type, ai_agent_type, contact_classification, broadcast_status, broadcast_recipient_status, invitation_status.
- **9 functions** — handle_new_user, handle_new_organization, set_plan_features, handle_updated_at, update_conversation_on_new_message, update_contact_on_new_message, plus 3 RLS helpers.
- **16 triggers** — auth signup, plan feature sync, default pipeline/tag seeding, conversation & contact timestamp updates, updated_at on all mutable tables.
- **Full RLS** — Row Level Security enabled on every table with multi-tenant isolation policies.

### Running the schema

1. Open the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql).
2. Paste the contents of `database/schema.sql`.
3. Click **Run**.
4. After your first user signs up, promote them to super-admin:

```sql
update public.profiles
set role = 'super_admin'
where id = '<YOUR_USER_UUID>';
```

## Target Market

African countries — Nigeria, Ghana, Kenya, South Africa, Cameroon, Ivory Coast, Senegal.