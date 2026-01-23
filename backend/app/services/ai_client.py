"""
AI Client - Handles communication with OpenRouter API
"""

import httpx
import json
import logging
import re
from typing import Optional, Dict, Any

from app.config import settings

logger = logging.getLogger(__name__)


class AIClient:
    """Client for AI model interactions via OpenRouter"""
    
    def __init__(self):
        self.base_url = "https://openrouter.ai/api/v1"
        self.headers = {
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://socialcoach.app",
            "X-Title": "Social Coach"
        }
        logger.info("AI Client initialized")
    
    async def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        json_mode: bool = False
    ) -> str:
        """Get completion from AI model"""
        
        model = model or settings.primary_model
        
        payload: Dict[str, Any] = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        if json_mode:
            payload["response_format"] = {"type": "json_object"}
        
        logger.info(f"Calling AI model: {model}")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                
                content = data["choices"][0]["message"]["content"]
                logger.info(f"AI response: {len(content)} chars")
                return content
                
            except httpx.HTTPStatusError as e:
                logger.error(f"AI error: {e.response.status_code}")
                
                # Try fallback model
                if model != settings.fast_model:
                    logger.info(f"Trying fallback: {settings.fast_model}")
                    payload["model"] = settings.fast_model
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=self.headers,
                        json=payload
                    )
                    response.raise_for_status()
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                raise
    
    async def complete_json(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.4
    ) -> Dict[str, Any]:
        """Get JSON completion from AI model"""
        
        response = await self.complete(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model=model,
            temperature=temperature,
            json_mode=True
        )
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            # Try to extract JSON
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except json.JSONDecodeError:
                    pass
            
            logger.error(f"JSON parse failed: {response[:500]}")
            raise ValueError("Failed to parse JSON from AI response")


# Singleton instance
ai_client = AIClient()