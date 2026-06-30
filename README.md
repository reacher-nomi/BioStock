# Bio-Stock: Health Gamification Mobile App

Bio-Stock turns daily health metrics into a tradeable token economy. Users log
blood pressure, steps, sleep, and heart rate; each day is scored as **GREEN /
YELLOW / RED**; healthy days mint **Health Tokens (HT)**; streaks add
multipliers; and tokens can be **staked** on short health goals.

## Stack
- **Frontend:** React Native + Expo Router
- **Backend:** FastAPI + SQLAlchemy
- **DB:** SQLite
- **Auth:** JWT

## Features
- Email/password auth (JWT, bcrypt hashing, login rate limiting)
- Daily biometric logging with zone classification and compliance scoring
- Token rewards: GREEN = 10 HT, YELLOW = 3 HT, RED = 0 HT
- Streak multipliers: 7d ×1.5, 30d ×2, 90d ×3
- **Δ-improvement bonus** — extra tokens for improving cardiovascular metrics
  versus a personal baseline
- Staking on 7-day goals with **automatic resolution** (success refunds the
  stake, failure forfeits it)
- **Wallet** — full token transaction ledger (rewards, stakes, refunds)
- **Portfolio** — cumulative-value chart, zone distribution, baseline progress
- Dark "liquid glass" UI with bento dashboard and icon navbar
- **FHIR R4** interoperability (`/fhir/Observation`, `/fhir/Patient`) with LOINC codes
- Structured JSON logging with request correlation IDs
- Backend test suite (pytest) run automatically in CI (GitHub Actions)

## Project Structure
```
bio-stock/
├── bio-stock-api/      FastAPI backend (models, routes, services)
├── bio-stock-app/      Expo mobile app (app/, components/, utils/)
└── docker-compose.yml  Runs API + Expo web together
```

## Run in GitHub Codespaces (zero setup)
This repo ships a `.devcontainer/`, so opening it in a Codespace
**automatically builds the image and starts the app**:

1. On the GitHub repo: **Code ▸ Codespaces ▸ Create codespace**.
2. Wait for the build to finish (it runs `docker compose up --build`).
3. Open the forwarded **port 8000** — that's the whole app.

The API serves the web app on the same port (single-origin), so there is
nothing to configure between ports and no CORS/public-port step.

## Run with Docker (recommended for a quick demo)
Requires Docker Desktop running.
```bash
docker compose up --build
```
- App + API → http://localhost:8000 (API docs at http://localhost:8000/docs)
- The container builds the web bundle, seeds the demo user, and serves both.

> Native iOS/Android run on the host, not in Docker — Metro needs direct access
> to a device/emulator. Use the manual frontend steps below for native.

## Run manually

### Backend
```bash
cd bio-stock-api
python -m venv venv
venv\Scripts\activate        # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python seed_data.py
uvicorn main:app --reload
```

### Frontend (native)
```bash
cd bio-stock-app
npm install
npx expo run:android         # or: npx expo start, then press a / i
```
The app auto-targets `10.0.2.2:8000` on the Android emulator and
`localhost:8000` elsewhere. Override with the `EXPO_PUBLIC_API_URL` env var.

## Configuration
Backend env vars (see `bio-stock-api/.env.example`):
- `APP_ENV` — `development` or `production` (production requires a secret)
- `JWT_SECRET_KEY` — signing key for JWTs
- `CORS_ORIGINS` — comma-separated allowed web origins
- `DATABASE_URL` — SQLAlchemy URL (defaults to local SQLite)

## Tests
```bash
cd bio-stock-api
python -m pytest
```
Covers auth, health logging, zone classification, staking, the Δ-engine, and
FHIR output. Runs automatically on every push via GitHub Actions.

## Test User
- Email: `test@test.com`
- Password: `password`

## API
See [API_DOCS.md](API_DOCS.md) for the full endpoint reference.
