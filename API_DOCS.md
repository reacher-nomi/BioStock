# Bio-Stock API Docs

Base URL (local): `http://localhost:8000` — interactive docs at `/docs`.

All endpoints except `/auth/*` require a bearer token:
```
Authorization: Bearer <access_token>
```

## Auth
### `POST /auth/register`
Body: `{ "email": "user@example.com", "password": "secret12" }`
(password: min 8 chars, must contain a letter and a digit). Rate limited to
5 requests/min per IP. Returns `{ "access_token", "token_type" }`.

### `POST /auth/login`
Body: `{ "email", "password" }`. Rate limited (5/min per IP).
Returns `{ "access_token", "token_type" }`.

## Health
### `POST /health/log`
Logs today's biometrics (once per day). Body:
```json
{ "systolic_bp": 118, "diastolic_bp": 76, "steps": 8500, "sleep_hours": 7.5, "resting_hr": 68 }
```
Values are range-validated. Response:
```json
{
  "id": 1,
  "zone": "green",
  "tokens_earned": 15,
  "compliance_rate": 100.0,
  "metric_breakdown": { "systolic_bp": true, "diastolic_bp": true, "steps": true, "sleep_hours": true, "resting_hr": true },
  "delta_bonus": 5,
  "has_baseline": true
}
```
`tokens_earned` includes the streak bonus plus any `delta_bonus` (extra tokens
for improving cardiovascular metrics versus your baseline).

### `GET /health/today`
Returns `{ "logged": false }` or `{ "logged": true, "zone", "tokens_earned" }`.

### `GET /health/history?days=30`
Chronological list of logs including raw metrics:
```json
[{ "date": "2024-06-01", "zone": "green", "tokens_earned": 15,
   "systolic_bp": 118, "diastolic_bp": 76, "steps": 8500, "sleep_hours": 7.5, "resting_hr": 68 }]
```

### `GET /health/progress`
Baseline (avg of earliest logs) vs latest reading with per-metric improvement:
```json
{
  "has_baseline": true,
  "baseline": { "systolic_bp": 135.0, "diastolic_bp": 88.0, "resting_hr": 78.0 },
  "current":  { "systolic_bp": 118,   "diastolic_bp": 76,   "resting_hr": 68 },
  "improvement": { "systolic_bp": 12.6, "diastolic_bp": 13.6, "resting_hr": 12.8 }
}
```

## Tokens
### `GET /tokens/balance`
`{ "user_id": 1, "balance": 179 }`

### `GET /tokens/ledger?limit=50`
Full transaction history (rewards minted, stakes burned, refunds):
```json
[{ "id": 12, "amount": 15, "transaction_type": "MINT",
   "reason": "Daily log: GREEN zone (streak: 3 days)", "created_at": "2024-06-01T08:00:00" }]
```

### `POST /tokens/stake`
Body: `{ "goal_name": "7-Day Green Streak", "stake_amount": 25 }`
(`stake_amount` must be > 0; balance must cover it). Burns the stake and creates
a 7-day ACTIVE goal. Returns the goal.

### `GET /tokens/goals`
All goals with `days_remaining`. Past-due ACTIVE goals are auto-resolved on read:
`SUCCESS` (refunds the stake) or `FAILED` (forfeits it).

## Dashboard
### `GET /dashboard/`
Aggregated view: `user_email`, `token_balance`, `current_streak`,
`today_zone`, `recent_logs`, `active_goals`.

## FHIR (healthcare interoperability)
Biometrics are exposed as validated **FHIR R4** resources
(`application/fhir+json`) with real LOINC codes and UCUM units.

### `GET /fhir/Patient/me`
Returns the authenticated user as a FHIR `Patient` resource.

### `GET /fhir/Observation?days=30`
Returns a FHIR `Bundle` (type `searchset`) of `Observation` resources — one per
biometric per day. LOINC codes used: systolic BP `8480-6`, diastolic BP
`8462-4`, steps `41950-7`, sleep `93832-4`, resting HR `40443-4`.

## Errors
JSON `{ "detail": "..." }` with status codes: 400 (bad input), 401 (auth),
409 (already logged today), 429 (rate limited).
