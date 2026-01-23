"""
Context Intelligence - The brain of Social Coach
"""

import logging
from typing import Optional

from app.models.schemas import (
    ConversationInput,
    ParsedConversation,
    Message,
    ContextAnalysis,
    ParticipantAnalysis,
    Platform,
    RelationshipType,
    EmotionalState,
    ConversationMood
)
from app.services.ai_client import ai_client
from app.services.ocr import ocr_service
from app.prompts.analysis import CONTEXT_ANALYSIS_PROMPT

logger = logging.getLogger(__name__)


class ContextIntelligence:
    """Deeply analyzes conversations"""
    
    async def process_conversation(
        self,
        input_data: ConversationInput
    ) -> ParsedConversation:
        """Process raw input into analyzed conversation"""
        
        logger.info("Processing conversation")
        
        # Extract text
        raw_text = await self._extract_raw_text(input_data)
        
        if not raw_text or len(raw_text.strip()) < 10:
            raise ValueError("Could not extract conversation text")
        
        logger.info(f"Extracted {len(raw_text)} chars")
        
        # Analyze
        return await self._analyze_conversation(
            raw_text=raw_text,
            platform_hint=input_data.platform_hint,
            user_name_hint=input_data.user_name_hint
        )
    
    async def _extract_raw_text(self, input_data: ConversationInput) -> str:
        """Extract raw text from input"""
        
        if input_data.raw_text:
            return input_data.raw_text.strip()
        
        if input_data.screenshot_base64:
            try:
                return await ocr_service.extract_text(input_data.screenshot_base64)
            except Exception as e:
                raise ValueError(f"Could not read screenshot: {e}")
        
        raise ValueError("No conversation input provided")
    
    async def _analyze_conversation(
        self,
        raw_text: str,
        platform_hint: Optional[Platform],
        user_name_hint: Optional[str]
    ) -> ParsedConversation:
        """Use AI to analyze conversation"""
        
        hints = []
        if platform_hint:
            hints.append(f"Platform: {platform_hint.value}")
        if user_name_hint:
            hints.append(f"User's name: {user_name_hint}")
        else:
            hints.append("User needs help responding (likely NOT the last speaker)")
        
        user_prompt = f"""Analyze this conversation:

---
{raw_text}
---

{chr(10).join(hints)}

Provide comprehensive analysis as JSON."""

        logger.info("Calling AI for analysis")
        
        try:
            result = await ai_client.complete_json(
                system_prompt=CONTEXT_ANALYSIS_PROMPT,
                user_prompt=user_prompt,
                temperature=0.3
            )
        except Exception as e:
            raise ValueError(f"Analysis failed: {e}")
        
        # Parse messages
        messages = []
        for msg in result.get("messages", []):
            messages.append(Message(
                sender=msg.get("sender", "Unknown"),
                content=msg.get("content", ""),
                is_user=msg.get("is_user", False)
            ))
        
        if not messages:
            raise ValueError("Could not parse messages")
        
        # Parse participants
        participants = []
        for p in result.get("participants", []):
            try:
                mood = EmotionalState(p.get("apparent_mood", "neutral"))
            except ValueError:
                mood = EmotionalState.NEUTRAL
            
            participants.append(ParticipantAnalysis(
                name=p.get("name", "Unknown"),
                apparent_mood=mood,
                communication_style=p.get("communication_style", ""),
                current_stance=p.get("current_stance", "")
            ))
        
        # Parse enums with fallbacks
        try:
            platform = Platform(result.get("platform", "unknown"))
        except ValueError:
            platform = Platform.UNKNOWN
        
        try:
            relationship = RelationshipType(result.get("relationship_type", "unknown"))
        except ValueError:
            relationship = RelationshipType.UNKNOWN
        
        try:
            mood = ConversationMood(result.get("conversation_mood", "casual"))
        except ValueError:
            mood = ConversationMood.CASUAL
        
        analysis = ContextAnalysis(
            detected_platform=platform,
            platform_confidence=float(result.get("platform_confidence", 0.5)),
            participants=participants,
            user_identified=result.get("user_identified", False),
            user_name=result.get("user_name"),
            relationship_type=relationship,
            relationship_confidence=float(result.get("relationship_confidence", 0.5)),
            power_dynamic=result.get("power_dynamic", "equal"),
            conversation_mood=mood,
            emotional_temperature=result.get("emotional_temperature", "neutral"),
            last_message_intent=result.get("last_message_intent", "Unknown"),
            subtext=result.get("subtext", ""),
            critical_factors=result.get("critical_factors", []),
            potential_landmines=result.get("potential_landmines", []),
            opportunities=result.get("opportunities", [])
        )
        
        return ParsedConversation(messages=messages, analysis=analysis)
    
    def format_for_prompt(self, parsed: ParsedConversation) -> str:
        """Format conversation for prompts"""
        lines = []
        for msg in parsed.messages:
            prefix = "[USER]" if msg.is_user else f"[{msg.sender}]"
            lines.append(f"{prefix}: {msg.content}")
        return "\n".join(lines)


# Singleton
context_intelligence = ContextIntelligence()