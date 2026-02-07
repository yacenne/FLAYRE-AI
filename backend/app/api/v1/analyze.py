"""
Screenshot Analysis Endpoint

Main AI analysis endpoint for processing screenshots.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone

from app.api.deps import (
    CurrentUser,
    WithUsageCheck,
    get_subscription_repo,
    get_conversation_repo
)
from app.db.repositories import SubscriptionRepository, ConversationRepository
from app.models.conversation import (
    AnalyzeRequest,
    AnalyzeResponse,
    AnalysisContext,
    AIResponseItem,
    VisualElement,
    Participant,
    Platform,
    ToneType
)
from app.services.ai import analyze_screenshot
from app.core.logging import get_logger
from app.core.exceptions import AIServiceError

logger = get_logger(__name__)

router = APIRouter()


@router.post("", response_model=AnalyzeResponse)
async def analyze_conversation(
    request: AnalyzeRequest,
    user_id: WithUsageCheck,  # Automatically checks usage limit
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo),
    conversation_repo: ConversationRepository = Depends(get_conversation_repo)
):
    """
    Analyze a screenshot and generate response suggestions.
    
    **Process:**
    1. Validate user has remaining quota
    2. Send screenshot to Vision AI
    3. Extract context, tone, visual elements
    4. Generate 3 response suggestions
    5. Save to database
    6. Increment usage counter
    
    **Vision AI analyzes:**
    - Message text and structure
    - Emojis and reactions
    - GIFs and images
    - Stickers
    - Participant names
    - Conversation tone
    - Relationship dynamics
    """
    try:
        logger.info(f"Starting analysis for user {user_id}")
        
        # Analyze screenshot with Vision AI
        analysis_result = await analyze_screenshot(
            screenshot_base64=request.screenshot,
            platform=request.platform.value if request.platform else None,
            additional_context=request.context
        )
        
        # Save conversation to database
        conversation = None
        db_save_failed = False
        
        try:
            conversation = await conversation_repo.create_with_responses(
                user_id=user_id,
                platform=analysis_result.platform,
                context_summary=analysis_result.context.summary,
                detected_tone=analysis_result.context.tone,
                relationship_type=analysis_result.context.relationship_type,
                visual_elements=[ve.model_dump() for ve in analysis_result.visual_elements],
                participants=[p.model_dump() for p in analysis_result.participants],
                responses=[
                    {
                        "tone": r.tone.value,
                        "content": r.content
                    }
                    for r in analysis_result.responses
                ],
                model_used=analysis_result.model_used
            )
        except Exception as db_error:
            # Database failed, but AI worked - log and continue with fallback
            logger.warning(f"Database save failed, returning AI result directly: {db_error}")
            db_save_failed = True
        
        # Increment usage counter (only once, regardless of DB save outcome)
        try:
            await subscription_repo.increment_usage(user_id)
        except Exception as e:
            logger.error(f"Failed to increment usage for user {user_id}", exc_info=e)
        
        # Build response - use DB data if available, otherwise use AI result directly
        if conversation and not db_save_failed:
            logger.info(f"Analysis complete for user {user_id}, conversation {conversation.id}")
            
            return AnalyzeResponse(
                id=conversation.id,
                platform=Platform(conversation.platform),
                context=AnalysisContext(
                    summary=conversation.context_summary or "",
                    tone=conversation.detected_tone or "neutral",
                    relationship_type=conversation.relationship_type or "unknown",
                    key_topics=analysis_result.context.key_topics,
                    emotional_state=analysis_result.context.emotional_state,
                    urgency_level=analysis_result.context.urgency_level
                ),
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
                created_at=conversation.created_at or datetime.now(timezone.utc)
            )
        else:
            # Fallback: return AI result without DB persistence
            import uuid
            
            return AnalyzeResponse(
                id=str(uuid.uuid4()),
                platform=Platform(analysis_result.platform),
                context=AnalysisContext(
                    summary=analysis_result.context.summary,
                    tone=analysis_result.context.tone,
                    relationship_type=analysis_result.context.relationship_type,
                    key_topics=analysis_result.context.key_topics,
                    emotional_state=analysis_result.context.emotional_state,
                    urgency_level=analysis_result.context.urgency_level
                ),
                visual_elements=[
                    VisualElement(**ve.model_dump()) for ve in analysis_result.visual_elements
                ],
                participants=[
                    Participant(**p.model_dump()) for p in analysis_result.participants
                ],
                responses=[
                    AIResponseItem(
                        id=str(uuid.uuid4()),
                        tone=r.tone,
                        content=r.content,
                        character_count=len(r.content),
                        was_copied=False
                    )
                    for r in analysis_result.responses
                ],
                created_at=datetime.now(timezone.utc)
            )
        
    except AIServiceError as e:
        logger.error(f"AI service error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI analysis service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"Analysis error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Analysis failed. Please try again later."
        )


@router.get("/usage")
async def get_usage(
    user_id: CurrentUser,
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo)
):
    """
    Get current usage statistics.
    """
    subscription = await subscription_repo.get_by_user_id(user_id)
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    return {
        "analyses_used": subscription.monthly_analyses_used,
        "analyses_limit": subscription.monthly_analyses_limit,
        "analyses_remaining": subscription.analyses_remaining,
        "is_pro": subscription.is_pro,
        "plan_type": subscription.plan_type,
        "reset_date": subscription.current_period_end
    }
