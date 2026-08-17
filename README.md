# 🛣️ RoadVision AI - Pothole Detector

An AI-powered road damage detection and reporting system that uses computer vision and machine learning to automatically identify, classify, and prioritize road defects like potholes, cracks, waterlogging, and debris.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)

## ✨ Features

### 🤖 AI-Powered Detection
- **Multi-Model AI Analysis**: Uses Google Gemini, OpenAI, or Anthropic models for intelligent image analysis
- **Computer Vision**: YOLOv11-based object detection for road damage
- **Heuristic Fallback**: OpenCV-based detection when AI services are unavailable
- **Severity Assessment**: Automatic severity classification (Low/Medium/High/Critical)
- **Priority Assignment**: Smart prioritization based on damage severity and location

### 📱 User Roles
- **Citizens**: Upload road damage photos with location data
- **Inspectors**: Review AI detections, verify reports, assign repair teams
- **Administrators**: Manage users, monitor all reports, view analytics

### 🎯 Key Capabilities
- **Real-time Analysis**: Instant AI analysis of uploaded images
- **Interactive Maps**: Visualize damage locations on interactive maps
- **Duplicate Detection**: Embedding-based duplicate report detection
- **Protocol Compliance**: AI-powered validation of complaint reports
- **Department Recommendations**: Automatic assignment to appropriate departments
- **Response Time Estimation**: AI-based repair time recommendations
- **Notifications**: Real-time status updates for users
- **Analytics Dashboard**: Comprehensive insights and trends
- **Export Functionality: CSV export for reports and data

## 🏗️ Architecture

### Tech Stack

**Backend:**
- **FastAPI**: High-performance Python web framework
- **MongoDB**: NoSQL database for flexible data storage
- **YOLOv11**: State-of-the-art object detection
- **OpenCV**: Computer vision processing
- **OpenRouter**: Unified API for multiple AI models (Gemini, GPT-4, Claude)
- **ChromaDB**: Vector database for duplicate detection

**Frontend:**
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Recharts**: Data visualization
- **Leaflet**: Interactive maps

**Deployment:**
- **Docker**: Containerized deployment
- **Docker Compose**: Multi-container orchestration
- **Railway**: Cloud deployment (recommended)

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- MongoDB (local or cloud)
- Docker (optional but recommended)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/hassanali5744/Pothole-detector.git
cd Pothole-detector
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

4. **Environment Configuration**
```bash
# Copy example environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

5. **Configure Environment Variables**

**Backend (.env):**
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=roadvision
JWT_SECRET_KEY=your_secure_jwt_secret_key
LLM_PROVIDER=openrouter
LLM_MODEL=google/gemini-flash-2.5
OPENROUTER_API_KEY=your_openrouter_api_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
VISION_MODEL=yolov11
AI_CONFIDENCE_THRESHOLD=0.45
AI_REJECTION_THRESHOLD=0.40
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

6. **Start MongoDB**
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7

# Or use local MongoDB installation
mongod
```

7. **Run the Application**

**Backend:**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

8. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Docker Deployment (Recommended)

1. **Using Docker Compose**
```bash
docker-compose up --build
```

2. **Access the Application**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- MongoDB: localhost:27017

## 🌐 Cloud Deployment

### Railway (Recommended)

