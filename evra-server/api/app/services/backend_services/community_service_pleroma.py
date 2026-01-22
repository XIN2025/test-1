from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import logging
import os
import secrets
import hashlib
import re
import asyncio
try:
    import bleach
    BLEACH_AVAILABLE = True
except ImportError:
    BLEACH_AVAILABLE = False
    logging.warning("bleach not installed. HTML sanitization disabled. Install with: pip install bleach")

from app.services.backend_services.db import get_db
from app.services.backend_services.pleroma_client import get_pleroma_client

logger = logging.getLogger(__name__)


def _name_to_username(name: str) -> str:
    """
    Convert user's name to Pleroma username format.

    """
    if not name:
        return "user"
    
    username = name.strip().lower().replace(' ', '_')
    
    username = re.sub(r'[^a-z0-9_]', '', username)
    
    username = re.sub(r'_+', '_', username)
    
    username = username.strip('_')
    
    if not username:
        username = "user"
    
    if len(username) > 30:
        username = username[:30].rstrip('_')
    
    return username


def _username_to_display_name(username: str) -> str:
    """
    Convert Pleroma username back to display name format.
    """
    if not username:
        return "Unknown"
    
    display_name = username.replace('_', ' ')
    
    display_name = ' '.join(word.capitalize() for word in display_name.split())
    
    return display_name


