"""
Response Engine - Generates contextually perfect responses
"""

import time
import logging
from typing import Optional, List

from app.models.schemas import (
    ParsedConversation,
    GeneratedResponse,
    ResponseVariation,
    GenerateResponse
)
from app.services.ai_client import ai_client
from app.prompts.generation import build_generation_prompt

logger = logging.getLogger(__name__)


class ResponseEngine:
    """Generates responses based on analysis and intent"""
    
    async def generate(
        self,
        parsed_conversation: ParsedConversation,
        user_intent: str,
        additional_context: Optional[str] = None,
        generate_variations: bool = False
    ) -> GenerateResponse:
        """Generate the perfect response"""
        
        start_time = time.time()
        
        logger.info(f"Generating for intent: '{user_intent[:50]}...'")
        
        # Build prompts
        system_prompt, user_prompt = build_generation_prompt(
            analysis=parsed_conversation.analysis,
            messages=parsed_conversation.messages,
            user_intent=user_intent,
            additional_context=additional_context,
            generate_variations=generate_variations
        )
        
        # Generate
        try:
            result = await ai_client.complete_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.7
            )
        except Exception as e:
            raise ValueError(f"Generation failed: {e}")
        
        # Parse primary response
        primary_data = result.get("primary_response", {})
        primary = GeneratedResponse(
            response_text=primary_data.get("text", ""),
            reasoning=primary_data.get("reasoning", ""),
            tone_description=primary_data.get("tone", ""),
            expected_outcome=primary_data.get("expected_outcome", "")
        )
        
        if not primary.response_text:
            raise ValueError("No response generated")
        
        # Parse variations
        variations = None
        if generate_variations and "variations" in result:
            variations = []
            for v in result["variations"]:
                if v.get("text"):
                    variations.append(ResponseVariation(
                        response_text=v.get("text", ""),
                        approach=v.get("approach", ""),
                        trade_off=v.get("trade_off", "")
                    ))
        
        processing_time = int((time.time() - start_time) * 1000)
        
        logger.info(f"Generated in {processing_time}ms")
        
        return GenerateResponse(
            analysis=parsed_conversation.analysis,
            primary_response=primary,
            variations=variations,
            processing_time_ms=processing_time
        )


# Singleton
response_engine = ResponseEngine()