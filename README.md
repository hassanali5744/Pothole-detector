# RoadVision AI

Intelligent Road Damage Detection & Reporting Platform — AI-powered web app for detecting road defects, generating inspection reports, and managing repairs.

## Tech Stack

| Layer    | Technology        |
|----------|-------------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend  | FastAPI (Python)  |
| Database | MongoDB           |
| AI Vision| YOLOv11, Florence-2, Grounding DINO |
| AI LLM   | GPT-4, Claude Sonnet, Gemini 2.5 Pro |
| Embeddings| Sentence Transformers, BGE-M3 |
| Vector DB| ChromaDB, FAISS, Qdrant |

## Project Structure

```
Pothole-detector/
├── frontend/     # Next.js web application
└── backend/      # FastAPI REST API
    ├── ai/                 # Legacy AI detection pipeline
    ├── ai_service/         # Production AI services
    │   ├── llm_service.py      # LLM-based features
    │   ├── vision_service.py    # Vision model integration
    │   ├── embedding_service.py # Duplicate detection
    │   └── chat_service.py      # AI chat assistant
    └── routers/            # API endpoints
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
```

Create `backend/.env`:
```env
# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=roadvision
JWT_SECRET_KEY=your_super_secret_jwt_key_change_me

# AI/LLM Configuration (Optional - fallback to heuristic methods if not provided)
LLM_PROVIDER=openai  # Options: openai, anthropic, google
LLM_MODEL=gpt-4-turbo
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Vision Model Configuration
VISION_MODEL=yolov11  # Options: yolov11, florence2, grounding_dino
VISION_MODEL_PATH=backend/models/yolov11n.pt

# Embedding & Vector Database Configuration
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
VECTOR_DB_TYPE=chromadb  # Options: chromadb, faiss, qdrant
VECTOR_DB_PATH=backend/vector_db
```

Run the API:
```bash
uvicorn main:app --reload
```

API: [http://localhost:8000](http://localhost:8000)  
Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)  
API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

Demo password for all accounts: `demo123`

## Features

### AI-Powered Features
- **Vision Detection** — YOLOv11-based road damage detection with confidence scoring
- **LLM Protocol Verification** — GPT-4/Claude/Gemini for complaint protocol compliance
- **AI Severity Classification** — Multi-factor severity assessment (text + vision + size)
- **Smart Department Assignment** — LLM-based department recommendations
- **Repair Estimation** — AI-powered priority and response time estimation
- **Duplicate Detection** — Embedding-based similarity matching with vector database
- **Inspector AI Summary** — Concise AI-generated summaries for inspectors
- **AI Chat Assistant** — Function-calling enabled chat for inspectors

### Core Features
- **AI Detection** — Potholes, cracks, faded markings, waterlogging, debris
- **Role-based dashboards** — Citizen, Inspector, Administrator
- **Interactive map** — Damage locations with severity markers
- **Analytics** — Charts for damage types, trends, and repair completion
- **Repair workflow** — Reported → Verified → Assigned → In Progress → Completed
- **Notifications** — In-app alerts for report status updates
- **User Management** — Full CRUD for admin users
- **CSV Export** — Filterable data export for reports

## AI Service Configuration

The application uses a tiered AI approach:

1. **Production Mode**: When API keys are provided, uses GPT-4/Claude/Gemini for LLM tasks and YOLOv11 for vision
2. **Fallback Mode**: When API keys are not available, uses heuristic methods with rule-based logic
3. **Graceful Degradation**: Each AI feature has fallback methods to ensure system reliability

### Required AI Dependencies

For full AI functionality, these packages are included in `requirements.txt`:
- openai, anthropic, langchain, langchain-openai, langchain-anthropic
- sentence-transformers, chromadb
- ultralytics, torch, torchvision, transformers, accelerate

These can be skipped if using fallback mode.