1. **Create Railway Account**
   - Visit [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Import Project**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `Pothole-detector` repository

3. **Configure Services**
   Railway will automatically detect your `docker-compose.yml` and create:
   - MongoDB service
   - Backend service
   - Frontend service

4. **Set Environment Variables**

**Backend Service:**
```
MONGODB_URL=${{MONGODB_URL}}
DATABASE_NAME=roadvision
JWT_SECRET_KEY=your_secure_jwt_secret
LLM_PROVIDER=openrouter
LLM_MODEL=google/gemini-flash-2.5
OPENROUTER_API_KEY=your_openrouter_api_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
VISION_MODEL=yolov11
AI_CONFIDENCE_THRESHOLD=0.45
AI_REJECTION_THRESHOLD=0.40
FRONTEND_URL=${{FRONTEND_URL}}
```

**Frontend Service:**
```
NEXT_PUBLIC_API_URL=${{BACKEND_URL}}
```

5. **Deploy**
- Railway will automatically build and deploy
- Your app will be live with HTTPS

### Other Deployment Options

- **DigitalOcean App Platform**
- **AWS ECS**
- **Render.com**
- **VPS with Docker Compose**

## 🔑 API Keys

### Free AI Options

**OpenRouter (Recommended):**
- Free tier available
- Access to multiple AI models including Google Gemini
- Sign up at [openrouter.ai](https://openrouter.ai)
- Get API key from dashboard

**Alternative Free Options:**
- Hugging Face Inference API
- Groq (free tier)
- Together AI (free tier)

### Without API Keys

The system works without API keys using:
- **YOLOv11** (if model file is available)
- **OpenCV heuristic methods** (always available)
- **Computer vision algorithms** for damage detection

*Note: AI analysis will be less sophisticated without API keys, but the system remains fully functional.*

## 📊 Project Structure

```
Pothole-detector/
├── backend/
│   ├── ai/                    # AI detection logic
│   │   ├── detector.py        # Main detection pipeline
│   │   └── vision_service.py  # Computer vision service
│   ├── ai_service/            # AI service integrations
│   │   ├── gemini_service.py  # Google Gemini integration
│   │   ├── llm_service.py     # LLM integration
│   │   └── embedding_service.py # Duplicate detection
│   ├── routers/                # API endpoints
│   │   ├── auth.py            # Authentication
│   │   ├── reports.py         # Report management
│   │   ├── users.py           # User management
│   │   ├── analytics.py       # Analytics
│   │   ├── notifications.py   # Notifications
│   │   └── ai.py              # AI analysis endpoint
│   ├── models.py              # Database models
│   ├── database.py            # MongoDB connection
│   ├── config.py              # Configuration
│   ├── main.py                # FastAPI application
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile             # Backend container
│   └── .env.example           # Environment template
├── frontend/
│   ├── app/                   # Next.js app directory
│   │   ├── (auth)/           # Authentication pages
│   │   ├── (dashboard)/      # Dashboard pages
│   │   │   ├── admin/        # Admin dashboard
│   │   │   ├── citizen/      # Citizen dashboard
│   │   │   ├── inspector/    # Inspector dashboard
│   │   │   └── map/          # Map view
│   │   └── page.tsx          # Landing page
│   ├── components/            # React components
│   │   ├── ui/               # UI components
│   │   ├── layout/           # Layout components
│   │   ├── reports/          # Report components
│   │   ├── charts/           # Chart components
│   │   ├── map/              # Map components
│   │   └── animations/       # Animation components
│   ├── lib/                   # Utilities
│   │   ├── api-client.ts     # API client
│   │   ├── constants.ts      # App constants
│   │   ├── types.ts          # TypeScript types
│   │   ├── mappers.ts        # Data mappers
│   │   └── utils.ts          # Utility functions
│   ├── package.json           # Node dependencies
│   ├── next.config.ts         # Next.js configuration
│   ├── Dockerfile             # Frontend container
│   └── .env.example           # Environment template
├── docker-compose.yml         # Multi-container setup
├── railway.toml              # Railway configuration
└── README.md                 # This file
```

## 🎯 Usage Guide

### For Citizens

1. **Register**: Create an account with email and password
2. **Upload Damage**: Take a photo of road damage and upload it
3. **Add Location**: Use GPS or enter address manually
4. **Describe**: Add details about the damage
5. **Submit**: AI will analyze and classify the damage
6. **Track**: Monitor your report status and receive updates

### For Inspectors

1. **Login**: Access the inspector dashboard
2. **Review**: Check pending reports with AI analysis
3. **Verify**: Confirm or adjust AI detections
4. **Assign**: Assign repair teams and schedule maintenance
5. **Monitor**: Track repair progress and completion

### For Administrators

1. **Manage Users**: Add/remove users and assign roles
2. **Monitor Reports**: View all reports across the system
3. **Analytics**: Access comprehensive dashboards and insights
4. **Export Data**: Generate CSV reports for analysis
5. **System Config**: Configure AI models and thresholds

## 🔧 Configuration

### AI Model Selection

The system supports multiple AI providers:

**OpenRouter (Recommended):**
```env
LLM_PROVIDER=openrouter
LLM_MODEL=google/gemini-flash-2.5
OPENROUTER_API_KEY=your_key
```

**OpenAI:**
```env
LLM_PROVIDER=openai
LLM_MODEL=gpt-4-turbo
OPENAI_API_KEY=your_key
```

**Anthropic:**
```env
LLM_PROVIDER=anthropic
LLM_MODEL=claude-3-opus
ANTHROPIC_API_KEY=your_key
```

### Detection Thresholds

Adjust sensitivity of damage detection:

```env
AI_CONFIDENCE_THRESHOLD=0.45    # Minimum confidence for detection
AI_REJECTION_THRESHOLD=0.40     # Minimum confidence to accept report
```

## 🛡️ Security

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Three user roles with specific permissions
- **CORS Configuration**: Controlled cross-origin access
- **Input Validation**: File type and size validation
- **API Key Protection**: Environment variable storage
- **SQL Injection Prevention**: MongoDB with parameterized queries

## 📈 Performance

- **FastAPI**: High-performance async API
- **Next.js**: Server-side rendering and optimization
- **MongoDB**: Efficient NoSQL database
- **Docker**: Lightweight containerization
- **CDN Ready**: Static asset optimization

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure no API keys are committed

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check MONGODB_URL in .env file
- Verify MongoDB credentials

**AI Analysis Not Working:**
- Check API key configuration
- Verify API key is valid
- Check internet connection
- System will fallback to heuristic methods

**Frontend Build Errors:**
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version (requires 20+)

**Docker Build Issues:**
- Ensure Docker is running
- Check Docker logs: `docker-compose logs`
- Rebuild containers: `docker-compose up --build`

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review API documentation at `/docs` endpoint

## 🙏 Acknowledgments

- **YOLOv11**: Object detection model
- **OpenRouter**: AI model aggregation
- **MongoDB**: Database solution
- **Next.js**: React framework
- **FastAPI**: Python web framework

---

**Built with ❤️ for safer roads and smarter infrastructure maintenance**
