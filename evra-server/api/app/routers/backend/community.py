from fastapi import APIRouter, HTTPException, Depends, Query, Header, UploadFile, File, Form, Body
from typing import Optional, List
import logging

from app.schemas.backend.community import (
    PostCreate,
    PostUpdate,
    PostResponse,
    PostFeedResponse,
    CommentCreate,
    CommentResponse,
    MarkSeenRequest
)
from app.services.backend_services.community_service_pleroma import get_community_service
from app.core.security import get_current_user, CurrentUser

logger = logging.getLogger(__name__)
community_router = APIRouter()

@community_router.post("/api/community/posts", response_model=dict)
async def create_post   (
    post: PostCreate,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Create a new community post"""
    try:
        community_service = get_community_service()
        post_id = await community_service.create_post(
            user_email=current_user.email,
            content=post.content,
            tags=post.tags,
            media_ids=post.media_ids,
            category=post.category
        )
        
        return {
            "success": True,
            "message": "Post created successfully",
            "id": post_id
        }
    except Exception as e:
        logger.error(f"Error creating post: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create post")

@community_router.get("/api/community/posts")
async def get_feed(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    max_id: Optional[str] = Query(None, description="Cursor for pagination (use last post's id for next page)"),
    current_user: Optional[CurrentUser] = Depends(get_current_user)
):
    """Get paginated feed of community posts. Uses cursor-based pagination via max_id."""
    try:
        community_service = get_community_service()
        feed = await community_service.get_feed(
            page=page,
            page_size=page_size,
            viewer_email=current_user.email if current_user else None,
            max_id=max_id
        )
        
        return {
            "success": True,
            **feed
        }
    except Exception as e:
        logger.error(f"Error getting feed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get feed")

@community_router.get("/api/community/posts/my-posts")
async def get_my_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    max_id: Optional[str] = Query(None, description="Cursor for pagination (use last post's id for next page)"),
    current_user: CurrentUser = Depends(get_current_user)
):
    """Get current user's posts. Uses cursor-based pagination via max_id."""
    try:
        community_service = get_community_service()
        feed = await community_service.get_user_posts(
            user_email=current_user.email,
            page=page,
            page_size=page_size,
            viewer_email=current_user.email,
            max_id=max_id
        )
        
        return {
            "success": True,
            **feed
        }
    except Exception as e:
        logger.error(f"Error getting user posts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get user posts")

@community_router.get("/api/community/posts/{post_id}")
async def get_post(
    post_id: str,
    current_user: Optional[CurrentUser] = Depends(get_current_user)
):
    """Get a single post by ID"""
    try:
        community_service = get_community_service()
        post = await community_service.get_post(
            post_id=post_id,
            viewer_email=current_user.email if current_user else None
        )
        
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        return {
            "success": True,
            "post": post
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting post: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get post")

@community_router.put("/api/community/posts/{post_id}")
async def update_post(
    post_id: str,
    post: PostUpdate,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Update a post (only by author)"""
    try:
        community_service = get_community_service()
        success = await community_service.update_post(
            post_id=post_id,
            user_email=current_user.email,
            content=post.content,
            tags=post.tags
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Post not found or not authorized")
        
        return {
            "success": True,
            "message": "Post updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating post: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update post")

@community_router.delete("/api/community/posts/{post_id}")
async def delete_post(
    post_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Delete a post (only by author)"""
    try:
        community_service = get_community_service()
        success = await community_service.delete_post(
            post_id=post_id,
            user_email=current_user.email
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Post not found or not authorized")
        
        return {
            "success": True,
            "message": "Post deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting post: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete post")

@community_router.post("/api/community/posts/{post_id}/like")
async def toggle_like(
    post_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Toggle like on a post"""
    try:
        community_service = get_community_service()
        result = await community_service.toggle_like(
            post_id=post_id,
            user_email=current_user.email
        )
        
        return {
            "success": True,
            **result
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error toggling like: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to toggle like")

@community_router.post("/api/community/posts/{post_id}/comments")
async def add_comment(
    post_id: str,
    comment: CommentCreate,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Add a comment to a post"""
    try:
        community_service = get_community_service()
        comment_id = await community_service.add_comment(
            post_id=post_id,
            user_email=current_user.email,
            content=comment.content,
            parent_comment_id=comment.parent_comment_id
        )
        
        return {
            "success": True,
            "message": "Comment added successfully",
            "id": comment_id
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error adding comment: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to add comment")

@community_router.get("/api/community/posts/{post_id}/comments")
async def get_comments(
    post_id: str
):
    """Get all comments for a post"""
    try:
        community_service = get_community_service()
        comments = await community_service.get_comments(post_id=post_id)
        
        return {
            "success": True,
            "comments": comments
        }
    except Exception as e:
        logger.error(f"Error getting comments: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get comments")

@community_router.delete("/api/community/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Delete a comment (only by author)"""
    try:
        community_service = get_community_service()
        success = await community_service.delete_comment(
            comment_id=comment_id,
            user_email=current_user.email
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Comment not found or not authorized")
        
        return {
            "success": True,
            "message": "Comment deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting comment: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete comment")

@community_router.post("/api/community/media")
async def upload_media(
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Upload a media file to Pleroma.
    Returns media_id that can be used when creating a post.
    """
    try:
        community_service = get_community_service()
        
        file_content = await file.read()
        file_name = file.filename or "upload"
        mime_type = file.content_type
        
        access_token = await community_service._ensure_pleroma_user(current_user.email)
        media = await community_service.pleroma_client.upload_media(
            access_token=access_token,
            file_content=file_content,
            file_name=file_name,
            mime_type=mime_type,
            description=description
        )
        
        return {
            "success": True,
            "media_id": str(media.get("id", "")),
            "media": {
                "id": str(media.get("id", "")),
                "type": media.get("type", "unknown"),
                "url": media.get("url"),
                "preview_url": media.get("preview_url"),
                "description": media.get("description")
            }
        }
    except Exception as e:
        logger.error(f"Error uploading media: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to upload media")

@community_router.post("/api/community/posts/mark-seen")
async def mark_posts_seen(
    request: MarkSeenRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Mark multiple posts as seen by the current user (batch operation)"""
    try:
        community_service = get_community_service()
        success = await community_service.mark_posts_seen(
            post_ids=request.post_ids,
            user_email=current_user.email
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to mark posts as seen")
        
        return {
            "success": True,
            "message": f"Marked {len(request.post_ids)} posts as seen"
        }
    except Exception as e:
        logger.error(f"Error marking posts as seen: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to mark posts as seen")

@community_router.post("/api/community/posts/{post_id}/share")
async def record_share(
    post_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Record a share action and return shareable links (web URL and deep link).
    """
    try:
        community_service = get_community_service()
        result = await community_service.record_share(
            post_id=post_id,
            user_email=current_user.email
        )
        
        deep_link = result["deep_link"]
        web_url = result["web_url"]
        share_text = f"Check out this post on Evra Health! {web_url or deep_link}"
        
        return {
            "success": True,
            "message": "Share recorded successfully",
            "web_url": web_url,
            "deep_link": deep_link,
            "share_text": share_text,
            "title": "Share from Evra Health"
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error recording share: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to record share")

@community_router.delete("/api/community/user/clear-all-data")
async def clear_all_user_data(
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Remove all posts and comments from the current user's Pleroma account.
    Does NOT delete the user account itself.
    This operation cannot be undone.
    """
    try:
        community_service = get_community_service()
        result = await community_service.clear_all_user_data(
            user_email=current_user.email
        )
        
        return {
            "success": result.get("success", False),
            "message": result.get("message", "Operation completed"),
            "posts_deleted": result.get("posts_deleted", 0),
            "comments_deleted": result.get("comments_deleted", 0),
            "total_deleted": result.get("total_deleted", 0),
            "errors": result.get("errors")
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error clearing user data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to clear user data: {str(e)}")


