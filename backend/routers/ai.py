from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from auth import get_current_user
from ai.detector import analyze_image_bytes, detection_to_dict

router = APIRouter(prefix="/api/ai", tags=["AI"])


@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are supported for AI analysis. Please upload JPG or PNG.",
        )

    content = await file.read()
    result = analyze_image_bytes(content, filename=file.filename or "")

    response = {
        "accepted": result.accepted,
        "isRoadDamage": result.is_road_damage,
        "modelUsed": result.model_used,
        "detections": [detection_to_dict(d) for d in result.detections],
        "explanation": result.explanation,
        "rejectionReason": result.rejection_reason,
    }

    if not result.accepted:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=result.rejection_reason or "Image rejected — no valid road damage detected.",
        )

    return response
