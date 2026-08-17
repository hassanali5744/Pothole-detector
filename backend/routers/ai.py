from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Form
from typing import Optional
from auth import get_current_user
from ai.detector import analyze_image_bytes, detection_to_dict
from database import get_db

router = APIRouter(prefix="/api/ai", tags=["AI"])


@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    complaintText: str = Form(""),
    location: str = Form(""),
    current_user=Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are supported for AI analysis. Please upload JPG or PNG.",
        )

    content = await file.read()
    result = await analyze_image_bytes(content, filename=file.filename or "", complaint_text=complaintText, location=location)

    # Extract Gemini-specific data if available
    severity_percentage = None
    priority = None
    if result.model_used == "gemini_api" and result.detections:
        # Extract severity percentage from confidence (converted back to percentage)
        severity_percentage = result.detections[0].confidence * 100 if result.detections else None
        # Determine priority based on 70% threshold
        priority = "high" if severity_percentage and severity_percentage >= 70 else "low"

    response = {
        "accepted": result.accepted,
        "isRoadDamage": result.is_road_damage,
        "modelUsed": result.model_used,
        "detections": [detection_to_dict(d) for d in result.detections],
        "explanation": result.explanation,
        "rejectionReason": result.rejection_reason,
        "protocolFollowed": result.protocol_followed,
        "protocolReason": result.protocol_reason,
        "suggestedDepartment": result.suggested_department,
        "recommendedResponseTime": result.recommended_response_time,
        "duplicateCheck": result.duplicate_check,
        "severityPercentage": severity_percentage,
        "priority": priority,
    }

    if not result.accepted:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=result.rejection_reason or "Image rejected — no valid road damage detected.",
        )

    return response


@router.post("/chat")
async def chat_with_assistant(
    message: str = Form(...),
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    """AI chat assistant for inspectors."""
    try:
        from ai_service.chat_service import ChatService
        
        chat_service = ChatService(db_client=db)
        response = await chat_service.chat(message)
        
        return {
            "message": response.message,
            "toolCalls": response.tool_calls,
            "toolResults": response.tool_results,
            "requiresAction": response.requires_action
        }
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chat service not available. Please ensure AI dependencies are installed."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat service error: {str(e)}"
        )


@router.post("/check-duplicate")
async def check_duplicate_complaint(
    complaintText: str = Form(...),
    damageType: str = Form(...),
    location: str = Form(...),
    current_user=Depends(get_current_user),
):
    """Check if a complaint is a duplicate using embeddings."""
    try:
        from ai_service.embedding_service import EmbeddingService
        
        embedding_service = EmbeddingService()
        result = embedding_service.check_duplicate(complaintText, damageType, location)
        
        return {
            "isDuplicate": result.is_duplicate,
            "similarityScore": result.similarity_score,
            "existingReportId": result.existing_report_id,
            "existingReportData": result.existing_report_data,
            "reason": result.reason
        }
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Embedding service not available. Please ensure AI dependencies are installed."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Duplicate check error: {str(e)}"
        )
