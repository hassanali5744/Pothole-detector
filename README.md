# RoadVision AI

Intelligent Road Damage Detection & Reporting Platform — AI-powered web app for detecting road defects, generating inspection reports, and managing repairs.

## Tech Stack

| Layer    | Technology        |
|----------|-------------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend  | FastAPI (Python)  |
| Database | MongoDB           |

## Project Structure

```
Pothole-detector/
├── frontend/     # Next.js web application
└── backend/      # FastAPI REST API
```

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Demo accounts:**

| Role      | Email                    |
|-----------|--------------------------|
| Citizen   | citizen@roadvision.ai    |
| Inspector | inspector@roadvision.ai  |
| Admin     | admin@roadvision.ai      |

### Backend + MongoDB

1. **Start MongoDB** (pick one):
   - Docker: `docker compose up -d mongodb`
   - Or install [MongoDB Community](https://www.mongodb.com/try/download/community) locally

2. **Configure & run API:**

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env       # or use the included .env
uvicorn main:app --reload
```

API: [http://localhost:8000](http://localhost:8000)  
Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)  
API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

Demo password for all accounts: `demo123`

## Features

- **AI Detection** — Potholes, cracks, faded markings, waterlogging, debris
- **Role-based dashboards** — Citizen, Inspector, Administrator
- **Interactive map** — Damage locations with severity markers
- **Analytics** — Charts for damage types, trends, and repair completion
- **Repair workflow** — Reported → Verified → Assigned → In Progress → Completed
- **Notifications** — In-app alerts for report status updates
