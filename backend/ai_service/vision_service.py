"""
Vision Service
Handles computer vision tasks using pre-trained models (YOLOv11, Florence-2, Grounding DINO).
"""

import os
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
from enum import Enum
import cv2
import numpy as np
from PIL import Image
import torch

from ultralytics import YOLO
from config import VISION_MODEL, VISION_MODEL_PATH, AI_CONFIDENCE_THRESHOLD, AI_REJECTION_THRESHOLD


class VisionModel(Enum):
    YOLOV11 = "yolov11"
    FLORENCE2 = "florence2"
    GROUNDING_DINO = "grounding_dino"


@dataclass
class Detection:
    damage_type: str
    confidence: float
    bounding_box: Optional[List[float]]  # [x1, y1, x2, y2]
    area: float  # in pixels
    area_meters: Optional[float]  # estimated in meters
    explanation: str


@dataclass
class VisionAnalysisResult:
    accepted: bool
    is_road_damage: bool
    detections: List[Detection]
    model_used: str
    rejection_reason: Optional[str] = None


class VisionService:
    """Service for computer vision-based damage detection."""
    
    def __init__(self):
        self.model_type = VisionModel(VISION_MODEL)
        self.model_path = VISION_MODEL_PATH
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load the appropriate vision model."""
        try:
            if self.model_type == VisionModel.YOLOV11:
                self.model = self._load_yolov11()
            elif self.model_type == VisionModel.FLORENCE2:
                self.model = self._load_florence2()
            elif self.model_type == VisionModel.GROUNDING_DINO:
                self.model = self._load_grounding_dino()
            else:
                raise ValueError(f"Unknown vision model: {self.model_type}")
        except Exception as e:
            print(f"Failed to load vision model: {e}")
            self.model = None
    
    def _load_yolov11(self) -> YOLO:
        """Load YOLOv11 model."""
        if os.path.exists(self.model_path):
            return YOLO(self.model_path)
        else:
            # Use pre-trained YOLOv11n for road damage detection
            # In production, you would fine-tune this on road damage dataset
            return YOLO("yolov11n.pt")
    
    def _load_florence2(self):
        """Load Florence-2 model for vision-language tasks."""
        # Florence-2 implementation would go here
        # This requires transformers and specific model loading
        raise NotImplementedError("Florence-2 not yet implemented")
    
    def _load_grounding_dino(self):
        """Load Grounding DINO model for open-vocabulary detection."""
        # Grounding DINO implementation would go here
        raise NotImplementedError("Grounding DINO not yet implemented")
    
    def analyze_image(
        self,
        image_bytes: bytes,
        filename: str = ""
    ) -> VisionAnalysisResult:
        """
        Analyze image for road damage detection.
        
        Args:
            image_bytes: Image data as bytes
            filename: Original filename
        
        Returns:
            VisionAnalysisResult with detections
        """
        if not image_bytes:
            return VisionAnalysisResult(
                accepted=False,
                is_road_damage=False,
                detections=[],
                model_used=str(self.model_type),
                rejection_reason="Empty file uploaded"
            )
        
        # Validate image
        try:
            img = self._read_image(image_bytes)
        except Exception as e:
            return VisionAnalysisResult(
                accepted=False,
                is_road_damage=False,
                detections=[],
                model_used=str(self.model_type),
                rejection_reason=f"Invalid image: {str(e)}"
            )
        
        # Check if image shows road surface
        is_road, road_reason = self._is_likely_road_surface(img)
        if not is_road:
            return VisionAnalysisResult(
                accepted=False,
                is_road_damage=False,
                detections=[],
                model_used=str(self.model_type),
                rejection_reason=road_reason
            )
        
        # Run detection
        detections = self._detect_damage(img)
        
        if not detections:
            return VisionAnalysisResult(
                accepted=False,
                is_road_damage=False,
                detections=[],
                model_used=str(self.model_type),
                rejection_reason="No road damage detected in this image"
            )
        
        # Check confidence threshold
        best_detection = max(detections, key=lambda d: d.confidence)
        if best_detection.confidence < AI_REJECTION_THRESHOLD:
            return VisionAnalysisResult(
                accepted=False,
                is_road_damage=False,
                detections=detections,
                model_used=str(self.model_type),
                rejection_reason=f"Damage confidence too low ({best_detection.confidence * 100:.0f}%)"
            )
        
        return VisionAnalysisResult(
            accepted=True,
            is_road_damage=True,
            detections=detections[:5],  # Top 5 detections
            model_used=str(self.model_type)
        )
    
    def _read_image(self, image_bytes: bytes) -> np.ndarray:
        """Read image from bytes."""
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Could not decode image")
        return img
    
    def _is_likely_road_surface(self, img: np.ndarray) -> tuple[bool, str]:
        """Check if image likely shows a road surface."""
        # Convert to grayscale for analysis
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Check image characteristics typical of road surfaces
        # Roads typically have: moderate brightness, texture, horizontal lines
        
        # Brightness check
        brightness = np.mean(gray)
        if brightness < 30 or brightness > 220:
            return False, "Image brightness not suitable for road surface detection"
        
        # Edge detection for texture
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])
        
        # Roads typically have moderate edge density
        if edge_density < 0.01:
            return False, "Image lacks texture typical of road surfaces"
        if edge_density > 0.3:
            return False, "Image has too much noise, may not be a road surface"
        
        return True, ""
    
    def _detect_damage(self, img: np.ndarray) -> List[Detection]:
        """Detect road damage using the loaded model."""
        if self.model is None:
            # Fallback to heuristic detection
            return self._heuristic_detection(img)
        
        try:
            if self.model_type == VisionModel.YOLOV11:
                return self._yolov11_detection(img)
            else:
                return self._heuristic_detection(img)
        except Exception as e:
            print(f"Detection failed: {e}")
            return self._heuristic_detection(img)
    
    def _yolov11_detection(self, img: np.ndarray) -> List[Detection]:
        """Run YOLOv11 detection."""
        # Run inference
        results = self.model(img, verbose=False)
        
        detections = []
        
        # Map YOLO classes to damage types
        # In production, you would train YOLO on road damage dataset
        # For now, we use a heuristic mapping based on detection characteristics
        class_mapping = {
            0: "pothole",      # Example: pothole class
            1: "crack",       # Example: crack class
            2: "waterlogging", # Example: water class
            3: "debris",      # Example: debris class
        }
        
        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue
            
            for box in boxes:
                confidence = float(box.conf[0])
                if confidence < AI_CONFIDENCE_THRESHOLD:
                    continue
                
                # Get bounding box
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                bbox = [x1, y1, x2, y2]
                
                # Calculate area
                area = (x2 - x1) * (y2 - y1)
                
                # Estimate area in meters (assuming average road camera calibration)
                # This is a rough estimate - in production use proper calibration
                img_height, img_width = img.shape[:2]
                area_meters = (area / (img_width * img_height)) * 10  # Rough estimate
                
                # Get class and map to damage type
                class_id = int(box.cls[0])
                damage_type = class_mapping.get(class_id, "pothole")
                
                # Generate explanation
                explanation = self._generate_detection_explanation(
                    damage_type, confidence, area_meters
                )
                
                detections.append(Detection(
                    damage_type=damage_type,
                    confidence=confidence,
                    bounding_box=bbox,
                    area=area,
                    area_meters=area_meters,
                    explanation=explanation
                ))
        
        # Sort by confidence
        detections.sort(key=lambda d: d.confidence, reverse=True)
        return detections
    
    def _heuristic_detection(self, img: np.ndarray) -> List[Detection]:
        """Fallback heuristic-based damage detection."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Detect dark circular regions (potholes)
        circles = cv2.HoughCircles(
            gray,
            cv2.HOUGH_GRADIENT,
            dp=1,
            minDist=50,
            param1=50,
            param2=30,
            minRadius=10,
            maxRadius=100
        )
        
        detections = []
        
        if circles is not None:
            circles = np.round(circles[0, :]).astype("int")
            for (x, y, r) in circles:
                confidence = min(0.9, 0.5 + (r / 100))
                area = np.pi * r * r
                area_meters = (area / (img.shape[0] * img.shape[1])) * 10
                
                detections.append(Detection(
                    damage_type="pothole",
                    confidence=confidence,
                    bounding_box=[x-r, y-r, x+r, y+r],
                    area=area,
                    area_meters=area_meters,
                    explanation=f"Circular dark region detected, likely pothole with radius ~{r}px"
                ))
        
        # Detect linear features (cracks)
        edges = cv2.Canny(gray, 50, 150)
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=100, minLineLength=50, maxLineGap=10)
        
        if lines is not None and len(lines) > 5:
            confidence = min(0.85, 0.4 + (len(lines) / 20))
            detections.append(Detection(
                damage_type="crack",
                confidence=confidence,
                bounding_box=None,
                area=0,
                area_meters=None,
                explanation=f"Linear features detected ({len(lines)} lines), likely road cracks"
            ))
        
        # Detect waterlogging (dark uniform regions)
        _, thresh = cv2.threshold(gray, 100, 255, cv2.THRESH_BINARY_INV)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 1000:  # Significant dark region
                confidence = min(0.8, 0.4 + (area / 5000))
                area_meters = (area / (img.shape[0] * img.shape[1])) * 10
                
                detections.append(Detection(
                    damage_type="waterlogging",
                    confidence=confidence,
                    bounding_box=None,
                    area=area,
                    area_meters=area_meters,
                    explanation=f"Large dark uniform region detected (area: {area:.0f}px²), likely waterlogging"
                ))
                break  # Add only one waterlogging detection
        
        # Sort by confidence
        detections.sort(key=lambda d: d.confidence, reverse=True)
        return detections
    
    def _generate_detection_explanation(
        self,
        damage_type: str,
        confidence: float,
        area_meters: Optional[float]
    ) -> str:
        """Generate explanation for detection."""
        explanations = {
            "pothole": f"Pothole detected with {confidence * 100:.0f}% confidence. "
                      f"Estimated size: {area_meters:.2f}m² if available.",
            "crack": f"Road crack detected with {confidence * 100:.0f}% confidence. "
                    f"Linear damage pattern identified.",
            "waterlogging": f"Waterlogging detected with {confidence * 100:.0f}% confidence. "
                           f"Drainage issue likely present.",
            "debris": f"Road debris detected with {confidence * 100:.0f}% confidence. "
                     f"Foreign objects on road surface.",
            "faded_markings": f"Faded lane markings detected with {confidence * 100:.0f}% confidence. "
                              f"Visibility issue for traffic."
        }
        return explanations.get(damage_type, f"Damage detected with {confidence * 100:.0f}% confidence")
