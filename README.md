# Bio-Stock: Health Gamification Mobile App

Bio-Stock is a mobile prototype where users log daily health metrics, earn tokens, and stake them on short goals.

## Stack
- Frontend: React Native + Expo Router
- Backend: FastAPI + SQLAlchemy
- DB: SQLite
- Auth: JWT

## Project Structure
- `bio-stock-api/` backend
- `bio-stock-app/` mobile app

## Quick Start

### Backend
```bash
cd bio-stock/bio-stock-api
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python seed_data.py
uvicorn main:app --reload
```

### Frontend
```bash
cd bio-stock/bio-stock-app
npm install
npx expo start
```

## Test User
- Email: `test@test.com`
- Password: `password`
