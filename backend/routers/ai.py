import random
from fastapi import APIRouter, Depends, UploadFile, File
from auth import get_current_user

router = APIRouter(prefix="/api/ai", tags=["AI"])

DETECTION_TEMPLATES = [
    {
        "damageType": "pothole",
        "severity": "high",
        "explanation": "Large circular depression detected with irregular edges. Estimated depth appears significant based on shadow analysis.",
    },
    {
        "damageType": "crack",
        "severity": "medium",
        "explanation": "Linear crack pattern detected spanning a significant portion of the road surface.",
    },
    {
        "damageType": "waterlogging",
        "severity": "critical",
        "explanation": "Standing water covering road surface area — potential drainage failure detected.",
    },
]


@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    # Mock AI analysis — replace with real model inference later
    template = random.choice(DETECTION_TEMPLATES)
    confidence = round(random.uniform(0.82, 0.97), 2)
    return {
        "detections": [
            {
                "damageType": template["damageType"],
                "confidence": confidence,
                "severity": template["severity"],
                "explanation": template["explanation"],
            }
        ],
        "explanation": f"AI analysis complete. Primary defect: {template['damageType'].replace('_', ' ')} with {confidence * 100:.0f}% confidence.",
    }
