"""
Vision AI Service

Screenshot analysis using OpenRouter or Ollama Vision LLMs.
"""

import json
import re
from typing import Optional, List
from dataclasses import dataclass, field

import httpx

from app.config import settings
from app.models.conversation import (
    AnalysisContext,
    VisualElement,
    Participant,
    ToneType,
)
from app.services.ai.prompts import ANALYSIS_PROMPT
from app.core.logging import get_logger
from app.core.exceptions import AIServiceError

logger = get_logger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


@dataclass
class GeneratedResponse:
    """AI-generated response suggestion item."""
    tone: ToneType
    content: str


@dataclass
class AnalysisResult:
    """Aggregated result from Vision AI analysis."""
    platform: str
    context: AnalysisContext
    visual_elements: List[VisualElement] = field(default_factory=list)
    participants: List[Participant] = field(default_factory=list)
    responses: List[GeneratedResponse] = field(default_factory=list)
    model_used: Optional[str] = None


async def analyze_screenshot(
    screenshot_base64: str,
    platform: Optional[str] = None,
    additional_context: Optional[str] = None
) -> AnalysisResult:
    """
    Analyze a screenshot using Vision AI.

    Args:
        screenshot_base64: Base64 encoded screenshot image
        platform: Optional platform hint (e.g. 'whatsapp', 'instagram')
        additional_context: Optional user-provided context

    Returns:
        AnalysisResult containing detected context, visual elements, participants, and responses.
    """
    # Clean base64 header if present
    if "," in screenshot_base64:
        screenshot_base64 = screenshot_base64.split(",")[1]

    # Build prompt context hints
    context_hint = ""
    if platform:
        context_hint += f"Platform: {platform}. "
    if additional_context:
        context_hint += f"Additional context: {additional_context}"

    try:
        # Choose endpoint and model based on config
        if settings.use_ollama:
            api_url = f"{settings.ollama_url}/v1/chat/completions"
            model = settings.ollama_vision_model
            headers = {"Content-Type": "application/json"}
            if settings.ollama_api_key:
                headers["Authorization"] = f"Bearer {settings.ollama_api_key}"
            logger.info(f"Using Ollama Vision ({model}) at {api_url}")
        else:
            api_url = OPENROUTER_URL
            model = settings.vision_model
            headers = {
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": settings.frontend_url,
                "X-Title": "flayre.ai"
            }
            logger.info(f"Using OpenRouter Vision ({model})")

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
                                    "text": f"Analyze this conversation screenshot and generate response suggestions. {context_hint}".strip()
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
                logger.error(f"Vision AI returned error status {response.status_code}: {error_text}")
                raise AIServiceError(f"Vision AI returned {response.status_code}: {error_text}")

            data = response.json()
            choices = data.get("choices") or []
            content = choices[0].get("message", {}).get("content", "") if choices else ""

            # Parse AI output into structured format
            result = parse_ai_response(content, platform)
            result.model_used = model
            logger.info("Vision AI analysis successfully completed")
            return result

    except httpx.TimeoutException:
        logger.error("Vision AI request timed out")
        raise AIServiceError("AI analysis timed out")
    except AIServiceError:
        raise
    except Exception as e:
        logger.error(f"Vision AI execution error: {e}", exc_info=True)
        raise AIServiceError(f"Vision AI failed: {str(e)}")


def parse_ai_response(content: str, platform_hint: Optional[str] = None) -> AnalysisResult:
    """
    Parse the AI JSON response into structured dataclass objects.
    Provides robust fallbacks if the model returns non-JSON or partial text.
    """
    detected_platform = platform_hint or "other"
    context = AnalysisContext(
        summary="Conversation analysis",
        tone="neutral",
        relationship_type="unknown",
        key_topics=[]
    )
    visual_elements: List[VisualElement] = []
    participants: List[Participant] = []
    responses: List[GeneratedResponse] = []

    try:
        # Extract JSON substring
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            data = json.loads(json_match.group())

            # Extract platform
            if "platform" in data:
                detected_platform = str(data["platform"]).lower()

            # Extract context
            if "context" in data and isinstance(data["context"], dict):
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
            if "visual_elements" in data and isinstance(data["visual_elements"], list):
                for ve in data["visual_elements"]:
                    if isinstance(ve, dict):
                        visual_elements.append(VisualElement(
                            type=ve.get("type", "unknown"),
                            description=ve.get("description", ""),
                            context=ve.get("context"),
                            sender=ve.get("sender")
                        ))

            # Extract participants
            if "participants" in data and isinstance(data["participants"], list):
                for p in data["participants"]:
                    if isinstance(p, dict):
                        participants.append(Participant(
                            name=p.get("name", "Unknown"),
                            is_user=p.get("is_user", False),
                            message_count=p.get("message_count")
                        ))

            # Extract responses
            if "responses" in data and isinstance(data["responses"], list):
                for r in data["responses"]:
                    if isinstance(r, dict):
                        tone_str = str(r.get("tone", "direct")).lower()
                        if "warm" in tone_str:
                            tone = ToneType.WARM
                        elif "playful" in tone_str or "humorous" in tone_str:
                            tone = ToneType.PLAYFUL
                        else:
                            tone = ToneType.DIRECT

                        responses.append(GeneratedResponse(
                            tone=tone,
                            content=r.get("content", "")
                        ))

    except json.JSONDecodeError:
        logger.warning("Could not parse AI response as JSON, using fallback suggestions")
        responses = [
            GeneratedResponse(
                tone=ToneType.WARM,
                content="I appreciate you reaching out. Let's talk more about this!"
            ),
            GeneratedResponse(
                tone=ToneType.DIRECT,
                content="Thanks for the update. What are the next steps?"
            ),
            GeneratedResponse(
                tone=ToneType.PLAYFUL,
                content="Sounds great! 😄 Let's make it happen!"
            )
        ]

    # Ensure exactly 3 responses are returned
    if len(responses) < 3:
        defaults = [
            GeneratedResponse(tone=ToneType.WARM, content="I appreciate you sharing this with me."),
            GeneratedResponse(tone=ToneType.DIRECT, content="Got it! Let me know what you think."),
            GeneratedResponse(tone=ToneType.PLAYFUL, content="That's awesome! 🎉")
        ]
        for default in defaults:
            if len(responses) >= 3:
                break
            if not any(r.tone == default.tone for r in responses):
                responses.append(default)

    return AnalysisResult(
        platform=detected_platform,
        context=context,
        visual_elements=visual_elements,
        participants=participants,
        responses=responses[:3]
    )
