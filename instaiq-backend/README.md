# InstaIQ — Instagram Audience Intelligence SaaS

AI-powered audience analytics for any public Instagram account.
Built to run entirely on free tiers in its MVP phase.

---

## Tech Stack

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | Next.js 15 + TypeScript + Tailwind + shadcn/ui | Vercel (free) |
| Backend | Python 3.12 + FastAPI + SQLAlchemy | Render (free) |
| Database | PostgreSQL + Supabase Auth | Supabase (free) |
| Cache/Queue | Redis | Upstash (free) |
| Storage | Cloudinary | Cloudinary (free) |
| AI Summaries | OpenAI GPT-4o-mini | OpenAI (pay per use) |
| Emails | Resend | Resend (free) |
| Analytics | PostHog | PostHog (free) |
| Monitoring | Sentry | Sentry (free) |

---

## Project Structure

```
instaiq-backend/
├── main.py                    FastAPI app entry point
├── requirements.txt
├── Dockerfile
├── render.yaml                Render deployment config
├── supabase_migration.sql     Run once in Supabase SQL editor
├── .env.example               Copy to .env and fill in values
└── app/
    ├── config.py              Pydantic settings (reads .env)
    ├── api/
    │   └── routes.py          All API route handlers
    ├── db/
    │   ├── models.py          SQLAlchemy ORM models
    │   └── schemas.py         Pydantic request/response schemas
    ├── scrapers/
    │   └── instagram.py       Playwright-based public data scraper
    ├── nlp/
    │   └── processor.py       Language detection, country inference, bot scoring
    ├── services/
    │   ├── auth.py            JWT auth, user management
    │   └── analysis.py        Analysis pipeline orchestrator
    ├── analytics/             (extend: growth trends, engagement stats)
    ├── workers/               (extend: RQ background workers)
    └── utils/                 (extend: helpers, validators)
```

---

## API Endpoints

```
POST   /api/v1/auth/register           Register new user
POST   /api/v1/auth/login              Login, get JWT
GET    /api/v1/auth/me                 Get authenticated user

POST   /api/v1/analyze                 Start audience analysis
GET    /api/v1/reports/{id}            Poll analysis result
GET    /api/v1/insights/{username}     Get latest cached insight
GET    /api/v1/reports                 List all reports (paginated)
DELETE /api/v1/reports/{id}           Delete a report

POST   /api/v1/compare                Compare two accounts (Pro)
GET    /api/v1/usage                   Today's usage stats
GET    /api/v1/health                  Health check
```

Full interactive docs: `https://your-render-app.onrender.com/redoc`

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/yourname/instaiq-backend.git
cd instaiq-backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your Supabase, Redis, and OpenAI credentials
```

### 3. Initialize the database

```sql
-- Open Supabase Dashboard → SQL Editor
-- Paste and run the contents of supabase_migration.sql
```

### 4. Run locally

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/redoc

---

## Free Tier Deployment

### Backend (Render)

1. Push to GitHub.
2. Go to https://render.com → New Web Service → Connect your repo.
3. Render detects the `Dockerfile` automatically.
4. Set all env vars from `.env.example` in the Render dashboard.
5. Deploy. Free tier sleeps after 15 min of inactivity (use a cron ping to keep it awake).

### Frontend (Vercel)

```bash
cd instaiq-frontend
npx create-next-app@latest . --typescript --tailwind --app
vercel deploy
```

Set `NEXT_PUBLIC_API_URL=https://instaiq-api.onrender.com` in Vercel env vars.

### Database (Supabase)

1. Create project at https://supabase.com.
2. Run `supabase_migration.sql` in the SQL editor.
3. Copy `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_KEY` into your `.env`.

### Redis (Upstash)

1. Create a Redis database at https://console.upstash.com.
2. Copy the `REDIS_URL` (TLS format) into your `.env`.

---

## Free Tier Limits (MVP)

| Resource | Free Limit | InstaIQ Usage |
|---|---|---|
| Render web service | 750 hrs/month | ~1 service |
| Supabase DB | 500 MB | Plenty for MVP |
| Upstash Redis | 10K req/day | Cache hits reduce scraping |
| Cloudinary | 25 GB storage | Profile images |
| OpenAI GPT-4o-mini | ~$0.01/analysis | Budget for ~$10/month |

---

## Scale Path

When you outgrow free tiers:

```
Render free → Render Starter ($7/mo) → AWS ECS Fargate
Supabase free → Supabase Pro ($25/mo) → Dedicated Postgres
Upstash free → Upstash Pay-as-you-go → Redis Cluster
Vercel free → Vercel Pro ($20/mo) — usually last to hit limits
```

---

## Important Notes

This product ONLY analyzes **public** Instagram accounts.
It respects `robots.txt`, uses rate limiting, and does not:
- Access private accounts
- Store full user data longer than needed (cache TTL: 6 hours)
- Sell or share scraped data
- Bypass any authentication

Review Instagram's Terms of Service before production deployment.

---

## License

MIT
