"""
Data Models - All Pydantic schemas for the API
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from enum import Enum


# ══════════════════════════════════════════════════════════════════════════════
# ENUMS
# ══════════════════════════════════════════════════════════════════════════════

class Platform(str, Enum):
    WHATSAPP = "whatsapp"
    IMESSAGE = "imessage"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    INSTAGRAM = "instagram"
    DISCORD = "discord"
    REDDIT = "reddit"
    SLACK = "slack"
    TELEGRAM = "telegram"
    EMAIL = "email"
    UNKNOWN = "unknown"


class RelationshipType(str, Enum):
    STRANGER = "stranger"
    ACQUAINTANCE = "acquaintance"
    FRIEND = "friend"
    CLOSE_FRIEND = "close_friend"
    ROMANTIC_INTEREST = "romantic_interest"
    PARTNER = "partner"
    FAMILY = "family"
    COLLEAGUE = "colleague"
    BOSS = "boss"
    SUBORDINATE = "subordinate"
    CLIENT = "client"
    UNKNOWN = "unknown"


class EmotionalState(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    ANXIOUS = "anxious"
    FRUSTRATED = "frustrated"
    EXCITED = "excited"
    UNCERTAIN = "uncertain"


class ConversationMood(str, Enum):
    CASUAL = "casual"
    SERIOUS = "serious"
    TENSE = "tense"
    PLAYFUL = "playful"
    PROFESSIONAL = "professional"
    INTIMATE = "intimate"
    CONFRONTATIONAL = "confrontational"


class VisualContentType(str, Enum):
    IMAGE = "image"
    GIF = "gif"
    MEME = "meme"
    STICKER = "sticker"
    EMOJI_COMBO = "emoji_combo"
    NONE = "none"


class MemeTemplate(str, Enum):
    DRAKE = "drake_hotline_bling"
    DISTRACTED_BF = "distracted_boyfriend"
    CHANGE_MY_MIND = "change_my_mind"
    TWO_BUTTONS = "two_buttons"
    EXPANDING_BRAIN = "expanding_brain"
    STONKS = "stonks"
    THIS_IS_FINE = "this_is_fine"
    SURPRISED_PIKACHU = "surprised_pikachu"
    CUSTOM = "custom"
    UNKNOWN = "unknown"


# ══════════════════════════════════════════════════════════════════════════════
# INPUT MODELS
# ══════════════════════════════════════════════════════════════════════════════

class Message(BaseModel):
    sender: str
    content: str
    is_user: bool = False
    timestamp: Optional[str] = None


class ConversationInput(BaseModel):
    raw_text: Optional[str] = Field(None, max_length=50000)
    screenshot_base64: Optional[str] = None
    platform_hint: Optional[Platform] = None
    user_name_hint: Optional[str] = None


class GenerateRequest(BaseModel):
    conversation: ConversationInput
    user_intent: str = Field(..., min_length=3, max_length=500)
    additional_context: Optional[str] = Field(None, max_length=1000)
    generate_variations: bool = False


# ══════════════════════════════════════════════════════════════════════════════
# ANALYSIS MODELS
# ══════════════════════════════════════════════════════════════════════════════

class ParticipantAnalysis(BaseModel):
    name: str
    apparent_mood: EmotionalState
    communication_style: str
    current_stance: str


class ContextAnalysis(BaseModel):
    detected_platform: Platform
    platform_confidence: float = Field(ge=0, le=1)
    participants: List[ParticipantAnalysis]
    user_identified: bool
    user_name: Optional[str]
    relationship_type: RelationshipType
    relationship_confidence: float = Field(ge=0, le=1)
    power_dynamic: str
    conversation_mood: ConversationMood
    emotional_temperature: str
    last_message_intent: str
    subtext: str
    critical_factors: List[str]
    potential_landmines: List[str]
    opportunities: List[str]


class ParsedConversation(BaseModel):
    messages: List[Message]
    analysis: ContextAnalysis


# ══════════════════════════════════════════════════════════════════════════════
# VISUAL MODELS
# ══════════════════════════════════════════════════════════════════════════════

class GIFSuggestion(BaseModel):
    url: str
    preview_url: str
    title: str
    source: Literal["giphy", "tenor"]
    relevance_explanation: str
    emotional_match: str
    risk_level: Literal["safe", "moderate", "risky"]


class MemeSuggestion(BaseModel):
    template: MemeTemplate
    top_text: Optional[str] = None
    bottom_text: Optional[str] = None
    image_url: Optional[str] = None
    explanation: str
    humor_type: str


class EmojiSuggestion(BaseModel):
    emojis: str
    placement: Literal["standalone", "end_of_message", "reaction"]
    meaning: str


class VisualSuggestions(BaseModel):
    recommended_type: VisualContentType
    recommendation_reason: str
    gif_suggestions: Optional[List[GIFSuggestion]] = None
    meme_suggestions: Optional[List[MemeSuggestion]] = None
    emoji_suggestions: Optional[List[EmojiSuggestion]] = None
    visual_only: bool = False
    suggested_text_with_visual: Optional[str] = None


# ══════════════════════════════════════════════════════════════════════════════
# OUTPUT MODELS
# ══════════════════════════════════════════════════════════════════════════════

class GeneratedResponse(BaseModel):
    response_text: str
    reasoning: str
    tone_description: str
    expected_outcome: str
    visual_suggestions: Optional[VisualSuggestions] = None


class ResponseVariation(BaseModel):
    response_text: str
    approach: str
    trade_off: str


class GenerateResponse(BaseModel):
    analysis: ContextAnalysis
    primary_response: GeneratedResponse
    variations: Optional[List[ResponseVariation]] = None
    processing_time_ms: int

    # ══════════════════════════════════════════════════════════════════════════════
# SCREENSHOT MODELS
# ══════════════════════════════════════════════════════════════════════════════

class ScreenshotPage(BaseModel):
    """Single screenshot page"""
    image_base64: str
    page_number: int = 1
    
class MultiScreenshotInput(BaseModel):
    """Multiple screenshot pages for long conversations"""
    pages: List[ScreenshotPage]
    platform_hint: Optional[Platform] = None
    user_name_hint: Optional[str] = None

class DetectedVisual(BaseModel):
    """Visual content detected in screenshot"""
    type: str  # "meme", "gif", "image", "sticker", "emoji_reaction"
    description: str
    position: str  # "message_1", "message_3", etc.
    sender: Optional[str] = None
    emotional_tone: str
    meme_template: Optional[str] = None
    text_in_image: Optional[str] = None

class ScreenshotAnalysisResult(BaseModel):
    """Result of screenshot analysis"""
    extracted_text: str
    detected_visuals: List[DetectedVisual]
    page_count: int
    confidence: float


class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None