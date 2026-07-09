"""
LLM Service
Handles all LLM-based AI features using OpenAI, Anthropic, or Google models.
"""

import os
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

import openai
from anthropic import Anthropic
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.schema import HumanMessage, SystemMessage

from config import (
    LLM_PROVIDER,
    LLM_MODEL,
    OPENAI_API_KEY,
    ANTHROPIC_API_KEY,
    GOOGLE_API_KEY,
)


class LLMProvider(Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"


@dataclass
class ProtocolCheckResult:
    follows_protocol: bool
    confidence: float
    missing_info: List[str]
    explanation: str
    suggestions: List[str]


@dataclass
class SeverityClassification:
    severity: str  # critical, high, medium, low
    confidence: float
    reasoning: str
    factors: Dict[str, Any]


@dataclass
class DepartmentRecommendation:
    department: str
    confidence: float
    reasoning: str
    alternatives: List[str]


@dataclass
class RepairEstimate:
    priority: str  # critical, high, medium, low
    response_time: str
    complexity: str  # simple, moderate, complex
    estimated_cost: Optional[str]
    reasoning: str


@dataclass
class InspectorSummary:
    damage_type: str
    severity: str
    protocol_compliance: bool
    suggested_department: str
    recommended_response_time: str
    reasoning: str
    suggested_action: str


class LLMService:
    """Service for LLM-based AI features."""
    
    def __init__(self):
        self.provider = LLMProvider(LLM_PROVIDER)
        self.model = LLM_MODEL
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the appropriate LLM client based on provider."""
        if self.provider == LLMProvider.OPENAI:
            if not OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY not configured")
            openai.api_key = OPENAI_API_KEY
            self.client = ChatOpenAI(model=self.model, temperature=0.3)
        elif self.provider == LLMProvider.ANTHROPIC:
            if not ANTHROPIC_API_KEY:
                raise ValueError("ANTHROPIC_API_KEY not configured")
            self.client = ChatAnthropic(model=self.model, temperature=0.3)
        elif self.provider == LLMProvider.GOOGLE:
            # Google AI implementation would go here
            raise NotImplementedError("Google AI provider not yet implemented")
        else:
            raise ValueError(f"Unknown LLM provider: {self.provider}")
    
    async def check_protocol_compliance(
        self,
        complaint_text: str,
        damage_type: str,
        location: str
    ) -> ProtocolCheckResult:
        """
        Check if complaint follows official reporting protocol using LLM.
        
        Args:
            complaint_text: User's complaint description
            damage_type: Type of damage detected (pothole, crack, etc.)
            location: Location of the damage
        
        Returns:
            ProtocolCheckResult with compliance status and details
        """
        system_prompt = """You are a government compliance officer reviewing road damage complaints. 
Evaluate if the complaint follows official reporting protocol.

Required information for a valid complaint:
- Clear description of the damage (size, extent, characteristics)
- Specific location details (landmark, road name, nearby buildings)
- Safety impact assessment (traffic disruption, hazard level)
- Time context (when observed, how long present)
- Any relevant circumstances (recent construction, weather events)

Respond in JSON format with:
{
    "follows_protocol": boolean,
    "confidence": float (0-1),
    "missing_info": ["list of missing information"],
    "explanation": "detailed explanation of decision",
    "suggestions": ["list of suggestions to improve complaint"]
}"""

        user_prompt = f"""Damage Type: {damage_type}
Location: {location}
Complaint Text: {complaint_text}

Evaluate if this complaint follows official reporting protocol."""

        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ]
            
            response = await self.client.ainvoke(messages)
            result = json.loads(response.content)
            
            return ProtocolCheckResult(
                follows_protocol=result.get("follows_protocol", False),
                confidence=result.get("confidence", 0.0),
                missing_info=result.get("missing_info", []),
                explanation=result.get("explanation", ""),
                suggestions=result.get("suggestions", [])
            )
        except Exception as e:
            # Fallback to basic validation
            return self._fallback_protocol_check(complaint_text, damage_type)
    
    def _fallback_protocol_check(self, complaint_text: str, damage_type: str) -> ProtocolCheckResult:
        """Fallback protocol check if LLM fails."""
        text_lower = complaint_text.lower()
        required_keywords = {
            "pothole": ["size", "depth", "location"],
            "crack": ["length", "width", "pattern"],
            "waterlogging": ["drainage", "depth", "area"],
            "faded_markings": ["visibility", "lane", "markings"],
            "debris": ["type", "quantity", "hazard"],
        }
        
        keywords = required_keywords.get(damage_type, ["size", "location", "hazard"])
        found_keywords = [kw for kw in keywords if kw in text_lower]
        
        follows = len(found_keywords) >= 2 and len(complaint_text) >= 10
        missing = [kw for kw in keywords if kw not in text_lower]
        
        return ProtocolCheckResult(
            follows_protocol=follows,
            confidence=0.7 if follows else 0.5,
            missing_info=missing,
            explanation="Basic keyword-based validation (LLM unavailable)",
            suggestions=[f"Please mention: {', '.join(missing)}"] if missing else []
        )
    
    async def classify_severity(
        self,
        complaint_text: str,
        damage_type: str,
        damage_size: Optional[float] = None,
        detection_confidence: float = 0.0,
        location_context: str = ""
    ) -> SeverityClassification:
        """
        Classify complaint severity using LLM with multiple factors.
        
        Args:
            complaint_text: User's complaint description
            damage_type: Type of damage detected
            damage_size: Estimated size of damage (in meters)
            detection_confidence: AI detection confidence (0-1)
            location_context: Additional location context
        
        Returns:
            SeverityClassification with severity level and reasoning
        """
        system_prompt = """You are a road infrastructure expert assessing damage severity.
Classify the complaint as: critical, high, medium, or low.

Severity Criteria:
- CRITICAL: Immediate safety hazard, major road blockage, risk of accidents, affects emergency routes
- HIGH: Significant damage, safety concern, affects traffic flow, rapid deterioration likely
- MEDIUM: Moderate damage, minor safety concern, manageable traffic impact
- LOW: Minor damage, no immediate safety concern, cosmetic or minor functional issue

Consider:
1. Damage size and extent
2. Safety implications
3. Traffic impact
4. Urgency of repair
5. Detection confidence

Respond in JSON format with:
{
    "severity": "critical|high|medium|low",
    "confidence": float (0-1),
    "reasoning": "detailed explanation of severity assessment",
    "factors": {
        "safety_impact": "description",
        "traffic_impact": "description",
        "urgency": "description",
        "deterioration_risk": "description"
    }
}"""

        user_prompt = f"""Damage Type: {damage_type}
Damage Size: {damage_size}m if available
Detection Confidence: {detection_confidence:.2f}
Location Context: {location_context}
Complaint Text: {complaint_text}

Classify the severity of this road damage."""

        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ]
            
            response = await self.client.ainvoke(messages)
            result = json.loads(response.content)
            
            return SeverityClassification(
                severity=result.get("severity", "medium"),
                confidence=result.get("confidence", 0.0),
                reasoning=result.get("reasoning", ""),
                factors=result.get("factors", {})
            )
        except Exception as e:
            # Fallback to confidence-based classification
            return self._fallback_severity_classification(detection_confidence, damage_size)
    
    def _fallback_severity_classification(
        self,
        confidence: float,
        size: Optional[float]
    ) -> SeverityClassification:
        """Fallback severity classification if LLM fails."""
        score = confidence * 100
        
        if score >= 82 or (size and size > 0.5):
            severity = "critical"
        elif score >= 65 or (size and size > 0.3):
            severity = "high"
        elif score >= 45 or (size and size > 0.1):
            severity = "medium"
        else:
            severity = "low"
        
        return SeverityClassification(
            severity=severity,
            confidence=0.6,
            reasoning="Confidence-based classification (LLM unavailable)",
            factors={}
        )
    
    async def recommend_department(
        self,
        damage_type: str,
        severity: str,
        complaint_text: str,
        location: str
    ) -> DepartmentRecommendation:
        """
        Recommend appropriate government department using LLM.
        
        Args:
            damage_type: Type of damage detected
            severity: Severity level
            complaint_text: User's complaint description
            location: Location of damage
        
        Returns:
            DepartmentRecommendation with department and reasoning
        """
        system_prompt = """You are a municipal government expert assigning road damage to departments.

Available Departments:
- Road Maintenance Department: Potholes, cracks, general road surface damage
- Traffic Engineering Department: Faded markings, signage issues, traffic signals
- Drainage & Sewer Department: Waterlogging, drainage issues, flooding
- Sanitation & Cleaning Department: Debris, waste, cleanliness issues
- Emergency Response Team: Critical safety hazards requiring immediate action
- Urban Planning Department: Infrastructure planning issues
- Public Works Department: General maintenance and repairs

Consider:
1. Primary responsibility for the damage type
2. Severity level (critical may need emergency response)
3. Location context (special zones may have different jurisdiction)
4. Cross-department coordination needs

Respond in JSON format with:
{
    "department": "department name",
    "confidence": float (0-1),
    "reasoning": "explanation of department assignment",
    "alternatives": ["list of alternative departments if applicable"]
}"""

        user_prompt = f"""Damage Type: {damage_type}
Severity: {severity}
Location: {location}
Complaint Text: {complaint_text}

Recommend the appropriate government department."""

        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ]
            
            response = await self.client.ainvoke(messages)
            result = json.loads(response.content)
            
            return DepartmentRecommendation(
                department=result.get("department", "Road Maintenance Department"),
                confidence=result.get("confidence", 0.0),
                reasoning=result.get("reasoning", ""),
                alternatives=result.get("alternatives", [])
            )
        except Exception as e:
            # Fallback to mapping-based recommendation
            return self._fallback_department_recommendation(damage_type, severity)
    
    def _fallback_department_recommendation(
        self,
        damage_type: str,
        severity: str
    ) -> DepartmentRecommendation:
        """Fallback department recommendation if LLM fails."""
        department_mapping = {
            "pothole": "Road Maintenance Department",
            "crack": "Road Maintenance Department",
            "waterlogging": "Drainage & Sewer Department",
            "faded_markings": "Traffic Engineering Department",
            "debris": "Sanitation & Cleaning Department",
        }
        
        base_dept = department_mapping.get(damage_type, "Road Maintenance Department")
        
        if severity == "critical":
            base_dept = "Emergency Response Team"
        elif severity == "high":
            base_dept = f"{base_dept} (Priority Queue)"
        
        return DepartmentRecommendation(
            department=base_dept,
            confidence=0.7,
            reasoning="Mapping-based recommendation (LLM unavailable)",
            alternatives=[]
        )
    
    async def estimate_repair(
        self,
        severity: str,
        damage_type: str,
        damage_size: Optional[float] = None,
        complaint_text: str = ""
    ) -> RepairEstimate:
        """
        Estimate repair priority, response time, and complexity using LLM.
        
        Args:
            severity: Severity level
            damage_type: Type of damage
            damage_size: Estimated damage size
            complaint_text: User's complaint description
        
        Returns:
            RepairEstimate with repair recommendations
        """
        system_prompt = """You are a road maintenance expert estimating repair requirements.

Response Time SLAs:
- Critical: Within 4 hours (emergency response)
- High: Within 24 hours (priority queue)
- Medium: Within 3 business days (scheduled repair)
- Low: Within 7 business days (routine maintenance)

Repair Complexity:
- Simple: Quick fix, minimal equipment, < 2 hours
- Moderate: Standard repair, standard equipment, 2-8 hours
- Complex: Major repair, specialized equipment, > 8 days

Consider:
1. Severity level
2. Damage type and extent
3. Location accessibility
4. Traffic impact
5. Equipment requirements

Respond in JSON format with:
{
    "priority": "critical|high|medium|low",
    "response_time": "specific time frame",
    "complexity": "simple|moderate|complex",
    "estimated_cost": "cost estimate if applicable",
    "reasoning": "explanation of repair estimate"
}"""

        user_prompt = f"""Severity: {severity}
Damage Type: {damage_type}
Damage Size: {damage_size}m if available
Complaint Text: {complaint_text}

Estimate the repair requirements."""

        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ]
            
            response = await self.client.ainvoke(messages)
            result = json.loads(response.content)
            
            return RepairEstimate(
                priority=result.get("priority", severity),
                response_time=result.get("response_time", "Within 7 business days"),
                complexity=result.get("complexity", "moderate"),
                estimated_cost=result.get("estimated_cost"),
                reasoning=result.get("reasoning", "")
            )
        except Exception as e:
            # Fallback to SLA-based estimation
            return self._fallback_repair_estimate(severity)
    
    def _fallback_repair_estimate(self, severity: str) -> RepairEstimate:
        """Fallback repair estimation if LLM fails."""
        response_times = {
            "critical": "Within 4 hours",
            "high": "Within 24 hours",
            "medium": "Within 3 business days",
            "low": "Within 7 business days",
        }
        
        complexities = {
            "critical": "complex",
            "high": "moderate",
            "medium": "moderate",
            "low": "simple",
        }
        
        return RepairEstimate(
            priority=severity,
            response_time=response_times.get(severity, "Within 7 business days"),
            complexity=complexities.get(severity, "moderate"),
            estimated_cost=None,
            reasoning="SLA-based estimation (LLM unavailable)"
        )
    
    async def generate_inspector_summary(
        self,
        complaint_text: str,
        damage_type: str,
        severity: str,
        protocol_result: ProtocolCheckResult,
        department_result: DepartmentRecommendation,
        repair_estimate: RepairEstimate,
        detection_confidence: float
    ) -> InspectorSummary:
        """
        Generate a concise AI summary for inspectors.
        
        Args:
            complaint_text: User's complaint description
            damage_type: Type of damage
            severity: Severity level
            protocol_result: Protocol compliance check result
            department_result: Department recommendation result
            repair_estimate: Repair estimation result
            detection_confidence: AI detection confidence
        
        Returns:
            InspectorSummary with concise summary for inspectors
        """
        system_prompt = """You are an AI assistant generating concise summaries for road inspectors.
Create a clear, actionable summary that helps inspectors quickly understand the situation.

The summary should include:
- Damage type and severity
- Protocol compliance status
- Suggested department
- Recommended response time
- Brief reasoning
- Suggested action for the inspector

Keep it concise (under 200 words) and actionable.

Respond in JSON format with:
{
    "damage_type": "type of damage",
    "severity": "severity level",
    "protocol_compliance": boolean,
    "suggested_department": "department name",
    "recommended_response_time": "time frame",
    "reasoning": "brief explanation (1-2 sentences)",
    "suggested_action": "specific action for inspector"
}"""

        user_prompt = f"""Complaint: {complaint_text}
Damage Type: {damage_type}
Severity: {severity}
Detection Confidence: {detection_confidence:.2f}
Protocol Followed: {protocol_result.follows_protocol}
Suggested Department: {department_result.department}
Response Time: {repair_estimate.response_time}

Generate a concise inspector summary."""

        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ]
            
            response = await self.client.ainvoke(messages)
            result = json.loads(response.content)
            
            return InspectorSummary(
                damage_type=result.get("damage_type", damage_type),
                severity=result.get("severity", severity),
                protocol_compliance=result.get("protocol_compliance", protocol_result.follows_protocol),
                suggested_department=result.get("suggested_department", department_result.department),
                recommended_response_time=result.get("recommended_response_time", repair_estimate.response_time),
                reasoning=result.get("reasoning", ""),
                suggested_action=result.get("suggested_action", "Review and verify")
            )
        except Exception as e:
            # Fallback to basic summary
            return InspectorSummary(
                damage_type=damage_type,
                severity=severity,
                protocol_compliance=protocol_result.follows_protocol,
                suggested_department=department_result.department,
                recommended_response_time=repair_estimate.response_time,
                reasoning=f"AI detection confidence: {detection_confidence:.0%}",
                suggested_action="Review and verify report"
            )
