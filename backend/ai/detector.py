"""
Road damage detection pipeline.

Now uses production-ready AI services:
- VisionService: YOLOv11/Florence-2 for image analysis
- LLMService: GPT-4/Claude/Gemini for protocol, severity, department
- EmbeddingService: Duplicate detection with embeddings

Fallback to heuristic methods if AI services unavailable.
"""

from __future__ import annotations

import io
import logging
import os
from dataclasses import dataclass, field
from typing import Optional

import cv2
import numpy as np
from PIL import Image

from config import YOLO_MODEL_PATH, AI_CONFIDENCE_THRESHOLD, AI_REJECTION_THRESHOLD

# Import new AI services
try:
    from ai_service.vision_service import VisionService, Detection as VisionDetection
    from ai_service.llm_service import LLMService, ProtocolCheckResult, SeverityClassification, DepartmentRecommendation, RepairEstimate
    from ai_service.embedding_service import EmbeddingService, DuplicateCheckResult
    from ai_service.gemini_service import GeminiService, GeminiAnalysisResult
    AI_SERVICES_AVAILABLE = True
except ImportError:
    AI_SERVICES_AVAILABLE = False
    logging.warning("AI services not available, using fallback methods")

logger = logging.getLogger(__name__)

VALID_DAMAGE_TYPES = {
    "pothole",
    "crack",
    "faded_markings",
    "waterlogging",
    "debris",
}

SEVERITY_ORDER = ["low", "medium", "high", "critical"]


@dataclass
class Detection:
    damage_type: str
    confidence: float
    severity: str
    explanation: str
    bounding_box: Optional[dict] = None


@dataclass
class AnalysisResult:
    accepted: bool
    is_road_damage: bool
    detections: list[Detection] = field(default_factory=list)
    explanation: str = ""
    rejection_reason: Optional[str] = None
    model_used: str = "heuristic"
    protocol_followed: bool = True
    protocol_reason: str = ""
    suggested_department: str = ""
    recommended_response_time: str = ""
    duplicate_check: Optional[dict] = None


_yolo_model = None
_yolo_load_attempted = False

# Initialize AI services
_vision_service = None
_llm_service = None
_embedding_service = None
_gemini_service = None


def _get_ai_services():
    """Get or initialize AI services."""
    global _vision_service, _llm_service, _embedding_service, _gemini_service
    
    if not AI_SERVICES_AVAILABLE:
        return None, None, None, None
    
    try:
        if _vision_service is None:
            _vision_service = VisionService()
        if _llm_service is None:
            _llm_service = LLMService()
        if _embedding_service is None:
            _embedding_service = EmbeddingService()
        if _gemini_service is None:
            _gemini_service = GeminiService()
        
        return _vision_service, _llm_service, _embedding_service, _gemini_service
    except Exception as e:
        logger.warning(f"Failed to initialize AI services: {e}")
        return None, None, None, None


def _load_yolo():
    global _yolo_model, _yolo_load_attempted
    if _yolo_load_attempted:
        return _yolo_model
    _yolo_load_attempted = True

    if not os.path.exists(YOLO_MODEL_PATH):
        logger.info("Fine-tuned YOLO model not found at %s — using heuristic detector", YOLO_MODEL_PATH)
        return None

    try:
        from ultralytics import YOLO

        _yolo_model = YOLO(YOLO_MODEL_PATH)
        logger.info("Loaded fine-tuned YOLO model from %s", YOLO_MODEL_PATH)
        return _yolo_model
    except Exception as exc:
        logger.warning("Failed to load YOLO model: %s — falling back to heuristic", exc)
        return None


