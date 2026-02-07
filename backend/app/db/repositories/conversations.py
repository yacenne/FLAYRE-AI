"""
Conversation Repository

Database operations for conversations and AI responses.
"""

from typing import Optional, Any, List
from dataclasses import dataclass, field
from datetime import datetime
from supabase import Client

from app.db.repositories.base import BaseRepository
from app.core.logging import get_logger
from app.core.exceptions import DatabaseError

logger = get_logger(__name__)


@dataclass
class AIResponse:
    """AI response suggestion entity."""
    id: str
    conversation_id: str
    tone: str  # 'warm', 'direct', 'playful'
    content: str
    character_count: int
    model_used: Optional[str] = None
    tokens_used: Optional[int] = None
    was_copied: bool = False
    was_used: bool = False
    rating: Optional[int] = None
    created_at: Optional[datetime] = None


@dataclass
class Conversation:
    """Conversation analysis entity."""
    id: str
    user_id: str
    platform: str  # 'whatsapp', 'instagram', 'discord', 'other'
    context_summary: Optional[str] = None
    detected_tone: Optional[str] = None
    relationship_type: Optional[str] = None
    visual_elements: List[dict] = field(default_factory=list)
    participants: List[dict] = field(default_factory=list)
    screenshot_url: Optional[str] = None
    created_at: Optional[datetime] = None
    responses: List[AIResponse] = field(default_factory=list)


class ConversationRepository(BaseRepository[Conversation]):
    """Repository for conversation operations."""
    
    @property
    def table_name(self) -> str:
        return "conversations"
    
    def _to_entity(self, row: dict[str, Any]) -> Conversation:
        return Conversation(
            id=row["id"],
            user_id=row["user_id"],
            platform=row["platform"],
            context_summary=row.get("context_summary"),
            detected_tone=row.get("detected_tone"),
            relationship_type=row.get("relationship_type"),
            visual_elements=row.get("visual_elements", []),
            participants=row.get("participants", []),
            screenshot_url=row.get("screenshot_url"),
            created_at=row.get("created_at")
        )
    
    async def get_user_conversations(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> List[Conversation]:
        """
        Get paginated conversations for a user.
        
        Args:
            user_id: User UUID
            limit: Max results
            offset: Pagination offset
        
        Returns:
            List of conversations (newest first)
        """
        try:
            response = self._table.select("*").eq(
                "user_id", user_id
            ).order(
                "created_at", desc=True
            ).range(
                offset, offset + limit - 1
            ).execute()
            
            return [self._to_entity(row) for row in response.data]
        except Exception as e:
            logger.error(f"Error fetching conversations: {e}")
            raise DatabaseError("Failed to fetch conversations")
    
    async def get_with_responses(self, conversation_id: str) -> Optional[Conversation]:
        """
        Get conversation with all AI responses.
        
        Args:
            conversation_id: Conversation UUID
        
        Returns:
            Conversation with responses populated
        """
        try:
            # Get conversation
            conv_response = self._table.select("*").eq(
                "id", conversation_id
            ).single().execute()
            
            if not conv_response.data:
                return None
            
            conversation = self._to_entity(conv_response.data)
            
            # Get responses
            resp_table = self.client.table("ai_responses")
            resp_response = resp_table.select("*").eq(
                "conversation_id", conversation_id
            ).execute()
            
            if resp_response.data:
                conversation.responses = [
                    AIResponse(
                        id=r["id"],
                        conversation_id=r["conversation_id"],
                        tone=r["tone"],
                        content=r["content"],
                        character_count=r["character_count"],
                        model_used=r.get("model_used"),
                        tokens_used=r.get("tokens_used"),
                        was_copied=r.get("was_copied", False),
                        was_used=r.get("was_used", False),
                        rating=r.get("rating"),
                        created_at=r.get("created_at")
                    )
                    for r in resp_response.data
                ]
            
            return conversation
        except Exception as e:
            logger.error(f"Error fetching conversation with responses: {e}")
            raise DatabaseError("Failed to fetch conversation")
    
    async def create_with_responses(
        self,
        user_id: str,
        platform: str,
        context_summary: str,
        detected_tone: str,
        relationship_type: str,
        visual_elements: List[dict],
        participants: List[dict],
        responses: List[dict],
        screenshot_url: Optional[str] = None,
        model_used: Optional[str] = None
    ) -> Conversation:
        """
        Create a conversation with AI responses in one transaction.
        
        Args:
            user_id: User UUID
            platform: Chat platform
            context_summary: AI-generated context summary
            detected_tone: Detected conversation tone
            relationship_type: Detected relationship type
            visual_elements: List of detected visual elements
            participants: List of conversation participants
            responses: List of AI response suggestions
            screenshot_url: Optional screenshot storage URL
            model_used: AI model used for analysis
        
        Returns:
            Created conversation with responses
        """
        try:
            # Create conversation
            conv_data = {
                "user_id": user_id,
                "platform": platform,
                "context_summary": context_summary,
                "detected_tone": detected_tone,
                "relationship_type": relationship_type,
                "visual_elements": visual_elements,
                "participants": participants,
                "screenshot_url": screenshot_url
            }
            
            conv_response = self._table.insert(conv_data).execute()
            if not conv_response.data or len(conv_response.data) == 0:
                raise DatabaseError("Failed to create conversation")
            
            conversation = self._to_entity(conv_response.data[0])
            
            # Create responses
            resp_table = self.client.table("ai_responses")
            for resp in responses:
                resp_data = {
                    "conversation_id": conversation.id,
                    "tone": resp["tone"],
                    "content": resp["content"],
                    "character_count": len(resp["content"]),
                    "model_used": model_used
                }
                resp_table.insert(resp_data).execute()
            
            # Fetch complete conversation
            return await self.get_with_responses(conversation.id)
        except DatabaseError:
            raise
        except Exception as e:
            logger.error(f"Error creating conversation: {e}", exc_info=True)
            raise DatabaseError(f"Failed to create conversation: {str(e)}")
    
    async def mark_response_copied(self, response_id: str) -> bool:
        """
        Mark a response as copied by user.
        
        Args:
            response_id: AI response UUID
        
        Returns:
            True if updated
        """
        try:
            resp_table = self.client.table("ai_responses")
            response = resp_table.update({
                "was_copied": True
            }).eq("id", response_id).execute()
            return len(response.data) > 0 if response.data else False
        except Exception as e:
            logger.error(f"Error marking response copied: {e}")
            return False
    
    async def delete_user_conversation(
        self,
        user_id: str,
        conversation_id: str
    ) -> bool:
        """
        Delete a conversation (with ownership check).
        
        Args:
            user_id: User UUID (for ownership verification)
            conversation_id: Conversation UUID
        
        Returns:
            True if deleted
        """
        try:
            response = self._table.delete().match({
                "id": conversation_id,
                "user_id": user_id
            }).execute()
            return len(response.data) > 0 if response.data else False
        except Exception as e:
            logger.error(f"Error deleting conversation: {e}")
            raise DatabaseError("Failed to delete conversation")
    
    async def count_user_conversations(self, user_id: str) -> int:
        """
        Count total conversations for a user.
        
        Args:
            user_id: User UUID
        
        Returns:
            Total count
        """
        try:
            response = self._table.select(
                "id", count="exact"
            ).eq("user_id", user_id).execute()
            return response.count or 0
        except Exception:
            return 0
