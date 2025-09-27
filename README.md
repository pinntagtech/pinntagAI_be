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


# 3) Configure ETL base URL
# Recommend including API version path, e.g. http://localhost:8080/api/v1

# 4) Run dev
npm run dev
# Service on http://localhost:4001
```

## Inbound Auth (Bearer + API Key)

- Enable and configure protection for your API routes:
  - `AUTH_REQUIRE_API_KEY` (boolean): require an active API key in header.
  - `AUTH_REQUIRE_BEARER` (boolean): require a bearer token in `Authorization`.
  - `AUTH_REQUIRE_BOTH` (boolean): when both above are true, require both instead of either.
  - `AUTH_API_KEY_HEADER_NAME` (string): header name to read API key from, default `x-api-key`.
  - `AUTH_STATIC_API_KEY` (string): optional static API key value to accept.
  - `AUTH_BEARER_TOKEN` (string): optional single bearer token value to accept.
  - `AUTH_BEARER_TOKENS` (string): optional comma-separated list of allowed bearer tokens.

Notes
- Health endpoint `/etl/health` remains public; all other `/etl/*` routes are protected when enabled.
- API keys can also be stored in MongoDB (`ApiKey` collection) with `{ key, active: true }`.