class CommunityServicePleroma:
    """Community service using Pleroma backend"""
    
    def __init__(self):
        self.db = get_db()
        self.users_collection = self.db["users"]
        self.preferences_collection = self.db["preferences"]
        self.post_categories_collection = self.db["post_categories"]
        self.post_views_collection = self.db["post_views"]
        self.pleroma_client = get_pleroma_client()
        self._app_credentials = None
        self._ensure_view_index()
    
    def _ensure_view_index(self):
        """Ensure unique index exists on post_views collection (used for both views and seen tracking)"""
        try:
            self.post_views_collection.create_index(
                [("post_id", 1), ("user_email", 1)],
                unique=True,
                name="post_user_unique_view"
            )
        except Exception as e:
            logger.warning(f"Could not create view index (may already exist): {e}")
    
    async def _get_app_credentials(self) -> Dict[str, str]:
        """Get Pleroma app credentials from config"""
        if self._app_credentials:
            return self._app_credentials
        
        from app.config import PLEROMA_CLIENT_ID, PLEROMA_CLIENT_SECRET
        
        if not PLEROMA_CLIENT_ID or not PLEROMA_CLIENT_SECRET:
            raise Exception("PLEROMA_CLIENT_ID and PLEROMA_CLIENT_SECRET must be set in .env")
        
        self._app_credentials = {
            "client_id": PLEROMA_CLIENT_ID,
            "client_secret": PLEROMA_CLIENT_SECRET
        }
        
        return self._app_credentials
    
    async def _ensure_pleroma_user(self, user_email: str) -> str:
        """Ensure user has Pleroma account and return access token"""
        user = await self.users_collection.find_one({"email": user_email})
        
        if not user:
            raise ValueError("User not found in database")
        
        if user.get("pleroma_access_token"):
            try:
                await self.pleroma_client.verify_credentials(user["pleroma_access_token"])
                return user["pleroma_access_token"]
            except Exception as e:
                logger.warning(f"Pleroma token invalid for {user_email}, will recreate: {e}")
        
        logger.info(f"Creating Pleroma account for user: {user_email}")
        
        stored_username = user.get("pleroma_username")
        stored_password = user.get("pleroma_password")
        
        # Get user's name from the users collection
        user_name = user.get("name", "User")
        
        if stored_username and stored_password:
            username = stored_username
            password = stored_password
            logger.info(f"Using stored Pleroma credentials for {user_email}")
        else:
            # Generate username from user's actual name
            base_username = _name_to_username(user_name)
            
            # Add a short hash suffix to ensure uniqueness (using email hash)
            # This prevents conflicts when multiple users have the same name
            username_hash = hashlib.md5(user_email.encode()).hexdigest()[:6]
            
            # Combine base username with hash, ensuring total length <= 30
            if len(base_username) + len(username_hash) + 1 <= 30:
                username = f"{base_username}_{username_hash}"
            else:
                # If too long, truncate base and add hash
                max_base_len = 30 - len(username_hash) - 1
                username = f"{base_username[:max_base_len]}_{username_hash}"
            
            password = secrets.token_urlsafe(32)
            
            await self.users_collection.update_one(
                {"email": user_email},
                {
                    "$set": {
                        "pleroma_username": username,
                        "pleroma_password": password
                    }
                }
            )
            logger.info(f"Generated and stored new Pleroma credentials for {user_email} (username: {username})")
        
        try:
            app_creds = await self._get_app_credentials()
            
            try:
                token_response = await self.pleroma_client.get_user_token(
                    username=username,
                    password=password,
                    client_id=app_creds["client_id"],
                    client_secret=app_creds["client_secret"]
                )
                access_token = token_response["access_token"]
                logger.info(f"User {username} already exists in Pleroma, got token")
            except Exception as token_error:
                logger.info(f"User {username} doesn't exist, creating via Admin API...")
                try:
                    # Use Admin API to create user (requires admin token with proper scopes)
                    await self.pleroma_client.create_user_via_admin(
                        email=user_email,
                        username=username,
                        password=password
                    )
                    logger.info(f"Successfully created Pleroma user {username} via Admin API")
                    
                    # Get OAuth token for the newly created user
                    token_response = await self.pleroma_client.get_user_token(
                        username=username,
                        password=password,
                        client_id=app_creds["client_id"],
                        client_secret=app_creds["client_secret"]
                    )
                    access_token = token_response["access_token"]
                    
                except Exception as create_error:
                    error_str = str(create_error)
                    
                    # Check if user already exists
                    if "has already been taken" in error_str or "already exists" in error_str.lower():
                        logger.warning(f"User {username} already exists in Pleroma, trying to get token...")
                        try:
                            token_response = await self.pleroma_client.get_user_token(
                                username=username,
                                password=password,
                                client_id=app_creds["client_id"],
                                client_secret=app_creds["client_secret"]
                            )
                            access_token = token_response["access_token"]
                            logger.info(f"Got token for existing user {username}")
                        except Exception as token_error2:
                            logger.error(f"User exists but credentials don't match: {token_error2}")
                            raise Exception(f"User exists in Pleroma but credentials don't match. Please contact support to reset community account.")
                    
                    # Check if it's a permissions error
                    elif "403" in error_str and "admin" in error_str.lower():
                        logger.error("Admin token lacks required permissions. Need 'admin:write:accounts' scope.")
                        raise Exception("Server configuration error: Admin token lacks required permissions. Please contact system administrator.")
                    
                    else:
                        logger.error(f"Failed to create Pleroma user via Admin API: {error_str}")
                        raise Exception(f"Failed to create Pleroma user: {error_str}")
            
            account_info = await self.pleroma_client.verify_credentials(access_token)
            pleroma_account_id = account_info["id"]
            
            # Update display_name in Pleroma to match user's actual name
            try:
                current_display_name = account_info.get("display_name", "")
                if current_display_name != user_name:
                    await self.pleroma_client.update_account(
                        access_token=access_token,
                        display_name=user_name
                    )
                    logger.info(f"Updated display_name for {username} to '{user_name}'")
            except Exception as display_name_error:
                # Log but don't fail if display_name update fails
                logger.warning(f"Could not update display_name for {username}: {display_name_error}")
            
            await self.users_collection.update_one(
                {"email": user_email},
                {
                    "$set": {
                        "pleroma_access_token": access_token,
                        "pleroma_username": username,
                        "pleroma_account_id": pleroma_account_id,
                        "pleroma_password": password,
                        "pleroma_created_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            logger.info(f"Successfully setup Pleroma account for {user_email}")
            return access_token
            
        except Exception as e:
            logger.error(f"Error setting up Pleroma account for {user_email}: {e}", exc_info=True)
            raise
    
    def _escape_hashtags_for_pleroma(self, content: str) -> str:
        """
        Escape hashtags by adding $ prefix so Pleroma doesn't treat them as community tags.
        Example: #trending -> $#trending
        """
        if not content:
            return ""
        
        escaped = re.sub(r'#(\w+)', r'$#\1', content)
        return escaped
    
    def _unescape_hashtags_from_pleroma(self, content: str) -> str:
        """
        Remove $ prefix from hashtags when retrieving from Pleroma.
        Example: $#trending -> #trending
        """
        if not content:
            return ""
        
        unescaped = re.sub(r'\$#(\w+)', r'#\1', content)
        return unescaped
    
    def _format_post_content(self, content: str, tags: List[str]) -> str:
        """Format post content with tags as hashtags, escaping them for Pleroma"""
        hashtags = " ".join([f"#{tag.replace(' ', '_')}" for tag in tags if tag.strip()])
        if hashtags:
            full_content = f"{content}\n\n{hashtags}"
        else:
            full_content = content
        
        # Escape hashtags so Pleroma doesn't convert them to links
        return self._escape_hashtags_for_pleroma(full_content)
    
    def _extract_tags_from_content(self, content: str) -> List[str]:
        """Extract hashtags from content (handles both escaped and unescaped)"""
        # First unescape if needed, then extract
        unescaped_content = self._unescape_hashtags_from_pleroma(content)
        hashtags = re.findall(r'#(\w+)', unescaped_content)
        return hashtags
    
    def _sanitize_html(self, html_content: str) -> str:
        """
        Sanitize HTML content to prevent XSS attacks.
        Allows safe HTML tags and attributes commonly used in social media posts.
        Also unescapes hashtags (removes $ prefix) before sanitization.
        Converts <br> tags to newlines for clean text output.
        """
        if not html_content:
            return ""
        
        html_content = self._unescape_hashtags_from_pleroma(html_content)
        
        if not BLEACH_AVAILABLE:
            html_content = re.sub(r'<br\s*/?>', '\n', html_content, flags=re.IGNORECASE)
            return re.sub(r'<[^>]+>', '', html_content)
        
        html_content = re.sub(r'<br\s*/?>', '\n', html_content, flags=re.IGNORECASE)
        
        html_content = re.sub(r'</p>', '\n', html_content, flags=re.IGNORECASE)
        html_content = re.sub(r'<p[^>]*>', '', html_content, flags=re.IGNORECASE)
        
        allowed_tags = [
            'strong', 'em', 'u', 's', 'span',
            'ul', 'ol', 'li', 'blockquote', 'pre', 'code'
        ]
        
        
        allowed_attributes = {
            'span': ['class'],
            'code': ['class']
        }
        
        sanitized = bleach.clean(
            html_content,
            tags=allowed_tags,
            attributes=allowed_attributes,
            strip=True
        )
        
        sanitized = re.sub(r'\n{3,}', '\n\n', sanitized)
        
        sanitized = sanitized.strip()
        
        return sanitized
    
    async def _get_user_badge(self, user_email: str) -> Optional[str]:
        """Get user's health goal badge"""
        prefs = await self.preferences_collection.find_one({"email": user_email})
        if prefs and prefs.get("healthGoals"):
            goals = prefs.get("healthGoals", [])
            if goals:
                return goals[0]
        return None
    
    async def _track_view(self, post_id: str, user_email: str) -> bool:
        """Track a view for a post by a user (prevents duplicate views)"""
        try:
            await self.post_views_collection.insert_one({
                "post_id": post_id,
                "user_email": user_email,
                "viewed_at": datetime.now(timezone.utc)
            })
            return True
        except Exception as e:
            if "duplicate key" in str(e).lower() or "E11000" in str(e):
                return False
            logger.error(f"Error tracking view for post {post_id}: {e}")
            return False
    
    async def _get_view_count(self, post_id: str) -> int:
        """Get the total number of unique views for a post"""
        try:
            count = await self.post_views_collection.count_documents({"post_id": post_id})
            return count
        except Exception as e:
            logger.error(f"Error getting view count for post {post_id}: {e}")
            return 0
    
    async def _get_view_counts_batch(self, post_ids: List[str]) -> Dict[str, int]:
        """Get view counts for multiple posts in a single query (optimized)"""
        try:
            if not post_ids:
                return {}
            
            pipeline = [
                {"$match": {"post_id": {"$in": post_ids}}},
                {"$group": {"_id": "$post_id", "count": {"$sum": 1}}}
            ]
            
            cursor = self.post_views_collection.aggregate(pipeline)
            results = await cursor.to_list(length=None)
            
            view_counts = {result["_id"]: result["count"] for result in results}
            
            return {post_id: view_counts.get(post_id, 0) for post_id in post_ids}
        except Exception as e:
            logger.error(f"Error getting view counts batch: {e}")
            return {post_id: 0 for post_id in post_ids}
    
    async def mark_posts_seen(self, post_ids: List[str], user_email: str) -> bool:
        """
        Mark multiple posts as seen by a user (batch operation).
        Also tracks views - when a post is seen in feed, it counts as a view.
        Uses post_views collection for both seen tracking and view counting.
        """
        try:
            if not post_ids:
                return True
            
            view_records = [
                {
                    "post_id": post_id,
                    "user_email": user_email,
                    "viewed_at": datetime.now(timezone.utc)
                }
                for post_id in post_ids
            ]
            
            try:
                await self.post_views_collection.insert_many(view_records, ordered=False)
            except Exception as e:
                if "E11000" not in str(e):
                    raise
            
            return True
        except Exception as e:
            logger.error(f"Error marking posts as seen: {e}")
            return False
    
    async def _get_seen_post_ids(self, user_email: str) -> set:
        """Get set of post IDs that user has seen (uses post_views collection)"""
        try:
            cursor = self.post_views_collection.find({"user_email": user_email})
            seen_posts = await cursor.to_list(length=None)
            return {post["post_id"] for post in seen_posts}
        except Exception as e:
            logger.error(f"Error getting seen posts for {user_email}: {e}")
            return set()
    
    async def _get_post_category(self, post_id: str) -> Optional[str]:
        """Get category for a post"""
        try:
            category_doc = await self.post_categories_collection.find_one({"post_id": post_id})
            return category_doc.get("category") if category_doc else None
        except Exception as e:
            logger.error(f"Error getting category for post {post_id}: {e}")
            return None
    
    async def _get_post_categories_batch(self, post_ids: List[str]) -> Dict[str, Optional[str]]:
        """Get categories for multiple posts in a single query (optimized)"""
        try:
            if not post_ids:
                return {}
            
            cursor = self.post_categories_collection.find({"post_id": {"$in": post_ids}})
            category_docs = await cursor.to_list(length=None)
            
            categories = {doc["post_id"]: doc.get("category") for doc in category_docs}
            
            return {post_id: categories.get(post_id) for post_id in post_ids}
        except Exception as e:
            logger.error(f"Error getting post categories batch: {e}")
            return {post_id: None for post_id in post_ids}
    
    async def _transform_status_to_post(
        self, 
        status: Dict[str, Any], 
        viewer_email: Optional[str] = None,
        view_counts: Optional[Dict[str, int]] = None,
        categories: Optional[Dict[str, Optional[str]]] = None
    ) -> Dict[str, Any]:
        """Transform Pleroma status to our post format"""
        account = status.get("account", {})
        
        tags = self._extract_tags_from_content(status.get("content", ""))
        
        post_id = status["id"]
        
        if view_counts is not None:
            views_count = view_counts.get(post_id, 0)
        else:
            views_count = await self._get_view_count(post_id)
        
        if categories is not None:
            category = categories.get(post_id)
        else:
            category = await self._get_post_category(post_id)
        
        raw_content = status.get("content", "")
        sanitized_content = self._sanitize_html(raw_content)
        
        media_attachments = []
        for media in status.get("media_attachments", []):
            media_attachments.append({
                "id": str(media.get("id", "")),
                "type": media.get("type", "unknown"),
                "url": media.get("url"),
                "preview_url": media.get("preview_url"),
                "description": media.get("description")
            })
        
        # Get author name - prefer display_name, fallback to converting username
        author_display_name = account.get("display_name")
        if not author_display_name:
            # If no display_name, convert username back to display format
            author_username = account.get("username", "Unknown")
            author_display_name = _username_to_display_name(author_username)
        
        return {
            "id": post_id,
            "author_email": account.get("acct", "unknown"),
            "author_name": author_display_name,
            "author_profile_picture": account.get("avatar"),
            "author_badge": None,  # We'll need to fetch this separately if needed
            "content": sanitized_content,
            "tags": tags,
            "category": category,
            "media_attachments": media_attachments,
            "likes_count": status.get("favourites_count", 0),
            "comments_count": status.get("replies_count", 0),
            "shares_count": status.get("reblogs_count", 0),
            "views_count": views_count,
            "is_liked_by_user": status.get("favourited", False),
            "created_at": status.get("created_at"),
            "updated_at": status.get("edited_at") or status.get("created_at")
        }
    
    async def create_post(self, user_email: str, content: str, tags: List[str], media_ids: Optional[List[str]] = None, category: Optional[str] = None) -> str:
        """Create a new community post"""
        try:
            access_token = await self._ensure_pleroma_user(user_email)
            
            formatted_content = self._format_post_content(content, tags)
            
            status = await self.pleroma_client.create_status(
                access_token=access_token,
                content=formatted_content,
                visibility="public",
                media_ids=media_ids
            )
            
            post_id = status["id"]
            
            if category:
                await self.post_categories_collection.insert_one({
                    "post_id": post_id,
                    "category": category,
                    "created_at": datetime.now(timezone.utc)
                })
            
            logger.info(f"Created post {post_id} by {user_email} with category {category}")
            return post_id
            
        except Exception as e:
            logger.error(f"Error creating post: {e}", exc_info=True)
            raise
    
    async def get_post(self, post_id: str, viewer_email: Optional[str] = None, increment_view: bool = True) -> Optional[Dict[str, Any]]:
        """Get a single post by ID"""
        try:
            access_token = None
            if viewer_email:
                try:
                    access_token = await self._ensure_pleroma_user(viewer_email)
                except:
                    pass
            
            status = await self.pleroma_client.get_status(post_id, access_token)
            
            if not status:
                return None
            
            if viewer_email and increment_view:
                await self._track_view(post_id, viewer_email)
            
            return await self._transform_status_to_post(status, viewer_email)
            
        except Exception as e:
            logger.error(f"Error getting post {post_id}: {e}", exc_info=True)
            return None
    
    async def get_feed(
        self, 
        page: int = 1, 
        page_size: int = 20,
        viewer_email: Optional[str] = None,
        max_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get paginated feed of posts.
        Uses cursor-based pagination via max_id (Pleroma API standard).
        For next page, pass the last post's id as max_id.
       
        """
        try:
            access_token = None
            if viewer_email:
                try:
                    access_token = await self._ensure_pleroma_user(viewer_email)
                except:
                    pass
            
            fetch_limit = page_size * 3 
            statuses = await self.pleroma_client.get_public_timeline(
                local=True,
                limit=fetch_limit,
                max_id=max_id,
                access_token=access_token
            )
            
            post_statuses = [s for s in statuses if not s.get("in_reply_to_id")]
            post_statuses = post_statuses[:page_size]
            
            if not post_statuses:
                return {
                    "posts": [],
                    "total": 0,
                    "page": page,
                    "page_size": page_size,
                    "has_more": False
                }
            
            post_ids = [status["id"] for status in post_statuses]
            view_counts, categories = await asyncio.gather(
                self._get_view_counts_batch(post_ids),
                self._get_post_categories_batch(post_ids)
            )
            
            posts = []
            for status in post_statuses:
                post = await self._transform_status_to_post(
                    status, 
                    viewer_email,
                    view_counts=view_counts,
                    categories=categories
                )
                posts.append(post)
            
            has_more = len(statuses) >= fetch_limit
            
            return {
                "posts": posts,
                "total": len(posts), 
                "page": page,
                "page_size": page_size,
                "has_more": has_more
            }
            
        except Exception as e:
            logger.error(f"Error getting feed: {e}", exc_info=True)
            return {
                "posts": [],
                "total": 0,
                "page": page,
                "page_size": page_size,
                "has_more": False
            }
    
    async def get_user_posts(
        self, 
        user_email: str, 
        page: int = 1, 
        page_size: int = 20,
        viewer_email: Optional[str] = None,
        max_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get posts by specific user.
        Uses cursor-based pagination via max_id (Pleroma API standard).
        For next page, pass the last post's id as max_id.
        """
        try:
            user = await self.users_collection.find_one({"email": user_email})
            if not user or not user.get("pleroma_account_id"):
                return {
                    "posts": [],
                    "total": 0,
                    "page": page,
                    "page_size": page_size,
                    "has_more": False
                }
            
            access_token = None
            if viewer_email:
                try:
                    access_token = await self._ensure_pleroma_user(viewer_email)
                except:
                    pass
            
            fetch_limit = page_size * 3
            statuses = await self.pleroma_client.get_account_statuses(
                account_id=user["pleroma_account_id"],
                limit=fetch_limit,
                max_id=max_id,
                access_token=access_token
            )
            
            post_statuses = [s for s in statuses if not s.get("in_reply_to_id")]
            post_statuses = post_statuses[:page_size]
            
            if not post_statuses:
                return {
                    "posts": [],
                    "total": 0,
                    "page": page,
                    "page_size": page_size,
                    "has_more": False
                }
            
            # Batch fetch all view counts and categories in parallel
            post_ids = [status["id"] for status in post_statuses]
            view_counts, categories = await asyncio.gather(
                self._get_view_counts_batch(post_ids),
                self._get_post_categories_batch(post_ids)
            )
            
            # Transform all posts using batch data
            posts = []
            for status in post_statuses:
                post = await self._transform_status_to_post(
                    status, 
                    viewer_email,
                    view_counts=view_counts,
                    categories=categories
                )
                posts.append(post)
            
            # Determine if there are more posts (if we got full page, likely more exist)
            has_more = len(statuses) >= fetch_limit
            
            return {
                "posts": posts,
                "total": len(posts),  # Current page count (Pleroma doesn't provide total)
                "page": page,
                "page_size": page_size,
                "has_more": has_more
            }
            
        except Exception as e:
            logger.error(f"Error getting user posts: {e}", exc_info=True)
            return {
                "posts": [],
                "total": 0,
                "page": page,
                "page_size": page_size,
                "has_more": False
            }
    
    async def update_post(self, post_id: str, user_email: str, content: Optional[str], tags: Optional[List[str]]) -> bool:
        """Update a post (only by author)"""
        try:
            access_token = await self._ensure_pleroma_user(user_email)
            
            status = await self.pleroma_client.get_status(post_id, access_token)
            user = await self.users_collection.find_one({"email": user_email})
            
            if status["account"]["id"] != user.get("pleroma_account_id"):
                return False
            
            if content is not None:
                if tags is not None:
                    formatted_content = self._format_post_content(content, tags)
                else:
                    # Keep existing tags
                    existing_tags = self._extract_tags_from_content(status.get("content", ""))
                    formatted_content = self._format_post_content(content, existing_tags)
            else:
                return True  # Nothing to update
            
            # Update status
            await self.pleroma_client.update_status(
                access_token=access_token,
                status_id=post_id,
                content=formatted_content
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating post {post_id}: {e}", exc_info=True)
            return False
    
    async def delete_post(self, post_id: str, user_email: str) -> bool:
        """Delete a post (only by author)"""
        try:
            access_token = await self._ensure_pleroma_user(user_email)
            
            # Get current post to verify ownership
            status = await self.pleroma_client.get_status(post_id, access_token)
            user = await self.users_collection.find_one({"email": user_email})
            
            if status["account"]["id"] != user.get("pleroma_account_id"):
                return False
            
            # Delete status
            await self.pleroma_client.delete_status(access_token, post_id)
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting post {post_id}: {e}", exc_info=True)
            return False
    
    async def toggle_like(self, post_id: str, user_email: str) -> Dict[str, Any]:
        """Toggle like on a post"""
        try:
            access_token = await self._ensure_pleroma_user(user_email)
            
            # Get current status to check if already liked
            status = await self.pleroma_client.get_status(post_id, access_token)
            
            if not status:
                raise ValueError("Post not found")
            
            if status.get("favourited"):
                # Unlike
                await self.pleroma_client.unfavourite_status(access_token, post_id)
                return {"liked": False, "action": "unliked"}
            else:
                # Like
                await self.pleroma_client.favourite_status(access_token, post_id)
                return {"liked": True, "action": "liked"}
                
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error toggling like: {e}", exc_info=True)
            raise
    
    async def add_comment(self, post_id: str, user_email: str, content: str, parent_comment_id: Optional[str] = None) -> str:
        """Add a comment to a post (reply to status)"""
        try:
            access_token = await self._ensure_pleroma_user(user_email)
            
            # Verify parent post exists
            parent_status = await self.pleroma_client.get_status(post_id, access_token)
            if not parent_status:
                raise ValueError("Post not found")
            
            # Escape hashtags in comment content so Pleroma doesn't convert them to links
            escaped_content = self._escape_hashtags_for_pleroma(content)
            
            # Create reply
            reply_to_id = parent_comment_id if parent_comment_id else post_id
            
            reply = await self.pleroma_client.create_status(
                access_token=access_token,
                content=escaped_content,
                visibility="public",
                in_reply_to_id=reply_to_id
            )
            
            logger.info(f"Added comment {reply['id']} to post {post_id}")
            return reply["id"]
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error adding comment: {e}", exc_info=True)
            raise
    
    async def get_comments(self, post_id: str) -> List[Dict[str, Any]]:
        """Get all comments for a post"""
        try:
            # Get status context (replies)
            context = await self.pleroma_client.get_status_context(post_id)
            
            # Transform descendants (replies) to comment format
            comments = []
            for status in context.get("descendants", []):
                account = status.get("account", {})
                raw_content = status.get("content", "")
                sanitized_content = self._sanitize_html(raw_content)
                
                author_display_name = account.get("display_name")
                if not author_display_name:
                    author_username = account.get("username", "Unknown")
                    author_display_name = _username_to_display_name(author_username)
                
                comments.append({
                    "id": status["id"],
                    "post_id": post_id,
                    "author_email": account.get("acct", "unknown"),
                    "author_name": author_display_name,
                    "author_profile_picture": account.get("avatar"),
                    "author_badge": None,
                    "content": sanitized_content,
                    "parent_comment_id": status.get("in_reply_to_id"),
                    "likes_count": status.get("favourites_count", 0),
                    "created_at": status.get("created_at"),
                    "updated_at": status.get("edited_at") or status.get("created_at"),
                    "is_deleted": False
                })
            
            return comments
            
        except Exception as e:
            logger.error(f"Error getting comments: {e}", exc_info=True)
            return []
    
    async def delete_comment(self, comment_id: str, user_email: str) -> bool:
        """Delete a comment (only by author)"""
        try:
            access_token = await self._ensure_pleroma_user(user_email)
            
            # Get comment to verify ownership
            status = await self.pleroma_client.get_status(comment_id, access_token)
            user = await self.users_collection.find_one({"email": user_email})
            
            if status["account"]["id"] != user.get("pleroma_account_id"):
                return False
            
            # Delete status
            await self.pleroma_client.delete_status(access_token, comment_id)
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting comment {comment_id}: {e}", exc_info=True)
            return False
    
    async def record_share(self, post_id: str, user_email: str) -> Dict[str, Any]:
        """Record a share action (reblog on Pleroma) and return shareable URLs"""
        try:
            access_token = await self._ensure_pleroma_user(user_email)
            
            # Verify post exists
            status = await self.pleroma_client.get_status(post_id, access_token)
            if not status:
                raise ValueError("Post not found")
            
            # Reblog the status
            await self.pleroma_client.reblog_status(access_token, post_id)
            
            # Generate shareable URLs
            # Use our API URL instead of Pleroma's URL so it goes through our deep link handler
            api_base_url = os.getenv("API_BASE_URL", "https://api.evra.opengig.work")
            web_url = f"{api_base_url}/{post_id}"
            deep_link = f"evra://{post_id}"
            
            logger.info(f"Generated share URLs for post_id: {post_id}")
            logger.debug(f"API_BASE_URL: {api_base_url}")
            logger.debug(f"Web URL: {web_url}")
            logger.debug(f"Deep link: {deep_link}")
            
            return {
                "success": True,
                "web_url": web_url,
                "deep_link": deep_link
            }
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error recording share: {e}", exc_info=True)
            raise
    
    async def clear_all_user_data(self, user_email: str) -> Dict[str, Any]:
        """
        Remove all posts and comments from a user in Pleroma.
        Does NOT delete the user account itself.
        Also cleans up related MongoDB collections (post_categories, post_views).
        """
        try:
            user = await self.users_collection.find_one({"email": user_email})
            if not user:
                raise ValueError("User not found in database")
            
            if not user.get("pleroma_account_id"):
                logger.info(f"User {user_email} has no Pleroma account, nothing to clear")
                return {
                    "success": True,
                    "posts_deleted": 0,
                    "comments_deleted": 0,
                    "total_deleted": 0,
                    "message": "User has no Pleroma account"
                }
            
            access_token = await self._ensure_pleroma_user(user_email)
            account_id = user["pleroma_account_id"]
            
            logger.info(f"Starting to clear all data for user {user_email} (account_id: {account_id})")
            
            all_statuses = await self.pleroma_client.get_all_account_statuses(
                account_id=account_id,
                access_token=access_token,
                limit=40
            )
            
            if not all_statuses:
                logger.info(f"No statuses found for user {user_email}")
                return {
                    "success": True,
                    "posts_deleted": 0,
                    "comments_deleted": 0,
                    "total_deleted": 0,
                    "message": "No posts or comments found"
                }
            
            logger.info(f"Found {len(all_statuses)} statuses to delete for user {user_email}")
            
            posts_deleted = 0
            comments_deleted = 0
            deleted_post_ids = []
            errors = []
            
            for status in all_statuses:
                status_id = status["id"]
                is_reply = status.get("in_reply_to_id") is not None
                
                try:
                    await self.pleroma_client.delete_status(access_token, status_id)
                    
                    if is_reply:
                        comments_deleted += 1
                    else:
                        posts_deleted += 1
                        deleted_post_ids.append(status_id)
                    
                    logger.debug(f"Deleted status {status_id} (type: {'comment' if is_reply else 'post'})")
                    
                except Exception as e:
                    error_msg = f"Failed to delete status {status_id}: {str(e)}"
                    logger.error(error_msg)
                    errors.append(error_msg)
            
            if deleted_post_ids:
                try:
                    result_categories = await self.post_categories_collection.delete_many(
                        {"post_id": {"$in": deleted_post_ids}}
                    )
                    logger.info(f"Cleaned up {result_categories.deleted_count} post categories")
                    
                    result_views = await self.post_views_collection.delete_many(
                        {"post_id": {"$in": deleted_post_ids}}
                    )
                    logger.info(f"Cleaned up {result_views.deleted_count} post views")
                    
                except Exception as e:
                    logger.error(f"Error cleaning up MongoDB collections: {e}")
            
            logger.info(
                f"Completed clearing data for user {user_email}: "
                f"{posts_deleted} posts, {comments_deleted} comments deleted"
            )
            
            return {
                "success": True,
                "posts_deleted": posts_deleted,
                "comments_deleted": comments_deleted,
                "total_deleted": posts_deleted + comments_deleted,
                "errors": errors if errors else None,
                "message": f"Successfully deleted {posts_deleted} posts and {comments_deleted} comments"
            }
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error clearing user data for {user_email}: {e}", exc_info=True)
            raise Exception(f"Failed to clear user data: {str(e)}")


_community_service_instance = None


def get_community_service() -> CommunityServicePleroma:
    """Get or create CommunityServicePleroma instance (singleton)"""
    global _community_service_instance
    
    if _community_service_instance is None:
        _community_service_instance = CommunityServicePleroma()
    
    return _community_service_instance

