"""
Conversation Models

Pydantic schemas for analysis requests and responses.
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class Platform(str, Enum):
    """Supported chat platforms."""
    WHATSAPP = "whatsapp"
    INSTAGRAM = "instagram"
    DISCORD = "discord"
    OTHER = "other"


class ToneType(str, Enum):
    """Response tone types."""
    WARM = "warm"
    DIRECT = "direct"
    PLAYFUL = "playful"


class VisualElement(BaseModel):
    """Detected visual element in screenshot."""
    type: str  # 'emoji', 'gif', 'image', 'sticker', 'reaction'
    description: str
    context: Optional[str] = None
    sender: Optional[str] = None


class Participant(BaseModel):
    """Detected conversation participant."""
    name: str
    is_user: bool = False
    message_count: Optional[int] = None


class AnalyzeRequest(BaseModel):
    """Request model for screenshot analysis."""
    screenshot: str = Field(
        ...,
        description="Base64 encoded screenshot image"
    )
    platform: Optional[Platform] = None
    context: Optional[str] = Field(
        None,
        max_length=500,
        description="Additional context about the conversation"
    )


class AIResponseItem(BaseModel):
    """Single AI response suggestion."""
    id: str
    tone: ToneType
    content: str
    character_count: int
    was_copied: bool = False
    
    class Config:
        from_attributes = True


class AnalysisContext(BaseModel):
    """AI-extracted conversation context."""
    summary: str
    tone: str
    relationship_type: str
    key_topics: List[str] = []
    emotional_state: Optional[str] = None
    urgency_level: Optional[str] = None


class AnalyzeResponse(BaseModel):
    """Response model for analysis endpoint."""
    id: str
    platform: Platform
    context: AnalysisContext
    visual_elements: List[VisualElement] = []
    participants: List[Participant] = []
    responses: List[AIResponseItem]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    """Response model for single conversation."""
    id: str
    platform: Platform
    context_summary: Optional[str] = None
    detected_tone: Optional[str] = None
    relationship_type: Optional[str] = None
    visual_elements: List[VisualElement] = []
    participants: List[Participant] = []
    responses: List[AIResponseItem] = []
    created_at: datetime
    
    class Config:
        from_attributes = True


class ConversationListItem(BaseModel):
    """Conversation list item (without responses)."""
    id: str
    platform: Platform
    context_summary: Optional[str] = None
    detected_tone: Optional[str] = None
    created_at: datetime


class ConversationListResponse(BaseModel):
    """Paginated conversation list response."""
    items: List[ConversationListItem]
    total: int
    page: int
    per_page: int
    has_more: bool
