# RoadVision AI

Intelligent Road Damage Detection & Reporting Platform — AI-powered web app for detecting road defects, generating inspection reports, and managing repairs.

## Tech Stack

| Layer    | Technology        |
|----------|-------------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend  | FastAPI (Python)  |
| Database | MongoDB (planned) |

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

**Demo accounts:**

| Role      | Email                    |
|-----------|--------------------------|
| Citizen   | citizen@roadvision.ai    |
| Inspector | inspector@roadvision.ai  |
| Admin     | admin@roadvision.ai      |

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install fastapi uvicorn
uvicorn main:app --reload
```

API runs at [http://localhost:8000](http://localhost:8000)

## Features

- **AI Detection** — Potholes, cracks, faded markings, waterlogging, debris
- **Role-based dashboards** — Citizen, Inspector, Administrator
- **Interactive map** — Damage locations with severity markers
- **Analytics** — Charts for damage types, trends, and repair completion
- **Repair workflow** — Reported → Verified → Assigned → In Progress → Completed
- **Notifications** — In-app alerts for report status updates
