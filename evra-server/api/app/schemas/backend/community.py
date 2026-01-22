from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class MediaAttachment(BaseModel):
    id: str
    type: str
    url: Optional[str] = None
    preview_url: Optional[str] = None
    description: Optional[str] = None

class PostCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    tags: List[str] = Field(default_factory=list, max_items=10)
    media_ids: Optional[List[str]] = None   
    category: str = Field(..., description="Post category (one of 5 categories)")   
class PostUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=5000)
    tags: Optional[List[str]] = Field(None, max_items=10)

class PostResponse(BaseModel):
    id: str
    author_email: str
    author_name: str
    author_profile_picture: Optional[str]
    author_badge: Optional[str]
    content: str
    tags: List[str]
    category: Optional[str] = None
    media_attachments: List[MediaAttachment] = Field(default_factory=list)
    likes_count: int
    comments_count: int
    shares_count: int
    views_count: int
    is_liked_by_user: bool = False
    created_at: datetime
    updated_at: datetime

class PostFeedResponse(BaseModel):
    posts: List[PostResponse]
    total: int
    page: int
    page_size: int
    has_more: bool

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)
    parent_comment_id: Optional[str] = None

class CommentResponse(BaseModel):
    id: str
    post_id: str
    author_email: str
    author_name: str
    author_profile_picture: Optional[str]
    author_badge: Optional[str]
    content: str
    parent_comment_id: Optional[str]
    likes_count: int
    created_at: datetime
    updated_at: datetime
    is_deleted: bool = False

class LikeResponse(BaseModel):
    user_email: str
    user_name: str
    user_profile_picture: Optional[str]
    created_at: datetime

class MarkSeenRequest(BaseModel):
    post_ids: List[str] = Field(..., description="List of post IDs to mark as seen")

