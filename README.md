# Pinntag AI Server

Node.js + Express + TypeScript service that:

- Exposes AI endpoints to the Pinntag backend (guarded by an internal API key)
- Calls the ETL service with an API key
- Stores metadata/config in Mongo when needed

## Quick Start

```bash
# 1) Install deps
npm ci


# 2) Copy env
cp .env.example .env
# Edit ETL_BASE_URL and ETL_API_KEY, and optionally PINNTAG_BACKEND_TO_AI_KEY


# 3) Run dev
npm run dev
# Service on http://localhost:4001
```