def _read_image(file_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(file_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image. Please upload a valid JPG or PNG file.")
    return img


def _is_likely_road_surface(img: np.ndarray) -> tuple[bool, str]:
    """Reject images that are clearly not road/pavement scenes."""
    h, w = img.shape[:2]
    if h < 120 or w < 120:
        return False, "Image resolution is too low. Please upload a clearer photo of the road."

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Skin-tone / portrait detection (common false uploads)
    skin_mask = cv2.inRange(hsv, np.array([0, 30, 60]), np.array([25, 180, 255]))
    skin_ratio = np.count_nonzero(skin_mask) / (h * w)
    if skin_ratio > 0.25:
        return False, "This image does not appear to show a road surface. Please upload a photo of the damaged road."

    # Very bright sky-only images
    bright_ratio = np.count_nonzero(gray > 220) / (h * w)
    if bright_ratio > 0.75:
        return False, "Image appears to be mostly sky or empty background, not a road defect."

    # Asphalt/concrete: mid-gray tones with reasonable texture
    mid_tone = np.count_nonzero((gray > 40) & (gray < 200)) / (h * w)
    texture = float(gray.std())
    if mid_tone < 0.25 and texture < 15:
        return False, "No road surface detected. Upload a close-up photo of the damaged pavement."

    return True, ""


def _severity_from_score(confidence: float, area_ratio: float) -> str:
    score = confidence * 0.6 + min(area_ratio * 5, 1.0) * 0.4
    if score >= 0.82:
        return "critical"
    if score >= 0.65:
        return "high"
    if score >= 0.45:
        return "medium"
    return "low"


def _detect_with_yolo(img: np.ndarray) -> list[Detection]:
    model = _load_yolo()
    if model is None:
        return []

    results = model(img, verbose=False)
    detections: list[Detection] = []
    h, w = img.shape[:2]

    for result in results:
        if result.boxes is None:
            continue
        for box in result.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            label = result.names.get(cls_id, "unknown").lower().replace(" ", "_")

            if label not in VALID_DAMAGE_TYPES:
                continue

            x1, y1, x2, y2 = box.xyxy[0].tolist()
            area_ratio = ((x2 - x1) * (y2 - y1)) / (w * h)
            severity = _severity_from_score(conf, area_ratio)

            detections.append(
                Detection(
                    damage_type=label,
                    confidence=round(conf, 3),
                    severity=severity,
                    explanation=f"Fine-tuned model detected {label.replace('_', ' ')} with {conf * 100:.0f}% confidence.",
                    bounding_box={
                        "x": round(x1 / w, 4),
                        "y": round(y1 / h, 4),
                        "width": round((x2 - x1) / w, 4),
                        "height": round((y2 - y1) / h, 4),
                    },
                )
            )

    return sorted(detections, key=lambda d: d.confidence, reverse=True)


def _detect_with_heuristics(img: np.ndarray) -> list[Detection]:
    """OpenCV-based fallback when fine-tuned weights are not available."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    total = h * w
    detections: list[Detection] = []

    # Pothole: dark blob regions
    _, dark = cv2.threshold(gray, 70, 255, cv2.THRESH_BINARY_INV)
    dark = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    contours, _ = cv2.findContours(dark, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    pothole_area = 0
    for c in contours:
        area = cv2.contourArea(c)
        if area > total * 0.005:
            pothole_area = max(pothole_area, area)
    if pothole_area > 0:
        ratio = pothole_area / total
        conf = min(0.55 + ratio * 8, 0.94)
        detections.append(
            Detection(
                damage_type="pothole",
                confidence=round(conf, 3),
                severity=_severity_from_score(conf, ratio),
                explanation="Dark depression patterns consistent with pothole damage detected on the road surface.",
            )
        )

    # Cracks: linear edge density
    edges = cv2.Canny(gray, 80, 160)
    edge_ratio = np.count_nonzero(edges) / total
    if edge_ratio > 0.04:
        conf = min(0.5 + edge_ratio * 3, 0.88)
        detections.append(
            Detection(
                damage_type="crack",
                confidence=round(conf, 3),
                severity=_severity_from_score(conf, edge_ratio),
                explanation="Linear fracture patterns detected — possible road surface cracking.",
            )
        )

    # Waterlogging: blue/dark low-saturation pooling
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    water_mask = cv2.inRange(hsv, np.array([90, 30, 20]), np.array([130, 255, 180]))
    water_ratio = np.count_nonzero(water_mask) / total
    if water_ratio > 0.08:
        conf = min(0.52 + water_ratio * 2, 0.91)
        detections.append(
            Detection(
                damage_type="waterlogging",
                confidence=round(conf, 3),
                severity=_severity_from_score(conf, water_ratio),
                explanation="Standing water or pooling detected on the road surface.",
            )
        )

    # Faded markings: low contrast lane-like stripes
    blur = cv2.GaussianBlur(gray, (9, 9), 0)
    contrast = gray.astype(float) - blur.astype(float)
    stripe_score = np.std(contrast) / 128
    if 0.08 < stripe_score < 0.35 and edge_ratio < 0.06:
        conf = min(0.48 + stripe_score, 0.82)
        detections.append(
            Detection(
                damage_type="faded_markings",
                confidence=round(conf, 3),
                severity=_severity_from_score(conf, stripe_score),
                explanation="Lane marking visibility appears below acceptable threshold.",
            )
        )

    # Debris: small high-contrast scattered objects
    _, bright = cv2.threshold(gray, 160, 255, cv2.THRESH_BINARY)
    debris_contours, _ = cv2.findContours(bright, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    debris_count = sum(1 for c in debris_contours if 100 < cv2.contourArea(c) < total * 0.02)
    if debris_count >= 3:
        conf = min(0.5 + debris_count * 0.04, 0.85)
        detections.append(
            Detection(
                damage_type="debris",
                confidence=round(conf, 3),
                severity=_severity_from_score(conf, debris_count / 20),
                explanation="Foreign objects detected on the road surface.",
            )
        )

    return sorted(detections, key=lambda d: d.confidence, reverse=True)


async def analyze_image_bytes(file_bytes: bytes, filename: str = "", complaint_text: str = "", location: str = "") -> AnalysisResult:
    """Run full pipeline using production AI services with fallback to heuristics."""
    if not file_bytes:
        return AnalysisResult(
            accepted=False,
            is_road_damage=False,
            rejection_reason="Empty file uploaded.",
        )

    # Only images supported for now
    lower = filename.lower()
    if lower.endswith((".mp4", ".mov", ".avi", ".webm")):
        return AnalysisResult(
            accepted=False,
            is_road_damage=False,
            rejection_reason="Video analysis is not supported yet. Please upload a photo of the road damage.",
        )

    # Try to use new AI services with Gemini for severity detection
    vision_service, llm_service, embedding_service, gemini_service = _get_ai_services()
    
    if gemini_service and gemini_service._is_available():
        # Use Gemini API for severity detection (as requested)
        return await _analyze_with_gemini(
            file_bytes, filename, complaint_text, location,
            gemini_service, vision_service, llm_service, embedding_service
        )
    
    if vision_service and llm_service:
        return await _analyze_with_ai_services(
            file_bytes, filename, complaint_text, location,
            vision_service, llm_service, embedding_service
        )
    
    # Fallback to original heuristic method
    return _analyze_with_heuristics(file_bytes, filename, complaint_text, location)


async def _analyze_with_gemini(
    file_bytes: bytes,
    filename: str,
    complaint_text: str,
    location: str,
    gemini_service,
    vision_service,
    llm_service,
    embedding_service
) -> AnalysisResult:
    """Analyze image using Gemini API for severity detection (70% threshold logic)."""
    try:
        # Step 1: Use Gemini API for severity analysis
        gemini_result = await gemini_service.analyze_image_for_severity(
            file_bytes, complaint_text
        )
        
        if not gemini_result.is_road_damage:
            return AnalysisResult(
                accepted=False,
                is_road_damage=False,
                rejection_reason="Gemini API determined this is not road damage. Please upload a photo showing actual road defects.",
                model_used="gemini_api",
            )
        
        # Step 2: Use Gemini's severity level directly
        severity_percentage = gemini_result.severity_percentage
        severity_level = gemini_result.severity_level  # critical, high, medium, low
        priority = gemini_result.suggested_priority  # critical, high, medium, low
        
        # Step 3: Create detection result with Gemini analysis
        detection = Detection(
            damage_type=gemini_result.damage_type,
            confidence=gemini_result.confidence_score,  # Use confidence score from Gemini
            severity=severity_level,
            explanation=gemini_result.explanation,
        )
        
        # Step 4: Additional protocol compliance check (if LLM available)
        protocol_followed = True
        protocol_reason = ""
        if llm_service:
            try:
                protocol_result = await llm_service.check_protocol_compliance(
                    complaint_text, gemini_result.damage_type, location
                )
                protocol_followed = protocol_result.follows_protocol
                protocol_reason = protocol_result.explanation
            except Exception as e:
                logger.warning(f"Protocol check failed: {e}")
        
        # Step 5: Department recommendation
        suggested_department = ""
        if llm_service:
            try:
                department_result = await llm_service.recommend_department(
                    gemini_result.damage_type, severity_level, complaint_text, location
                )
                suggested_department = department_result.department
            except Exception as e:
                logger.warning(f"Department recommendation failed: {e}")
        else:
            suggested_department = _suggest_department(gemini_result.damage_type, severity_level)
        
        # Step 6: Response time recommendation based on priority
        response_time_map = {
            "critical": "Within 4 hours",
            "high": "Within 24 hours",
            "medium": "Within 3 business days",
            "low": "Within 7 business days",
        }
        recommended_response_time = response_time_map.get(priority, "Within 3-5 business days")
        
        # Step 7: Duplicate check (if embedding service available)
        duplicate_result = None
        if embedding_service and complaint_text:
            try:
                duplicate_result = await embedding_service.check_duplicate(
                    complaint_text, gemini_result.damage_type, location
                )
            except Exception as e:
                logger.warning(f"Duplicate check failed: {e}")
        
        # Generate explanation with severity percentage
        explanation = (
            f"Gemini AI Analysis: {gemini_result.damage_type.replace('_', ' ')} detected with "
            f"{severity_percentage:.0f}% severity. "
            f"Priority: {priority.upper()}. "
            f"Severity Level: {severity_level}. "
            f"Confidence: {gemini_result.confidence_score * 100:.0f}%. "
            f"Recommended Action: {gemini_result.recommended_action}. "
            f"{gemini_result.explanation}"
        )
        
        return AnalysisResult(
            accepted=True,
            is_road_damage=True,
            detections=[detection],
            explanation=explanation,
            model_used="gemini_api",
            protocol_followed=protocol_followed,
            protocol_reason=protocol_reason,
            suggested_department=suggested_department,
            recommended_response_time=recommended_response_time,
            duplicate_check={
                "is_duplicate": duplicate_result.is_duplicate if duplicate_result else False,
                "similarity_score": duplicate_result.similarity_score if duplicate_result else 0.0,
                "existing_id": duplicate_result.existing_report_id if duplicate_result else None
            } if duplicate_result else None
        )
        
    except Exception as e:
        logger.error(f"Gemini analysis failed: {e}")
        # Fallback to regular AI services or heuristics
        if vision_service and llm_service:
            return await _analyze_with_ai_services(
                file_bytes, filename, complaint_text, location,
                vision_service, llm_service, embedding_service
            )
        return _analyze_with_heuristics(file_bytes, filename, complaint_text, location)


async def _analyze_with_ai_services(
    file_bytes: bytes,
    filename: str,
    complaint_text: str,
    location: str,
    vision_service,
    llm_service,
    embedding_service
) -> AnalysisResult:
    """Analyze image using production AI services."""
    try:
        # Step 1: Vision analysis
        vision_result = vision_service.analyze_image(file_bytes, filename)
        
        if not vision_result.accepted:
            return AnalysisResult(
                accepted=False,
                is_road_damage=False,
                rejection_reason=vision_result.rejection_reason,
                model_used=vision_result.model_used,
            )
        
        # Convert vision detections to detector format
        detections = []
        for vd in vision_result.detections:
            severity = await _get_severity_from_llm(
                llm_service, complaint_text, vd.damage_type, 
                vd.area_meters, vd.confidence, location
            )
            
            detections.append(Detection(
                damage_type=vd.damage_type,
                confidence=vd.confidence,
                severity=severity,
                explanation=vd.explanation,
                bounding_box={"x1": vd.bounding_box[0], "y1": vd.bounding_box[1], 
                           "x2": vd.bounding_box[2], "y2": vd.bounding_box[3]} if vd.bounding_box else None
            ))
        
        if not detections:
            return AnalysisResult(
                accepted=False,
                is_road_damage=False,
                rejection_reason="No road damage detected",
                model_used=vision_result.model_used,
            )
        
        best = detections[0]
        
        # Step 2: Protocol compliance check with LLM
        protocol_result = await llm_service.check_protocol_compliance(
            complaint_text, best.damage_type, location
        )
        
        # Step 3: Department recommendation with LLM
        department_result = await llm_service.recommend_department(
            best.damage_type, best.severity, complaint_text, location
        )
        
        # Step 4: Repair estimate with LLM
        repair_estimate = await llm_service.estimate_repair(
            best.severity, best.damage_type, 
            vision_result.detections[0].area_meters, complaint_text
        )
        
        # Step 5: Duplicate check with embeddings
        duplicate_result = None
        if embedding_service and complaint_text:
            duplicate_result = await embedding_service.check_duplicate(
                complaint_text, best.damage_type, location
            )
        
        # Generate explanation
        explanation = (
            f"Road damage confirmed: {best.damage_type.replace('_', ' ')} detected with "
            f"{best.confidence * 100:.0f}% confidence. "
            f"Severity assessed as {best.severity}. "
            f"Report will be prioritized for inspector review."
        )
        
        return AnalysisResult(
            accepted=True,
            is_road_damage=True,
            detections=detections[:3],
            explanation=explanation,
            model_used=vision_result.model_used,
            protocol_followed=protocol_result.follows_protocol,
            protocol_reason=protocol_result.explanation,
            suggested_department=department_result.department,
            recommended_response_time=repair_estimate.response_time,
            duplicate_check={
                "is_duplicate": duplicate_result.is_duplicate if duplicate_result else False,
                "similarity_score": duplicate_result.similarity_score if duplicate_result else 0.0,
                "existing_id": duplicate_result.existing_report_id if duplicate_result else None
            } if duplicate_result else None
        )
        
    except Exception as e:
        logger.error(f"AI service analysis failed: {e}")
        # Fallback to heuristics
        return _analyze_with_heuristics(file_bytes, filename, complaint_text, location)


async def _get_severity_from_llm(
    llm_service,
    complaint_text: str,
    damage_type: str,
    damage_size: Optional[float],
    confidence: float,
    location: str
) -> str:
    """Get severity classification from LLM."""
    try:
        severity_result = await llm_service.classify_severity(
            complaint_text, damage_type, damage_size, confidence, location
        )
        return severity_result.severity
    except Exception as e:
        logger.warning(f"LLM severity classification failed: {e}")
        # Fallback to confidence-based
        if confidence >= 0.82:
            return "critical"
        elif confidence >= 0.65:
            return "high"
        elif confidence >= 0.45:
            return "medium"
        else:
            return "low"


def _analyze_with_heuristics(
    file_bytes: bytes,
    filename: str,
    complaint_text: str,
    location: str
) -> AnalysisResult:
    """Analyze image using heuristic methods (fallback)."""
    try:
        img = _read_image(file_bytes)
    except ValueError as exc:
        return AnalysisResult(accepted=False, is_road_damage=False, rejection_reason=str(exc))

    is_road, road_reason = _is_likely_road_surface(img)
    if not is_road:
        return AnalysisResult(
            accepted=False,
            is_road_damage=False,
            rejection_reason=road_reason,
            model_used="validation",
        )

    yolo_detections = _detect_with_yolo(img)
    if yolo_detections:
        model_used = "yolo_finetuned"
        detections = yolo_detections
    else:
        model_used = "heuristic"
        detections = _detect_with_heuristics(img)

    if not detections:
        return AnalysisResult(
            accepted=False,
            is_road_damage=False,
            rejection_reason=(
                "No road damage detected in this image. "
                "Please upload a clear photo showing a pothole, crack, waterlogging, faded markings, or debris."
            ),
            model_used=model_used,
        )

    best = detections[0]
    if best.confidence < AI_REJECTION_THRESHOLD:
        return AnalysisResult(
            accepted=False,
            is_road_damage=False,
            rejection_reason=(
                f"Damage confidence too low ({best.confidence * 100:.0f}%). "
                "Please retake the photo closer to the defect with better lighting."
            ),
            detections=detections,
            model_used=model_used,
        )

    # Protocol compliance check (fallback)
    protocol_followed, protocol_reason = _check_protocol_compliance(complaint_text, best.damage_type)
    
    # Suggest department based on damage type (fallback)
    suggested_department = _suggest_department(best.damage_type, best.severity)
    
    # Recommend response time based on severity (fallback)
    recommended_response_time = _recommend_response_time(best.severity)

    primary = best.damage_type.replace("_", " ")
    explanation = (
        f"Road damage confirmed: {primary} detected with {best.confidence * 100:.0f}% confidence. "
        f"Severity assessed as {best.severity}. "
        f"Report will be prioritized for inspector review."
    )

    return AnalysisResult(
        accepted=True,
        is_road_damage=True,
        detections=detections[:3],
        explanation=explanation,
        model_used=model_used,
        protocol_followed=protocol_followed,
        protocol_reason=protocol_reason,
        suggested_department=suggested_department,
        recommended_response_time=recommended_response_time,
    )


def _check_protocol_compliance(complaint_text: str, damage_type: str) -> tuple[bool, str]:
    """Check if complaint follows official reporting protocol."""
    if not complaint_text or len(complaint_text.strip()) < 10:
        return False, "Complaint description is too brief. Please provide more details about the damage (size, location context, safety impact)."
    
    text_lower = complaint_text.lower()
    
    # Check for required elements based on damage type
    required_keywords = {
        "pothole": ["size", "depth", "location"],
        "crack": ["length", "width", "pattern"],
        "waterlogging": ["drainage", "depth", "area"],
        "faded_markings": ["visibility", "lane", "markings"],
        "debris": ["type", "quantity", "hazard"],
    }
    
    keywords = required_keywords.get(damage_type, ["size", "location", "hazard"])
    found_keywords = [kw for kw in keywords if kw in text_lower]
    
    if len(found_keywords) >= 2:
        return True, "Complaint follows protocol with sufficient detail."
    
    return False, f"Complaint lacks required details. Please mention: {', '.join(keywords)}."


def _suggest_department(damage_type: str, severity: str) -> str:
    """Suggest responsible department based on damage type and severity."""
    department_mapping = {
        "pothole": "Road Maintenance Department",
        "crack": "Road Maintenance Department",
        "waterlogging": "Drainage & Sewer Department",
        "faded_markings": "Traffic Engineering Department",
        "debris": "Sanitation & Cleaning Department",
    }
    
    base_dept = department_mapping.get(damage_type, "Road Maintenance Department")
    
    if severity == "critical":
        return f"{base_dept} (Emergency Response)"
    elif severity == "high":
        return f"{base_dept} (Priority Queue)"
    
    return base_dept


def _recommend_response_time(severity: str) -> str:
    """Recommend response time based on severity."""
    response_times = {
        "critical": "Within 4 hours",
        "high": "Within 24 hours",
        "medium": "Within 3 business days",
        "low": "Within 7 business days",
    }
    return response_times.get(severity, "Within 7 business days")


def detection_to_dict(d: Detection) -> dict:
    out = {
        "damageType": d.damage_type,
        "confidence": d.confidence,
        "severity": d.severity,
        "explanation": d.explanation,
    }
    if d.bounding_box:
        out["boundingBox"] = d.bounding_box
    return out
