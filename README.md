# Task Tracker

Full-stack Task Tracker monorepo with a Node.js/Express backend, Next.js frontend, and Supabase PostgreSQL.

> **Note on Live Demo:** The backend is hosted on Render's free tier. If the application has been idle, the initial request might experience a ~60-second delay ("cold start") while the server wakes up. Please refresh the page if the initial data fetch takes longer than expected.

## Project Structure

```
task-tracker-monorepo/
├── .github/workflows/ci.yml   # CI pipeline (lint, test, build)
├── backend/                   # Express API (Render)
├── frontend/                  # Next.js UI (Vercel)
├── docker-compose.yml         # Local PostgreSQL
└── render.yaml                # Render Blueprint
```

## Prerequisites

- Node.js 20+
- npm
- Docker (optional, for local PostgreSQL)

## Setup

> Detailed setup instructions will be added as development progresses.

### Backend

```bash
cd backend
cp .env.example .env
npm install
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
```

## License

MIT
