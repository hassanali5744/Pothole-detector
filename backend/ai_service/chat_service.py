"""
Chat Service
AI chat assistant for inspectors with function calling capabilities.
"""

import json
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass
from enum import Enum

from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.schema import HumanMessage, SystemMessage, AIMessage
from langchain.tools import tool
from langchain_core.utils.function_calling import convert_to_openai_function

from config import LLM_PROVIDER, LLM_MODEL, OPENAI_API_KEY, ANTHROPIC_API_KEY


class ChatProvider(Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"


@dataclass
class ChatMessage:
    role: str  # user, assistant, system
    content: str
    tool_calls: Optional[List[Dict]] = None


@dataclass
class ChatResponse:
    message: str
    tool_calls: Optional[List[Dict]] = None
    tool_results: Optional[Dict] = None
    requires_action: bool = False


class ChatService:
    """AI chat assistant for inspectors with function calling."""
    
    def __init__(self, db_client=None):
        self.provider = ChatProvider(LLM_PROVIDER)
        self.model = LLM_MODEL
        self.db_client = db_client
        self._initialize_client()
        self._register_tools()
    
    def _initialize_client(self):
        """Initialize the chat client."""
        if self.provider == ChatProvider.OPENAI:
            if not OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY not configured")
            self.client = ChatOpenAI(model=self.model, temperature=0.7)
        elif self.provider == ChatProvider.ANTHROPIC:
            if not ANTHROPIC_API_KEY:
                raise ValueError("ANTHROPIC_API_KEY not configured")
            self.client = ChatAnthropic(model=self.model, temperature=0.7)
        else:
            raise ValueError(f"Unknown chat provider: {self.provider}")
    
    def _register_tools(self):
        """Register available tools for function calling."""
        self.tools = [
            self._get_critical_complaints_tool(),
            self._get_pending_reports_tool(),
            self._get_department_workload_tool(),
            self._get_duplicate_complaints_tool(),
            self._summarize_reports_tool(),
            self._get_report_by_id_tool(),
        ]
    
    def _get_critical_complaints_tool(self):
        """Tool to get critical complaints."""
        @tool
        async def get_critical_complaints(days: int = 1) -> str:
            """Get critical complaints from the last N days.
            
            Args:
                days: Number of days to look back (default: 1)
            """
            if self.db_client is None:
                return "Database not available"
            
            try:
                from datetime import datetime, timedelta
                cutoff_date = datetime.utcnow() - timedelta(days=days)
                
                reports = await self.db_client.reports.find({
                    "severity": "critical",
                    "createdAt": {"$gte": cutoff_date.isoformat()}
                }).to_list(length=50)
                
                if not reports:
                    return f"No critical complaints found in the last {days} days."
                
                result = f"Found {len(reports)} critical complaints in the last {days} days:\n"
                for report in reports[:10]:
                    result += f"- {report.get('damageType')} at {report.get('location', {}).get('address', 'Unknown')} ({report.get('createdAt')})\n"
                
                if len(reports) > 10:
                    result += f"... and {len(reports) - 10} more"
                
                return result
            except Exception as e:
                return f"Error fetching critical complaints: {str(e)}"
        
        return get_critical_complaints
    
    def _get_pending_reports_tool(self):
        """Tool to get pending reports."""
        @tool
        async def get_pending_reports(limit: int = 10) -> str:
            """Get pending reports awaiting inspector review.
            
            Args:
                limit: Maximum number of reports to return (default: 10)
            """
            if self.db_client is None:
                return "Database not available"
            
            try:
                reports = await self.db_client.reports.find({
                    "status": "reported"
                }).sort("createdAt", -1).to_list(length=limit)
                
                if not reports:
                    return "No pending reports found."
                
                result = f"Found {len(reports)} pending reports:\n"
                for report in reports:
                    result += f"- {report.get('damageType')} at {report.get('location', {}).get('address', 'Unknown')} (Severity: {report.get('severity')})\n"
                
                return result
            except Exception as e:
                return f"Error fetching pending reports: {str(e)}"
        
        return get_pending_reports
    
    def _get_department_workload_tool(self):
        """Tool to get department workload."""
        @tool
        async def get_department_workload() -> str:
            """Get current workload by suggested department."""
            if self.db_client is None:
                return "Database not available"
            
            try:
                pipeline = [
                    {"$match": {"status": {"$in": ["reported", "verified", "assigned"]}}},
                    {"$group": {
                        "_id": "$suggestedDepartment",
                        "count": {"$sum": 1},
                        "critical_count": {
                            "$sum": {"$cond": [{"$eq": ["$severity", "critical"]}, 1, 0]}
                        }
                    }},
                    {"$sort": {"count": -1}}
                ]
                
                results = await self.db_client.reports.aggregate(pipeline).to_list(length=20)
                
                if not results:
                    return "No workload data available."
                
                result = "Department workload:\n"
                for dept in results:
                    dept_name = dept.get("_id", "Unknown")
                    count = dept.get("count", 0)
                    critical = dept.get("critical_count", 0)
                    result += f"- {dept_name}: {count} reports ({critical} critical)\n"
                
                return result
            except Exception as e:
                return f"Error fetching department workload: {str(e)}"
        
        return get_department_workload
    
    def _get_duplicate_complaints_tool(self):
        """Tool to find duplicate complaints."""
        @tool
        async def find_duplicate_complaints(similarity_threshold: float = 0.85) -> str:
            """Find potential duplicate complaints based on similarity.
            
            Args:
                similarity_threshold: Minimum similarity to consider as duplicate (default: 0.85)
            """
            # This would integrate with the embedding service
            # For now, return a placeholder
            return "Duplicate detection requires embedding service integration. This feature is available when the embedding service is properly configured."
        
        return find_duplicate_complaints
    
    def _summarize_reports_tool(self):
        """Tool to summarize reports."""
        @tool
        async def summarize_reports(status: str = "all", days: int = 7) -> str:
            """Get a summary of reports by status and time period.
            
            Args:
                status: Filter by status (default: all)
                days: Number of days to look back (default: 7)
            """
            if self.db_client is None:
                return "Database not available"
            
            try:
                from datetime import datetime, timedelta
                cutoff_date = datetime.utcnow() - timedelta(days=days)
                
                query = {"createdAt": {"$gte": cutoff_date.isoformat()}}
                if status != "all":
                    query["status"] = status
                
                reports = await self.db_client.reports.find(query).to_list(length=100)
                
                if not reports:
                    return f"No reports found in the last {days} days."
                
                # Calculate summary statistics
                total = len(reports)
                severity_counts = {}
                damage_type_counts = {}
                status_counts = {}
                
                for report in reports:
                    severity = report.get("severity", "unknown")
                    damage_type = report.get("damageType", "unknown")
                    status_val = report.get("status", "unknown")
                    
                    severity_counts[severity] = severity_counts.get(severity, 0) + 1
                    damage_type_counts[damage_type] = damage_type_counts.get(damage_type, 0) + 1
                    status_counts[status_val] = status_counts.get(status_val, 0) + 1
                
                result = f"Report summary for last {days} days:\n"
                result += f"Total reports: {total}\n\n"
                result += "By severity:\n"
                for sev, count in sorted(severity_counts.items(), key=lambda x: x[1], reverse=True):
                    result += f"  {sev}: {count}\n"
                result += "\nBy damage type:\n"
                for dtype, count in sorted(damage_type_counts.items(), key=lambda x: x[1], reverse=True):
                    result += f"  {dtype}: {count}\n"
                result += "\nBy status:\n"
                for st, count in sorted(status_counts.items(), key=lambda x: x[1], reverse=True):
                    result += f"  {st}: {count}\n"
                
                return result
            except Exception as e:
                return f"Error summarizing reports: {str(e)}"
        
        return summarize_reports
    
    def _get_report_by_id_tool(self):
        """Tool to get a specific report by ID."""
        @tool
        async def get_report_by_id(report_id: str) -> str:
            """Get details of a specific report by ID.
            
            Args:
                report_id: The ID of the report to fetch
            """
            if self.db_client is None:
                return "Database not available"
            
            try:
                from bson.objectid import ObjectId
                report = await self.db_client.reports.find_one({"_id": ObjectId(report_id)})
                
                if not report:
                    return f"Report with ID {report_id} not found."
                
                result = f"Report Details:\n"
                result += f"ID: {report_id}\n"
                result += f"Damage Type: {report.get('damageType')}\n"
                result += f"Severity: {report.get('severity')}\n"
                result += f"Status: {report.get('status')}\n"
                result += f"Location: {report.get('location', {}).get('address', 'Unknown')}\n"
                result += f"Created: {report.get('createdAt')}\n"
                result += f"AI Confidence: {report.get('aiConfidence', 0):.2%}\n"
                
                if report.get('complaintText'):
                    result += f"Complaint: {report.get('complaintText')}\n"
                
                return result
            except Exception as e:
                return f"Error fetching report: {str(e)}"
        
        return get_report_by_id
    
    async def chat(
        self,
        message: str,
        conversation_history: Optional[List[ChatMessage]] = None
    ) -> ChatResponse:
        """
        Process a chat message from an inspector.
        
        Args:
            message: User's message
            conversation_history: Previous conversation messages
        
        Returns:
            ChatResponse with assistant's response
        """
        system_prompt = """You are an AI assistant for road damage inspectors. 
You help inspectors manage and analyze road damage reports efficiently.

Available tools:
- get_critical_complaints: Get critical complaints from recent days
- get_pending_reports: Get reports awaiting review
- get_department_workload: Check workload by department
- find_duplicate_complaints: Find potential duplicate reports
- summarize_reports: Get summary of reports by status and time
- get_report_by_id: Get details of a specific report

Use these tools when relevant to provide accurate, data-driven answers.
Be concise and helpful. Focus on actionable insights for inspectors."""

        # Build message history
        messages = [SystemMessage(content=system_prompt)]
        
        if conversation_history:
            for msg in conversation_history:
                if msg.role == "user":
                    messages.append(HumanMessage(content=msg.content))
                elif msg.role == "assistant":
                    messages.append(AIMessage(content=msg.content))
        
        # Add current message
        messages.append(HumanMessage(content=message))
        
        try:
            # For now, use simple chat without tool calling
            # Full tool calling implementation would require more complex setup
            response = await self.client.ainvoke(messages)
            
            return ChatResponse(
                message=response.content,
                tool_calls=None,
                tool_results=None,
                requires_action=False
            )
        except Exception as e:
            return ChatResponse(
                message=f"I apologize, but I encountered an error: {str(e)}",
                tool_calls=None,
                tool_results=None,
                requires_action=False
            )
    
    async def chat_with_tools(
        self,
        message: str,
        conversation_history: Optional[List[ChatMessage]] = None
    ) -> ChatResponse:
        """
        Process a chat message with tool calling enabled.
        
        Args:
            message: User's message
            conversation_history: Previous conversation messages
        
        Returns:
            ChatResponse with assistant's response and tool results
        """
        system_prompt = """You are an AI assistant for road damage inspectors. 
You help inspectors manage and analyze road damage reports efficiently.

When you need information to answer a question, use the available tools.
After getting tool results, provide a clear, helpful response to the inspector."""

        # Build message history
        messages = [SystemMessage(content=system_prompt)]
        
        if conversation_history:
            for msg in conversation_history:
                if msg.role == "user":
                    messages.append(HumanMessage(content=msg.content))
                elif msg.role == "assistant":
                    messages.append(AIMessage(content=msg.content))
        
        # Add current message
        messages.append(HumanMessage(content=message))
        
        try:
            # This would implement full tool calling
            # For now, use simple implementation
            response = await self.client.ainvoke(messages)
            
            return ChatResponse(
                message=response.content,
                tool_calls=None,
                tool_results=None,
                requires_action=False
            )
        except Exception as e:
            return ChatResponse(
                message=f"I apologize, but I encountered an error: {str(e)}",
                tool_calls=None,
                tool_results=None,
                requires_action=False
            )
