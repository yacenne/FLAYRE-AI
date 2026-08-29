"""
Conversation Models

Pydantic schemas for analysis requests and responses.
"""

from typing import Optional, List
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field


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
    """Request schema for screenshot analysis."""
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

    model_config = ConfigDict(from_attributes=True)


class AnalysisContext(BaseModel):
    """AI-extracted conversation context."""
    summary: str
    tone: str
    relationship_type: str
    key_topics: List[str] = Field(default_factory=list)
    emotional_state: Optional[str] = None
    urgency_level: Optional[str] = None


class AnalyzeResponse(BaseModel):
    """Response schema for analysis endpoint."""
    id: str
    platform: Platform
    context: AnalysisContext
    visual_elements: List[VisualElement] = Field(default_factory=list)
    participants: List[Participant] = Field(default_factory=list)
    responses: List[AIResponseItem]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationResponse(BaseModel):
    """Response schema for single conversation with all suggestions."""
    id: str
    platform: Platform
    context_summary: Optional[str] = None
    detected_tone: Optional[str] = None
    relationship_type: Optional[str] = None
    visual_elements: List[VisualElement] = Field(default_factory=list)
    participants: List[Participant] = Field(default_factory=list)
    responses: List[AIResponseItem] = Field(default_factory=list)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationListItem(BaseModel):
    """Conversation list item (without full responses)."""
    id: str
    platform: Platform
    context_summary: Optional[str] = None
    detected_tone: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationListResponse(BaseModel):
    """Paginated conversation list response."""
    items: List[ConversationListItem]
    total: int
    page: int
    per_page: int
    has_more: bool
