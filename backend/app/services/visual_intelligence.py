"""
Visual Intelligence - GIF/Meme/Emoji suggestions
"""

import httpx
import logging
from typing import Optional, List, Dict, Any

from app.config import settings
from app.models.schemas import (
    VisualContentType,
    GIFSuggestion,
    MemeSuggestion,
    EmojiSuggestion,
    VisualSuggestions
)
from app.services.ai_client import ai_client

logger = logging.getLogger(__name__)


class VisualIntelligence:
    """Suggests visual content for responses"""
    
    def __init__(self):
        self.giphy_api_key = settings.giphy_api_key
        self.tenor_api_key = settings.tenor_api_key
        logger.info(f"Visual Intelligence: Giphy={bool(self.giphy_api_key)}, Tenor={bool(self.tenor_api_key)}")
    
    async def suggest_visuals(
        self,
        conversation_context: str,
        user_intent: str,
        response_text: str,
        platform: str,
        relationship_type: str,
        conversation_mood: str
    ) -> VisualSuggestions:
        """Suggest visual content for a response"""
        
        logger.info(f"Generating visual suggestions for {platform}")
        
        # Determine strategy
        strategy = await self._determine_strategy(
            conversation_context, user_intent, response_text,
            platform, relationship_type, conversation_mood
        )
        
        suggestions = VisualSuggestions(
            recommended_type=VisualContentType(strategy.get("recommended_type", "none")),
            recommendation_reason=strategy.get("reason", ""),
            visual_only=strategy.get("visual_only", False),
            suggested_text_with_visual=strategy.get("text_with_visual")
        )
        
        # Get GIF suggestions
        if strategy.get("should_suggest_gif") and self.giphy_api_key:
            query = strategy.get("gif_search_query", conversation_mood)
            suggestions.gif_suggestions = await self._search_gifs(query, 3)
        
        # Get emoji suggestions
        if strategy.get("emoji_suggestions"):
            suggestions.emoji_suggestions = [
                EmojiSuggestion(emojis=e, placement="end_of_message", meaning="Adds emotion")
                for e in strategy["emoji_suggestions"][:3]
            ]
        
        return suggestions
    
    async def _determine_strategy(
        self,
        conversation_context: str,
        user_intent: str,
        response_text: str,
        platform: str,
        relationship_type: str,
        conversation_mood: str
    ) -> Dict[str, Any]:
        """Determine visual strategy using AI"""
        
        system_prompt = """Determine the best visual strategy for this response.

Consider platform norms:
- WhatsApp: GIFs common, emojis everywhere
- Discord: GIF-heavy, meme culture
- LinkedIn: MINIMAL visuals
- Twitter: Memes and GIFs common

Respond in JSON:
{
    "recommended_type": "gif|meme|emoji_combo|none",
    "reason": "Why this type",
    "should_suggest_gif": true/false,
    "gif_search_query": "search term",
    "emoji_suggestions": ["😊", "👍"],
    "visual_only": false,
    "text_with_visual": "modified text if needed"
}"""

        user_prompt = f"""Platform: {platform}
Relationship: {relationship_type}
Mood: {conversation_mood}
Intent: {user_intent}

Response: {response_text}

What visual strategy?"""

        try:
            return await ai_client.complete_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.5
            )
        except Exception:
            return {
                "recommended_type": "emoji_combo",
                "reason": "Safe default",
                "should_suggest_gif": False,
                "emoji_suggestions": ["😊"]
            }
    
    async def _search_gifs(self, query: str, limit: int) -> List[GIFSuggestion]:
        """Search Giphy for GIFs"""
        
        url = "https://api.giphy.com/v1/gifs/search"
        params = {
            "api_key": self.giphy_api_key,
            "q": query,
            "limit": limit,
            "rating": "pg-13"
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                suggestions = []
                for gif in data.get("data", []):
                    images = gif.get("images", {})
                    suggestions.append(GIFSuggestion(
                        url=images.get("original", {}).get("url", ""),
                        preview_url=images.get("fixed_height_small", {}).get("url", ""),
                        title=gif.get("title", ""),
                        source="giphy",
                        relevance_explanation=f"Matches: {query}",
                        emotional_match="contextual",
                        risk_level="safe"
                    ))
                return suggestions
            except Exception as e:
                logger.error(f"Giphy search failed: {e}")
                return []


# Singleton
visual_intelligence = VisualIntelligence()