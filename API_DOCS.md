# Bio-Stock API Docs

## Auth
- `POST /auth/register`
- `POST /auth/login`

## Health
- `POST /health/log`
- `GET /health/today`
- `GET /health/history?days=7`

## Tokens
- `GET /tokens/balance`
- `POST /tokens/stake`
- `GET /tokens/goals`

## Dashboard
- `GET /dashboard/`

Use header:
`Authorization: Bearer <token>`
