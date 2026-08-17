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
MODEL_DIR = os.path.join(BASE_DIR, "models")
YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", os.path.join(MODEL_DIR, "road_damage.pt"))
AI_CONFIDENCE_THRESHOLD = float(os.getenv("AI_CONFIDENCE_THRESHOLD", "0.45"))
AI_REJECTION_THRESHOLD = float(os.getenv("AI_REJECTION_THRESHOLD", "0.40"))

# LLM API Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# LLM Model Selection
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai")  # Options: openai, anthropic, google
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4-turbo")  # Default model

# Vision Model Configuration
VISION_MODEL = os.getenv("VISION_MODEL", "yolov11")  # Options: yolov11, florence2, grounding_dino
VISION_MODEL_PATH = os.getenv("VISION_MODEL_PATH", os.path.join(MODEL_DIR, "yolov11n.pt"))

# Embedding Configuration
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
VECTOR_DB_PATH = os.getenv("VECTOR_DB_PATH", os.path.join(BASE_DIR, "vector_db"))

# Vector Database Configuration
VECTOR_DB_TYPE = os.getenv("VECTOR_DB_TYPE", "chromadb")  # Options: chromadb, faiss, qdrant

# Severity priority for inspector queue (higher = more urgent)
SEVERITY_PRIORITY = {
    "critical": 4,
    "high": 3,
    "medium": 2,
    "low": 1,
}
