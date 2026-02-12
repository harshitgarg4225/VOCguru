# Propel - AI-Powered Feedback Management System

Transform customer feedback into actionable product roadmaps with AI-powered extraction, deduplication, and revenue impact analysis.

![Propel](https://via.placeholder.com/1200x600/4C1C24/ffffff?text=Propel+%E2%80%94+Build+What+Matters+Most)

## 🚀 Features

### Module 1: The Collector (Ingestion Engine)
- **Slack Integration**: Automatically capture feedback from monitored channels or via 🎫 emoji reactions
- **Zoom Integration**: Parse transcripts after calls with AI-powered cleaning
- **Webhook API**: Accept feedback from any source via `/api/webhooks/ingest`

### Module 2: The Identifier (Identity & Enrichment)
- **Stripe Integration**: Automatically fetch customer ARR and plan info
- **Identity Resolution**: Link Slack users to email addresses
- **Weight Calculation**: Score feedback based on customer value

### Module 3: The Synthesizer (Intelligence Core)
- **AI Extraction**: Use Groq (Llama 3 70B) to extract feature titles, summaries, sentiment
- **Vector Deduplication**: pgvector-powered similarity search to auto-merge duplicates
- **Tag Generation**: Automatic categorization of feedback

### Module 4: The Director (Roadmap & Sync)
- **Revenue-Sorted Roadmap**: See features ranked by "Revenue at Risk"
- **Jira Integration**: One-click push to Jira with customer quotes
- **Kanban View**: Visual status management

### Module 5: The Broadcaster (Notifications)
- **Auto-Generated Messages**: AI writes personalized release notes
- **Approval Flow**: PM reviews before sending
- **Multi-Channel**: Email (Resend) and Slack notifications

### Module 6: The Validation Portal (Public Roadmap)
- **Public Voting**: Users vote "I need this" without account creation
- **Critical Flags**: Mark urgent requests
- **Update Subscriptions**: Capture emails for launch notifications

## 🛠️ Tech Stack

- **Backend**: Node.js (TypeScript) + Express
- **Database**: PostgreSQL with pgvector extension
- **AI**: Groq API (Llama 3 70B / 8B)
- **Frontend**: Next.js 14 + React + Tailwind CSS
- **State**: TanStack Query + Zustand
- **Animations**: Framer Motion

## 🎨 Design System

| Element | Value |
|---------|-------|
| Primary (Wine) | `#4C1C24` |
| Accent (Red) | `#C90016` |
| Text (Black) | `#131313` |
| Canvas | `#F4F4F4` |
| Headings Font | Oswald |
| Body Font | Inter |

## 📁 Project Structure

```
propel/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server
│   │   ├── auth/                 # Authentication
│   │   ├── config/               # Database, Groq config
│   │   ├── database/             # Schema, migrations
│   │   ├── modules/
│   │   │   ├── collector/        # Webhook ingestion
│   │   │   ├── identifier/       # Identity resolution
│   │   │   ├── synthesizer/      # AI extraction
│   │   │   ├── director/         # Roadmap & Jira
│   │   │   ├── broadcaster/      # Notifications
│   │   │   └── portal/           # Public voting
│   │   └── types/                # TypeScript interfaces
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── app/
    │   ├── page.tsx              # Landing page
    │   ├── login/                # Auth pages
    │   ├── dashboard/            # Protected routes
    │   │   ├── page.tsx          # Overview
    │   │   ├── roadmap/          # Feature list
    │   │   ├── features/[id]/    # Feature detail
    │   │   ├── customers/        # Customer list
    │   │   └── notifications/    # Notification queue
    │   └── portal/               # Public roadmap
    ├── components/
    │   └── ui/                   # Reusable components
    ├── lib/
    │   ├── api.ts                # API client
    │   ├── store.ts              # Zustand stores
    │   └── utils.ts              # Helpers
    ├── package.json
    └── tailwind.config.ts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ with pgvector extension
- Groq API key
- (Optional) Slack App, Zoom App, Stripe API key, Jira credentials

### 1. Setup Database

```bash
# Install pgvector extension (Supabase has this built-in)
CREATE EXTENSION vector;
```

### 2. Backend Setup

```bash
cd propel/backend

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
cd propel/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Environment Variables

Create `backend/.env`:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/propel

# Groq AI
GROQ_API_KEY=your_groq_api_key

# Slack (optional)
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
MONITORED_CHANNELS=C12345678

# Stripe (optional)
STRIPE_SECRET_KEY=sk_...

# Jira (optional)
JIRA_BASE_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=you@company.com
JIRA_API_TOKEN=...
JIRA_PROJECT_KEY=PROP

# Email (optional)
RESEND_API_KEY=re_...
FROM_EMAIL=notifications@yourcompany.com

# JWT
JWT_SECRET=your-secret-key
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Webhooks
- `POST /api/webhooks/ingest` - Universal webhook endpoint
- `POST /api/webhooks/slack` - Slack events
- `POST /api/webhooks/zoom` - Zoom recordings
- `POST /api/webhooks/jira` - Jira status changes
- `POST /api/webhooks/manual` - Manual feedback submission

### Features
- `GET /api/features` - List features with filters
- `GET /api/features/:id` - Get feature with linked feedback
- `PATCH /api/features/:id` - Update feature
- `POST /api/features/merge` - Merge two features

### Roadmap
- `GET /api/roadmap` - Get roadmap view
- `GET /api/roadmap/stats` - Get statistics
- `POST /api/roadmap/:id/jira` - Push to Jira
- `PATCH /api/roadmap/:id/status` - Update status

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers/sync/:email` - Sync from Stripe
- `POST /api/customers/sync-all` - Bulk sync

### Notifications
- `GET /api/notifications/pending` - Pending queue
- `POST /api/notifications/:id/approve` - Approve
- `POST /api/notifications/:id/send` - Send
- `POST /api/notifications/blast` - Send all approved

### Public Portal
- `GET /api/portal/roadmap` - Public roadmap
- `POST /api/portal/features/:id/vote` - Submit vote

## 🎯 Usage Examples

### Submit Manual Feedback

```bash
curl -X POST http://localhost:3001/api/webhooks/manual \
  -H "Content-Type: application/json" \
  -d '{
    "content": "We really need dark mode! Working late at night and the bright UI hurts my eyes.",
    "author_email": "user@company.com",
    "author_name": "John Doe"
  }'
```

### Get Features Sorted by Revenue

```bash
curl "http://localhost:3001/api/features?sort=total_arr&order=desc"
```

### Push Feature to Jira

```bash
curl -X POST http://localhost:3001/api/roadmap/FEATURE_ID/jira \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## 🔧 Slack App Setup

1. Create a Slack App at https://api.slack.com/apps
2. Enable Event Subscriptions pointing to `/api/webhooks/slack`
3. Subscribe to: `reaction_added`, `message.channels`
4. Add Bot Token Scopes: `channels:history`, `users:read`, `users:read.email`, `chat:write`
5. Install to workspace and copy Bot Token

## 📧 Resend Email Setup

1. Create account at https://resend.com
2. Verify your domain
3. Create API key
4. Add to `.env`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details.

---

Built with 💜 by the Propel team

