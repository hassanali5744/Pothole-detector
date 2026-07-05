import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# MongoDB Configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "roadvision")

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "roadvision_super_secret_jwt_key_2026_change_me")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

# File Upload Configuration
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# AI Model Configuration
# Place your fine-tuned YOLO weights at backend/models/road_damage.pt
MODEL_DIR = os.path.join(BASE_DIR, "models")
YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", os.path.join(MODEL_DIR, "road_damage.pt"))
AI_CONFIDENCE_THRESHOLD = float(os.getenv("AI_CONFIDENCE_THRESHOLD", "0.45"))
AI_REJECTION_THRESHOLD = float(os.getenv("AI_REJECTION_THRESHOLD", "0.40"))

# Severity priority for inspector queue (higher = more urgent)
SEVERITY_PRIORITY = {
    "critical": 4,
    "high": 3,
    "medium": 2,
    "low": 1,
}
