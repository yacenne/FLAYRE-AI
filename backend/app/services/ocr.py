"""
OCR Service - Enhanced with multi-page and vision support
"""

import base64
import io
import logging
from typing import List, Optional
import httpx
from PIL import Image, ImageEnhance

from app.config import settings

logger = logging.getLogger(__name__)


class OCRService:
    """Enhanced OCR with multi-page support"""
    
    def __init__(self):
        self.use_google_vision = bool(settings.google_vision_api_key)
        logger.info(f"OCR Service initialized. Google Vision: {self.use_google_vision}")
    
    async def extract_text(self, image_base64: str) -> str:
        """Extract text from single image"""
        
        logger.info("Starting text extraction")
        
        if self.use_google_vision:
            try:
                text = await self._google_vision_ocr(image_base64)
                if text:
                    return text
            except Exception as e:
                logger.warning(f"Google Vision failed: {e}")
        
        return self._tesseract_ocr(image_base64)
    
    async def extract_text_multi_page(
        self,
        images_base64: List[str]
    ) -> str:
        """Extract and combine text from multiple images"""
        
        logger.info(f"Processing {len(images_base64)} pages")
        
        all_text = []
        
        for i, image_b64 in enumerate(images_base64):
            try:
                text = await self.extract_text(image_b64)
                if text.strip():
                    all_text.append(f"--- Page {i + 1} ---\n{text}")
            except Exception as e:
                logger.warning(f"Failed to extract text from page {i + 1}: {e}")
        
        return "\n\n".join(all_text)
    
    async def stitch_images(
        self,
        images_base64: List[str],
        direction: str = "vertical"
    ) -> str:
        """
        Stitch multiple images into one
        Useful for long scrolling screenshots
        """
        
        logger.info(f"Stitching {len(images_base64)} images {direction}ly")
        
        images = []
        for img_b64 in images_base64:
            img_bytes = base64.b64decode(img_b64)
            img = Image.open(io.BytesIO(img_bytes))
            images.append(img)
        
        if not images:
            raise ValueError("No images to stitch")
        
        if direction == "vertical":
            # Stack vertically
            total_height = sum(img.height for img in images)
            max_width = max(img.width for img in images)
            
            stitched = Image.new('RGB', (max_width, total_height), 'white')
            
            y_offset = 0
            for img in images:
                stitched.paste(img, (0, y_offset))
                y_offset += img.height
        else:
            # Stack horizontally
            total_width = sum(img.width for img in images)
            max_height = max(img.height for img in images)
            
            stitched = Image.new('RGB', (total_width, max_height), 'white')
            
            x_offset = 0
            for img in images:
                stitched.paste(img, (x_offset, 0))
                x_offset += img.width
        
        # Convert back to base64
        buffer = io.BytesIO()
        stitched.save(buffer, format='PNG')
        return base64.b64encode(buffer.getvalue()).decode()
    
    def _tesseract_ocr(self, image_base64: str) -> str:
        """Extract text using Tesseract OCR"""
        import pytesseract
        
        logger.debug("Using Tesseract OCR")
        
        image_bytes = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Preprocess
        image = image.convert('L')
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.5)
        
        # OCR
        config = '--psm 4 --oem 3'
        text = pytesseract.image_to_string(image, config=config)
        
        logger.info(f"Tesseract extracted {len(text)} chars")
        return text.strip()
    
    async def _google_vision_ocr(self, image_base64: str) -> str:
        """Extract text using Google Vision API"""
        
        logger.debug("Using Google Vision OCR")
        
        url = "https://vision.googleapis.com/v1/images:annotate"
        
        payload = {
            "requests": [{
                "image": {"content": image_base64},
                "features": [
                    {"type": "DOCUMENT_TEXT_DETECTION"},
                    {"type": "TEXT_DETECTION"}
                ]
            }]
        }
        
        params = {"key": settings.google_vision_api_key}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload, params=params)
            response.raise_for_status()
            data = response.json()
            
            if "responses" in data and data["responses"]:
                full_text = data["responses"][0].get("fullTextAnnotation", {})
                if full_text and "text" in full_text:
                    return full_text["text"]
                
                annotations = data["responses"][0].get("textAnnotations", [])
                if annotations:
                    return annotations[0].get("description", "")
        
        return ""


# Singleton
ocr_service = OCRService()