"""
Conversations Endpoints

CRUD operations for conversation history.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.api.deps import CurrentUser, get_conversation_repo
from app.db.repositories import ConversationRepository
from app.models.conversation import (
    ConversationResponse,
    ConversationListResponse,
    ConversationListItem,
    AIResponseItem,
    VisualElement,
    Participant,
    Platform,
    ToneType
)
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.get("", response_model=ConversationListResponse)
async def list_conversations(
    user_id: CurrentUser,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    conversation_repo: ConversationRepository = Depends(get_conversation_repo)
):
    """
    Get paginated list of user's conversations.
    """
    offset = (page - 1) * per_page
    
    conversations = await conversation_repo.get_user_conversations(
        user_id=user_id,
        limit=per_page + 1,  # Fetch one extra to check if there's more
        offset=offset
    )
    
    has_more = len(conversations) > per_page
    if has_more:
        conversations = conversations[:per_page]
    
    total = await conversation_repo.count_user_conversations(user_id)
    
    return ConversationListResponse(
        items=[
            ConversationListItem(
                id=c.id,
                platform=Platform(c.platform),
                context_summary=c.context_summary,
                detected_tone=c.detected_tone,
                created_at=c.created_at
            )
            for c in conversations
        ],
        total=total,
        page=page,
        per_page=per_page,
        has_more=has_more
    )


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    user_id: CurrentUser,
    conversation_repo: ConversationRepository = Depends(get_conversation_repo)
):
    """
    Get a single conversation with all responses.
    """
    conversation = await conversation_repo.get_with_responses(conversation_id)
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Verify ownership
    if conversation.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return ConversationResponse(
        id=conversation.id,
        platform=Platform(conversation.platform),
        context_summary=conversation.context_summary,
        detected_tone=conversation.detected_tone,
        relationship_type=conversation.relationship_type,
        visual_elements=[
            VisualElement(**ve) for ve in conversation.visual_elements
        ],
        participants=[
            Participant(**p) for p in conversation.participants
        ],
        responses=[
            AIResponseItem(
                id=r.id,
                tone=ToneType(r.tone),
                content=r.content,
                character_count=r.character_count,
                was_copied=r.was_copied
            )
            for r in conversation.responses
        ],
        created_at=conversation.created_at
    )


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    user_id: CurrentUser,
    conversation_repo: ConversationRepository = Depends(get_conversation_repo)
):
    """
    Delete a conversation.
    """
    deleted = await conversation_repo.delete_user_conversation(
        user_id=user_id,
        conversation_id=conversation_id
    )
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return None


@router.post("/{conversation_id}/responses/{response_id}/copy")
async def mark_response_copied(
    conversation_id: str,
    response_id: str,
    user_id: CurrentUser,
    conversation_repo: ConversationRepository = Depends(get_conversation_repo)
):
    """
    Mark a response as copied (for analytics).
    """
    # Verify ownership first
    conversation = await conversation_repo.get_by_id(conversation_id)
    
    if not conversation or conversation.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    await conversation_repo.mark_response_copied(response_id)
    
    return {"message": "Response marked as copied"}
