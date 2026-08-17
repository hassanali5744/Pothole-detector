"""
Gemini Service
Handles Google Gemini API integration via OpenRouter for image analysis and severity detection.
"""

import os
import base64
from typing import Dict, Optional, Any
from dataclasses import dataclass
import httpx
from config import OPENROUTER_API_KEY


@dataclass
class GeminiAnalysisResult:
    """Result from Gemini API image analysis."""
    is_road_damage: bool
    severity_percentage: float
    damage_type: str
    severity_level: str  # "critical", "high", "medium", "low"
    explanation: str
    suggested_priority: str  # "critical", "high", "medium", "low"
    confidence_score: float  # 0-1
    recommended_action: str
    raw_response: Optional[Dict[str, Any]] = None


class GeminiService:
    """Service for Gemini API-based image analysis via OpenRouter."""
    
    def __init__(self):
        self.api_key = OPENROUTER_API_KEY
        # Using OpenRouter API endpoint with Gemini Flash 2.5
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "google/gemini-flash-2.5"  # Gemini Flash 2.5 via OpenRouter
        
    def _is_available(self) -> bool:
        """Check if Gemini API is configured."""
        return bool(self.api_key and self.api_key != "")
    
    def _encode_image(self, image_bytes: bytes) -> str:
        """Encode image bytes to base64."""
        return base64.b64encode(image_bytes).decode('utf-8')
    
    async def analyze_image_for_severity(
        self,
        image_bytes: bytes,
        complaint_text: str = ""
    ) -> GeminiAnalysisResult:
        """
        Analyze image using Gemini API via OpenRouter to determine severity percentage.
        
        Args:
            image_bytes: Image data as bytes
            complaint_text: Optional complaint description
            
        Returns:
            GeminiAnalysisResult with severity assessment
        """
        if not self._is_available():
            # Fallback to default response if API not configured
            return GeminiAnalysisResult(
                is_road_damage=True,
                severity_percentage=50.0,
                damage_type="pothole",
                severity_level="low",
                explanation="Gemini API not configured. Using default severity assessment.",
                suggested_priority="low"
            )
        
        try:
            # Prepare the prompt
            prompt = f"""Analyze this road damage image and provide:
1. Is this road damage? (yes/no)
2. What type of damage is it? (pothole, crack, waterlogging, debris, faded_markings)
3. Rate the severity on a scale of 0-100% based on:
   - Approximate size (small, medium, large)
   - Depth (shallow, deep)
   - Location on the road (edge, center, intersection)
   - Obstruction to traffic (minimal, moderate, severe)
   - Potential danger to vehicles and pedestrians
   - Overall road-safety risk
4. Assign a severity level: critical (90-100%), high (70-89%), medium (50-69%), low (0-49%)
5. Provide a confidence score (0-1) for your assessment
6. Recommend action: "Immediate repair", "Repair within 24-48 hours", "Repair within 3-5 days", "Schedule routine maintenance"

{complaint_text if complaint_text else ''}

IMPORTANT: Do not invent information that cannot be determined from the image. If image quality or viewing angle is insufficient, indicate uncertainty.

Respond in this exact JSON format:
{{
    "is_road_damage": true/false,
    "damage_type": "pothole/crack/waterlogging/debris/faded_markings",
    "severity_percentage": 0-100,
    "severity_level": "critical/high/medium/low",
    "confidence_score": 0.0-1.0,
    "explanation": "brief explanation of your assessment",
    "recommended_action": "action recommendation"
}}"""
            
            # Prepare the request for OpenRouter (OpenAI-compatible format)
            base64_image = self._encode_image(image_bytes)
            
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                "temperature": 0.1,
                "max_tokens": 4096
            }
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8000",  # Required by OpenRouter
                "X-Title": "RoadVision AI"  # Required by OpenRouter
            }
            
            # Make API request
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.api_url, json=payload, headers=headers)
                response.raise_for_status()
                result = response.json()
            
            # Parse the response
            if "choices" in result and len(result["choices"]) > 0:
                content = result["choices"][0]["message"]["content"]
                
                # Extract JSON from the response
                import json
                import re
                
                # Try to extract JSON from the text response
                json_match = re.search(r'\{[^{}]*\}', content)
                if json_match:
                    analysis_data = json.loads(json_match.group())
                else:
                    # Fallback parsing
                    analysis_data = self._parse_gemini_response(content)
                
                # Determine severity level and priority
                severity_percentage = analysis_data.get("severity_percentage", 50)
                severity_level = analysis_data.get("severity_level", "medium")
                suggested_priority = severity_level  # Use the same level as priority
                confidence_score = analysis_data.get("confidence_score", 0.7)
                recommended_action = analysis_data.get("recommended_action", "Repair within 3-5 days")
                
                return GeminiAnalysisResult(
                    is_road_damage=analysis_data.get("is_road_damage", True),
                    severity_percentage=severity_percentage,
                    damage_type=analysis_data.get("damage_type", "pothole"),
                    severity_level=severity_level,
                    suggested_priority=suggested_priority,
                    confidence_score=confidence_score,
                    recommended_action=recommended_action,
                    explanation=analysis_data.get("explanation", content),
                    raw_response=result
                )
            else:
                raise Exception("No valid response from Gemini API via OpenRouter")
                
        except httpx.TimeoutException:
            print("Gemini API timeout - using fallback")
            return GeminiAnalysisResult(
                is_road_damage=True,
                severity_percentage=50.0,
                damage_type="pothole",
                severity_level="medium",
                confidence_score=0.5,
                recommended_action="Repair within 3-5 days",
                explanation="Gemini API timeout. Using default severity assessment.",
                suggested_priority="medium"
            )
        except httpx.HTTPStatusError as e:
            print(f"Gemini API HTTP error: {e.response.status_code}")
            if e.response.status_code == 429:
                return GeminiAnalysisResult(
                    is_road_damage=True,
                    severity_percentage=50.0,
                    damage_type="pothole",
                    severity_level="medium",
                    confidence_score=0.5,
                    recommended_action="Repair within 3-5 days",
                    explanation="Gemini API rate limit exceeded. Using default severity assessment.",
                    suggested_priority="medium"
                )
            return GeminiAnalysisResult(
                is_road_damage=True,
                severity_percentage=50.0,
                damage_type="pothole",
                severity_level="medium",
                confidence_score=0.5,
                recommended_action="Repair within 3-5 days",
                explanation=f"Gemini API error: {str(e)}. Using default severity assessment.",
                suggested_priority="medium"
            )
        except Exception as e:
            print(f"Gemini API error via OpenRouter: {e}")
            # Fallback to default response on error
            return GeminiAnalysisResult(
                is_road_damage=True,
                severity_percentage=50.0,
                damage_type="pothole",
                severity_level="medium",
                confidence_score=0.5,
                recommended_action="Repair within 3-5 days",
                explanation=f"Gemini API error: {str(e)}. Using default severity assessment.",
                suggested_priority="medium"
            )
    
    def _parse_gemini_response(self, response_text: str) -> Dict[str, Any]:
        """Fallback parser for Gemini response if JSON extraction fails."""
        # Simple keyword-based parsing as fallback
        is_road_damage = "yes" in response_text.lower() or "road damage" in response_text.lower()
        
        damage_type = "pothole"  # default
        for dtype in ["pothole", "crack", "waterlogging", "debris", "faded_markings"]:
            if dtype in response_text.lower():
                damage_type = dtype
                break
        
        # Try to extract percentage
        import re
        percentage_match = re.search(r'(\d+)%', response_text)
        severity_percentage = int(percentage_match.group(1)) if percentage_match else 50
        
        return {
            "is_road_damage": is_road_damage,
            "damage_type": damage_type,
            "severity_percentage": severity_percentage,
            "explanation": response_text
        }