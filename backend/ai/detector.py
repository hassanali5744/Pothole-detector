"""
Road damage detection pipeline.

Supports:
1. Fine-tuned YOLO model (backend/models/road_damage.pt) when available
2. OpenCV heuristic fallback for development/demo

Expected YOLO class names:
  pothole, crack, faded_markings, waterlogging, debris
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


_yolo_model = None
_yolo_load_attempted = False


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


def analyze_image_bytes(file_bytes: bytes, filename: str = "") -> AnalysisResult:
    """Run full pipeline: validate → detect → accept/reject."""
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
    )


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
