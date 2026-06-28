import logging
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from config import MONGODB_URL, DATABASE_NAME
from security import get_password_hash

logger = logging.getLogger(__name__)

client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]


def get_db():
    return db


async def init_db():
    try:
        await client.admin.command("ping")
        logger.info(f"Connected to MongoDB at {MONGODB_URL} (database: {DATABASE_NAME})")

        await db.users.create_index("email", unique=True)
        logger.info("Ensured unique index on users.email")

        user_count = await db.users.count_documents({})
        if user_count == 0:
            logger.info("Seeding demo users...")
            hashed_password = get_password_hash("demo123")
            mock_users = [
                {
                    "_id": "u1",
                    "name": "John Citizen",
                    "email": "citizen@roadvision.ai",
                    "password": hashed_password,
                    "role": "citizen",
                    "createdAt": "2025-01-15T10:00:00Z",
                },
                {
                    "_id": "u2",
                    "name": "Sarah Inspector",
                    "email": "inspector@roadvision.ai",
                    "password": hashed_password,
                    "role": "inspector",
                    "createdAt": "2025-01-10T10:00:00Z",
                },
                {
                    "_id": "u3",
                    "name": "Admin User",
                    "email": "admin@roadvision.ai",
                    "password": hashed_password,
                    "role": "admin",
                    "createdAt": "2025-01-01T10:00:00Z",
                },
            ]
            await db.users.insert_many(mock_users)
            logger.info("Seeded 3 demo users (password: demo123)")

        report_count = await db.reports.count_documents({})
        if report_count == 0:
            logger.info("Seeding demo reports...")
            mock_reports = [
                {
                    "_id": "r1",
                    "userId": "u1",
                    "userName": "John Citizen",
                    "imageUrl": "https://images.unsplash.com/photo-1515169067865-5387ec356f45?w=800&q=80",
                    "location": {"lat": 28.6139, "lng": 77.209, "address": "Connaught Place, Block A", "city": "New Delhi"},
                    "damageType": "pothole",
                    "severity": "high",
                    "status": "reported",
                    "aiConfidence": 0.94,
                    "aiDetections": [{"damageType": "pothole", "confidence": 0.94, "severity": "high", "explanation": "Large pothole detected."}],
                    "aiExplanation": "AI detected a large pothole with high confidence.",
                    "createdAt": "2026-06-20T08:30:00Z",
                    "updatedAt": "2026-06-20T08:30:00Z",
                    "assignedTo": None,
                    "notes": None,
                    "scheduledDate": None,
                },
                {
                    "_id": "r2",
                    "userId": "u1",
                    "userName": "John Citizen",
                    "imageUrl": "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=800&q=80",
                    "location": {"lat": 28.5355, "lng": 77.391, "address": "Sector 18, Noida", "city": "Noida"},
                    "damageType": "crack",
                    "severity": "medium",
                    "status": "verified",
                    "aiConfidence": 0.87,
                    "aiDetections": [{"damageType": "crack", "confidence": 0.87, "severity": "medium", "explanation": "Surface crack detected."}],
                    "aiExplanation": "Surface crack detected with moderate severity.",
                    "createdAt": "2026-06-18T14:15:00Z",
                    "updatedAt": "2026-06-19T09:00:00Z",
                    "assignedTo": None,
                    "notes": None,
                    "scheduledDate": None,
                },
                {
                    "_id": "r3",
                    "userId": "u1",
                    "userName": "John Citizen",
                    "imageUrl": "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80",
                    "location": {"lat": 28.4595, "lng": 77.0266, "address": "MG Road, Gurgaon", "city": "Gurgaon"},
                    "damageType": "waterlogging",
                    "severity": "critical",
                    "status": "assigned",
                    "aiConfidence": 0.91,
                    "aiDetections": [{"damageType": "waterlogging", "confidence": 0.91, "severity": "critical", "explanation": "Standing water detected."}],
                    "aiExplanation": "Critical waterlogging detected.",
                    "createdAt": "2026-06-15T06:45:00Z",
                    "updatedAt": "2026-06-17T11:30:00Z",
                    "assignedTo": "Team Alpha",
                    "notes": "Drainage inspection required.",
                    "scheduledDate": "2026-06-20T09:00:00Z",
                },
                {
                    "_id": "r4",
                    "userId": "u1",
                    "userName": "John Citizen",
                    "imageUrl": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
                    "location": {"lat": 28.7041, "lng": 77.1025, "address": "Ring Road, Pitampura", "city": "New Delhi"},
                    "damageType": "faded_markings",
                    "severity": "low",
                    "status": "in_progress",
                    "aiConfidence": 0.82,
                    "aiDetections": [{"damageType": "faded_markings", "confidence": 0.82, "severity": "low", "explanation": "Faded lane markings."}],
                    "aiExplanation": "Faded lane markings detected.",
                    "createdAt": "2026-06-10T10:00:00Z",
                    "updatedAt": "2026-06-22T08:00:00Z",
                    "assignedTo": "Team Beta",
                    "notes": "Lane marking repaint in progress.",
                    "scheduledDate": "2026-06-22T08:00:00Z",
                },
                {
                    "_id": "r5",
                    "userId": "u1",
                    "userName": "John Citizen",
                    "imageUrl": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
                    "location": {"lat": 28.628, "lng": 77.2065, "address": "India Gate Circle", "city": "New Delhi"},
                    "damageType": "debris",
                    "severity": "medium",
                    "status": "completed",
                    "aiConfidence": 0.89,
                    "aiDetections": [{"damageType": "debris", "confidence": 0.89, "severity": "medium", "explanation": "Road debris detected."}],
                    "aiExplanation": "Road debris identified and cleared.",
                    "createdAt": "2026-06-05T16:20:00Z",
                    "updatedAt": "2026-06-08T12:00:00Z",
                    "assignedTo": "Team Gamma",
                    "notes": None,
                    "scheduledDate": "2026-06-06T10:00:00Z",
                },
            ]
            await db.reports.insert_many(mock_reports)
            logger.info("Seeded 5 demo reports")

        notif_count = await db.notifications.count_documents({})
        if notif_count == 0:
            logger.info("Seeding demo notifications...")
            mock_notifications = [
                {
                    "_id": "n1",
                    "userId": "u1",
                    "title": "Report Accepted",
                    "message": "Your pothole report at Connaught Place has been received and is under review.",
                    "type": "success",
                    "read": False,
                    "createdAt": "2026-06-20T08:35:00Z",
                    "reportId": "r1",
                },
                {
                    "_id": "n2",
                    "userId": "u1",
                    "title": "Report Verified",
                    "message": "Your crack report at Sector 18, Noida has been verified by an inspector.",
                    "type": "info",
                    "read": False,
                    "createdAt": "2026-06-19T09:05:00Z",
                    "reportId": "r2",
                },
                {
                    "_id": "n3",
                    "userId": "u1",
                    "title": "Repair Assigned",
                    "message": "Team Alpha has been assigned to fix waterlogging at MG Road, Gurgaon.",
                    "type": "info",
                    "read": True,
                    "createdAt": "2026-06-17T11:35:00Z",
                    "reportId": "r3",
                },
                {
                    "_id": "n4",
                    "userId": "u1",
                    "title": "Repair Completed",
                    "message": "Road debris at India Gate Circle has been cleared. Thank you for reporting!",
                    "type": "success",
                    "read": True,
                    "createdAt": "2026-06-08T12:05:00Z",
                    "reportId": "r5",
                },
            ]
            await db.notifications.insert_many(mock_notifications)
            logger.info("Seeded 4 demo notifications")

    except Exception as e:
        logger.error(f"MongoDB initialization failed: {e}")
        logger.error("Ensure MongoDB is running (mongodb://localhost:27017) or set MONGODB_URL in .env")
