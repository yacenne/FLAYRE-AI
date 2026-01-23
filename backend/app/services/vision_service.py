"""
Vision Service - Analyzes images, memes, GIFs in conversations
"""

import base64
import logging
from typing import List, Dict, Any, Optional
import httpx

from app.config import settings
from app.models.schemas import DetectedVisual, ScreenshotPage

logger = logging.getLogger(__name__)


class VisionService:
    """Analyzes visual content in screenshots using AI Vision"""
    
    def __init__(self):
        self.vision_model = settings.vision_model
        self.api_key = settings.openrouter_api_key
        logger.info(f"Vision Service initialized with model: {self.vision_model}")
    
    async def analyze_screenshot(
        self,
        image_base64: str,
        context: str = ""
    ) -> Dict[str, Any]:
        """
        Analyze a single screenshot using Vision AI
        
        Returns:
            - extracted_text: Text from the conversation
            - detected_visuals: Any images/memes/GIFs found
            - participants: Who's in the conversation
        """
        
        logger.info("Analyzing screenshot with Vision AI")
        
        # Build the vision prompt
        system_prompt = """You are an expert at analyzing chat screenshots. Extract ALL information:

1. **CONVERSATION TEXT**: Extract every message with sender names
   Format: "Sender: message content"
   
2. **VISUAL CONTENT**: Identify any images, memes, GIFs, stickers shared
   For each visual:
   - Type (meme, GIF, photo, sticker, emoji reaction)
   - Description of what it shows
   - Which message it's part of
   - Emotional tone it conveys
   - If it's a meme, identify the template (Drake, Distracted Boyfriend, etc.)
   - Any text visible in the image

3. **PLATFORM DETECTION**: Identify the messaging platform from UI elements

Respond in JSON:
{
    "extracted_text": "Full conversation as text",
    "messages": [
        {"sender": "Name", "content": "message", "has_visual": false},
        {"sender": "Name", "content": "[Image: description]", "has_visual": true}
    ],
    "detected_visuals": [
        {
            "type": "meme|gif|image|sticker|emoji_reaction",
            "description": "What it shows",
            "position": "message_2",
            "sender": "Who sent it",
            "emotional_tone": "funny|sarcastic|supportive|etc",
            "meme_template": "Drake|null",
            "text_in_image": "Any text visible"
        }
    ],
    "platform": "whatsapp|instagram|discord|etc",
    "platform_confidence": 0.9
}"""

        user_content = [
            {
                "type": "text",
                "text": f"Analyze this chat screenshot completely. {context}"
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/png;base64,{image_base64}"
                }
            }
        ]
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://socialcoach.app",
                    },
                    json={
                        "model": self.vision_model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_content}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 2000
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                content = data["choices"][0]["message"]["content"]
                
                # Parse JSON from response
                import json
                import re
                
                # Try to extract JSON
                json_match = re.search(r'\{[\s\S]*\}', content)
                if json_match:
                    result = json.loads(json_match.group())
                    logger.info(f"Vision analysis complete: {len(result.get('messages', []))} messages found")
                    return result
                else:
                    # Return raw text if JSON parsing fails
                    return {
                        "extracted_text": content,
                        "messages": [],
                        "detected_visuals": [],
                        "platform": "unknown",
                        "platform_confidence": 0.5
                    }
                    
        except Exception as e:
            logger.error(f"Vision analysis failed: {e}")
            raise ValueError(f"Failed to analyze screenshot: {str(e)}")
    
    async def analyze_multi_page(
        self,
        pages: List[ScreenshotPage],
        context: str = ""
    ) -> Dict[str, Any]:
        """
        Analyze multiple screenshot pages and combine results
        
        For long conversations that span multiple screens
        """
        
        logger.info(f"Analyzing {len(pages)} screenshot pages")
        
        all_text = []
        all_visuals = []
        detected_platform = "unknown"
        
        for page in sorted(pages, key=lambda p: p.page_number):
            try:
                result = await self.analyze_screenshot(
                    page.image_base64,
                    f"This is page {page.page_number} of {len(pages)}. {context}"
                )
                
                # Accumulate text
                if result.get("extracted_text"):
                    all_text.append(f"--- Page {page.page_number} ---\n{result['extracted_text']}")
                
                # Accumulate visuals
                for visual in result.get("detected_visuals", []):
                    visual["page"] = page.page_number
                    all_visuals.append(visual)
                
                # Use first detected platform
                if detected_platform == "unknown" and result.get("platform") != "unknown":
                    detected_platform = result["platform"]
                    
            except Exception as e:
                logger.warning(f"Failed to analyze page {page.page_number}: {e}")
                continue
        
        # Combine all pages
        combined_text = "\n\n".join(all_text)
        
        return {
            "extracted_text": combined_text,
            "detected_visuals": all_visuals,
            "platform": detected_platform,
            "page_count": len(pages),
            "confidence": 0.85 if all_text else 0.3
        }
    
    async def analyze_visual_content(
        self,
        image_base64: str,
        context: str = ""
    ) -> DetectedVisual:
        """
        Analyze a single visual (meme, GIF, image) in detail
        
        Used when user specifically shares an image to understand
        """
        
        system_prompt = """Analyze this image/meme/GIF in detail:

1. What type is it? (meme, reaction GIF, photo, sticker)
2. What does it show/depict?
3. What emotion or message does it convey?
4. If it's a meme, what template is it?
5. Is there any text in the image?
6. What cultural references does it make?

Respond in JSON:
{
    "type": "meme|gif|image|sticker",
    "description": "Detailed description",
    "emotional_tone": "The emotion it conveys",
    "meme_template": "Template name or null",
    "text_in_image": "Any text or null",
    "cultural_reference": "Reference or null",
    "appropriate_response_style": "How to respond to this"
}"""

        user_content = [
            {"type": "text", "text": context or "Analyze this visual content:"},
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{image_base64}"}
            }
        ]
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.vision_model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_content}
                        ],
                        "temperature": 0.3
                    }
                )
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                
                import json
                import re
                json_match = re.search(r'\{[\s\S]*\}', content)
                if json_match:
                    result = json.loads(json_match.group())
                    return DetectedVisual(
                        type=result.get("type", "image"),
                        description=result.get("description", ""),
                        position="standalone",
                        emotional_tone=result.get("emotional_tone", "neutral"),
                        meme_template=result.get("meme_template"),
                        text_in_image=result.get("text_in_image")
                    )
        except Exception as e:
            logger.error(f"Visual analysis failed: {e}")
        
        return DetectedVisual(
            type="image",
            description="Could not analyze image",
            position="standalone",
            emotional_tone="unknown"
        )


# Singleton
vision_service = VisionService()