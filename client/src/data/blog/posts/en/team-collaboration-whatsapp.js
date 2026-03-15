const post = {
  slug: "team-collaboration-whatsapp",
  title: "How to Manage a Team on WhatsApp Business with ChatDesk",
  excerpt:
    "Discover how ChatDesk enables team collaboration on a single WhatsApp number — assign conversations, control roles, track agent performance, and keep customers happy.",
  author: "amara",
  category: "gettingStarted",
  date: "2026-03-08",
  readTime: 7,
  coverImage:
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
  content: `
## The Challenge of Shared WhatsApp Business Accounts

Most small businesses in Africa start with one phone running WhatsApp Business. As the business grows, problems emerge:

- Only one person can use the phone at a time
- Messages get lost when the phone changes hands
- No visibility into who replied to which customer
- No way to track team performance

ChatDesk solves all of this by connecting your WhatsApp number to a web-based CRM that **multiple team members** can use simultaneously.

## Inviting Team Members

### Step 1: Set Up Your Organization

When you create a ChatDesk account, you automatically become the **Owner** of your organization. Owners have full control.

### Step 2: Invite Members

Go to **Dashboard → Settings → Members** and click **Invite Member**.

Enter their email address and assign a role:

- **Admin** — Full access to all features including billing, team management, and settings
- **Agent** — Access to conversations, contacts, and CRM. Cannot manage billing or team settings.

The invited person receives an email with a link to join your workspace.

### Step 3: Connect WhatsApp

One team member scans the WhatsApp QR code in **Settings → WhatsApp**. Once connected, all team members can send and receive messages through the same WhatsApp number.

## Role-Based Access Control

ChatDesk uses a clear role hierarchy:

| Permission | Owner | Admin | Agent |
|---|---|---|---|
| View conversations | ✅ | ✅ | ✅ |
| Send messages | ✅ | ✅ | ✅ |
| Manage contacts | ✅ | ✅ | ✅ |
| Manage CRM pipeline | ✅ | ✅ | ✅ |
| Create Quick Replies | ✅ | ✅ | ✅ |
| Send broadcasts | ✅ | ✅ | ❌ |
| Manage auto-replies | ✅ | ✅ | ❌ |
| Configure AI agents | ✅ | ✅ | ❌ |
| Invite/remove members | ✅ | ✅ | ❌ |
| Billing & subscription | ✅ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ |

## Conversation Assignment

When a new WhatsApp message arrives, it appears in the shared inbox. Team members can:

1. **Self-assign** — Click on an unassigned conversation to claim it
2. **Reassign** — Transfer a conversation to another team member
3. **Filter by assignment** — View only your assigned conversations

This prevents duplicate responses and ensures accountability.

## Notifications

ChatDesk keeps your team informed with real-time notifications:

- **New conversation** — Alert when an unassigned message arrives
- **Assigned to you** — Alert when a conversation is assigned to you
- **Mentioned** — Alert when a team member mentions you in a note

Configure notification preferences per-user in **Settings → Notifications**.

## Team Performance Tracking

Use the **Analytics** dashboard to monitor your team:

- **Response time** — Average time to first reply
- **Messages sent** — Volume per agent
- **Active conversations** — Current workload per agent
- **Resolution rate** — Percentage of conversations resolved

### Setting Goals

Track your team against benchmarks:
- First response time: Under 5 minutes
- Resolution time: Under 24 hours
- Customer satisfaction: Above 90%

## Scaling Your Team

ChatDesk plans support different team sizes:

| Plan | Team Members |
|---|---|
| **Starter** ($12/mo) | Up to 3 |
| **Growth** ($25/mo) | Up to 10 |
| **Business** ($49/mo) | Unlimited |

As your business grows, simply upgrade your plan to add more team members.

## Best Practices for Team Collaboration

1. **Define ownership** — Assign specific customers or regions to specific agents
2. **Use internal notes** — Leave context in conversations for the next agent
3. **Create Quick Replies** — Standardize responses across the team
4. **Set up auto-replies** — Handle after-hours messages automatically
5. **Review analytics weekly** — Identify bottlenecks and coaching opportunities

---

Team collaboration features are available on all plans. [Invite your team today](https://chatdesk.org/signup).
  `,
};

export default post;
