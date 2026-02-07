"""
Vision AI Service

Screenshot analysis using OpenRouter Vision AI.
"""

import base64
import httpx
from typing import Optional, List
from dataclasses import dataclass, field

from app.config import settings
from app.models.conversation import (
    AnalysisContext,
    VisualElement,
    Participant,
    AIResponseItem,
    ToneType,
    Platform
)
from app.services.ai.prompts import ANALYSIS_PROMPT
from app.core.logging import get_logger
from app.core.exceptions import AIServiceError

logger = get_logger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


@dataclass
class AnalysisResult:
    """Result from Vision AI analysis."""
    platform: str
    context: AnalysisContext
    visual_elements: List[VisualElement] = field(default_factory=list)
    participants: List[Participant] = field(default_factory=list)
    responses: List["GeneratedResponse"] = field(default_factory=list)
    model_used: Optional[str] = None


@dataclass 
class GeneratedResponse:
    """AI-generated response suggestion."""
    tone: ToneType
    content: str


async def analyze_screenshot(
    screenshot_base64: str,
    platform: Optional[str] = None,
    additional_context: Optional[str] = None
) -> AnalysisResult:
    """
    Analyze a screenshot using Vision AI.
    
    Args:
        screenshot_base64: Base64 encoded screenshot
        platform: Optional platform hint (whatsapp, instagram, etc)
        additional_context: Optional additional context from user
    
    Returns:
        AnalysisResult with context, visual elements, and responses
    
    Raises:
        AIServiceError: If Vision AI request fails
    """
    logger.info(f"Starting Vision AI analysis - use_ollama={settings.use_ollama}, vision_model={settings.vision_model}")
    logger.info(f"OpenRouter key present: {bool(settings.openrouter_api_key)}, Ollama URL: {settings.ollama_url}")
    
    # Validate and clean base64
    if "," in screenshot_base64:
        screenshot_base64 = screenshot_base64.split(",")[1]
    
    # Build prompt
    context_hint = ""
    if platform:
        context_hint += f"Platform: {platform}. "
    if additional_context:
        context_hint += f"Additional context: {additional_context}"
    
    try:
        # Choose API endpoint based on settings
        if settings.use_ollama:
            api_url = f"{settings.ollama_url}/v1/chat/completions"
            model = settings.ollama_vision_model
            headers = {"Content-Type": "application/json"}
            # Add auth header for Ollama Cloud
            if settings.ollama_api_key:
                headers["Authorization"] = f"Bearer {settings.ollama_api_key}"
            logger.info(f"Using Ollama at {api_url} with model {model}")
        else:
            api_url = OPENROUTER_URL
            model = settings.vision_model
            headers = {
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": settings.frontend_url,
                "X-Title": "flayre.ai"
            }
            logger.info(f"Using OpenRouter with model {model}")
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                api_url,
                headers=headers,
                json={
                    "model": model,
                    "messages": [
                        {
                            "role": "system",
                            "content": ANALYSIS_PROMPT
                        },
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": f"Analyze this conversation screenshot and generate response suggestions. {context_hint}"
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/png;base64,{screenshot_base64}"
                                    }
                                }
                            ]
                        }
                    ],
                    "max_tokens": 2000,
                    "temperature": 0.7
                }
            )
            
            if response.status_code != 200:
                error_text = response.text[:500] if response.text else "No response body"
                logger.error(f"Vision AI error: {response.status_code} - {error_text}")
                raise AIServiceError(f"Vision AI returned {response.status_code}: {error_text}")
            
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            # Parse the AI response
            result = parse_ai_response(content, platform)
            result.model_used = settings.vision_model
            
            logger.info("Vision AI analysis complete")
            return result
            
    except httpx.TimeoutException:
        logger.error("Vision AI request timed out")
        raise AIServiceError("AI analysis timed out")
    except AIServiceError:
        raise
    except Exception as e:
        logger.error(f"Vision AI error: {e}")
        raise AIServiceError(f"Vision AI failed: {str(e)}")


def parse_ai_response(content: str, platform_hint: Optional[str] = None) -> AnalysisResult:
    """
    Parse the AI response into structured data.
    
    The AI is prompted to return JSON-like structured content.
    This function handles parsing and fallbacks.
    """
    import json
    import re
    
    # Default values
    detected_platform = platform_hint or "other"
    context = AnalysisContext(
        summary="Conversation analysis",
        tone="neutral",
        relationship_type="unknown",
        key_topics=[]
    )
    visual_elements = []
    participants = []
    responses = []
    
    try:
        # Try to extract JSON from the response
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            data = json.loads(json_match.group())
            
            # Extract platform
            if "platform" in data:
                detected_platform = data["platform"].lower()
            
            # Extract context
            if "context" in data:
                ctx = data["context"]
                context = AnalysisContext(
                    summary=ctx.get("summary", "Conversation analysis"),
                    tone=ctx.get("tone", "neutral"),
                    relationship_type=ctx.get("relationship_type", "unknown"),
                    key_topics=ctx.get("key_topics", []),
                    emotional_state=ctx.get("emotional_state"),
                    urgency_level=ctx.get("urgency_level")
                )
            
            # Extract visual elements
            if "visual_elements" in data:
                for ve in data["visual_elements"]:
                    visual_elements.append(VisualElement(
                        type=ve.get("type", "unknown"),
                        description=ve.get("description", ""),
                        context=ve.get("context"),
                        sender=ve.get("sender")
                    ))
            
            # Extract participants
            if "participants" in data:
                for p in data["participants"]:
                    participants.append(Participant(
                        name=p.get("name", "Unknown"),
                        is_user=p.get("is_user", False),
                        message_count=p.get("message_count")
                    ))
            
            # Extract responses
            if "responses" in data:
                for r in data["responses"]:
                    tone_str = r.get("tone", "direct").lower()
                    tone = ToneType.DIRECT
                    if "warm" in tone_str:
                        tone = ToneType.WARM
                    elif "playful" in tone_str or "humorous" in tone_str:
                        tone = ToneType.PLAYFUL
                    
                    responses.append(GeneratedResponse(
                        tone=tone,
                        content=r.get("content", "")
                    ))
    
    except json.JSONDecodeError:
        logger.warning("Could not parse AI response as JSON, using fallback")
        # Fallback: generate simple responses from content
        responses = [
            GeneratedResponse(
                tone=ToneType.WARM,
                content="I understand how you feel. Let me know if you'd like to talk more about this."
            ),
            GeneratedResponse(
                tone=ToneType.DIRECT,
                content="Thanks for sharing. What would you like to do next?"
            ),
            GeneratedResponse(
                tone=ToneType.PLAYFUL,
                content="Haha nice! 😄 That's pretty interesting!"
            )
        ]
    
    # Ensure we have exactly 3 responses
    while len(responses) < 3:
        if len(responses) == 0:
            responses.append(GeneratedResponse(
                tone=ToneType.WARM,
                content="I appreciate you sharing this with me."
            ))
        elif len(responses) == 1:
            responses.append(GeneratedResponse(
                tone=ToneType.DIRECT,
                content="Got it! Let me know what you think."
            ))
        else:
            responses.append(GeneratedResponse(
                tone=ToneType.PLAYFUL,
                content="That's awesome! 🎉"
            ))
    
    return AnalysisResult(
        platform=detected_platform,
        context=context,
        visual_elements=visual_elements,
        participants=participants,
        responses=responses[:3]  # Limit to 3
    )
