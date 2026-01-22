from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import logging
from bson import ObjectId

from app.services.backend_services.db import get_db

logger = logging.getLogger(__name__)

class CommunityService:
    def __init__(self):
        self.db = get_db()
        self.posts_collection = self.db["community_posts"]
        self.likes_collection = self.db["community_likes"]
        self.comments_collection = self.db["community_comments"]
        self.shares_collection = self.db["community_shares"]
        self.users_collection = self.db["users"]
        self.preferences_collection = self.db["preferences"]
    
    async def _get_user_info(self, user_email: str) -> Dict[str, Any]:
        """Get user information including badge from preferences"""
        user = await self.users_collection.find_one({"email": user_email})
        if not user:
            return {
                "name": "Unknown User",
                "profile_picture": None,
                "badge": None
            }
        
        prefs = await self.preferences_collection.find_one({"email": user_email})
        badge = None
        if prefs and prefs.get("healthGoals"):
            goals = prefs.get("healthGoals", [])
            if goals:
                badge = goals[0]
        
        return {
            "name": user.get("name", "Unknown User"),
            "profile_picture": user.get("profile_picture"),
            "badge": badge
        }
    
    async def create_post(self, user_email: str, content: str, tags: List[str]) -> str:
        """Create a new community post"""
        try:
            user_info = await self._get_user_info(user_email)
            
            post = {
                "author_email": user_email,
                "author_name": user_info["name"],
                "author_profile_picture": user_info["profile_picture"],
                "author_badge": user_info["badge"],
                "content": content,
                "tags": [tag.lower().strip() for tag in tags if tag.strip()],
                "likes_count": 0,
                "comments_count": 0,
                "shares_count": 0,
                "views_count": 0,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "is_deleted": False
            }
            
            result = await self.posts_collection.insert_one(post)
            post_id = str(result.inserted_id)
            logger.info(f"Created post {post_id} by {user_email}")
            return post_id
        except Exception as e:
            logger.error(f"Error creating post: {e}", exc_info=True)
            raise
    
    async def get_post(self, post_id: str, viewer_email: Optional[str] = None, increment_view: bool = True) -> Optional[Dict[str, Any]]:
        """Get a single post by ID"""
        try:
            post = await self.posts_collection.find_one({
                "_id": ObjectId(post_id),
                "is_deleted": False
            })
            
            if not post:
                return None
            
            if increment_view:
                await self.posts_collection.update_one(
                    {"_id": ObjectId(post_id)},
                    {"$inc": {"views_count": 1}}
                )
                post["views_count"] = post.get("views_count", 0) + 1
            
            is_liked = False
            if viewer_email:
                like = await self.likes_collection.find_one({
                    "post_id": post_id,
                    "user_email": viewer_email
                })
                is_liked = like is not None
            
            post["id"] = str(post["_id"])
            post.pop("_id", None)
            post["is_liked_by_user"] = is_liked
            return post
        except Exception as e:
            logger.error(f"Error getting post {post_id}: {e}", exc_info=True)
            return None
    
    async def get_feed(
        self, 
        page: int = 1, 
        page_size: int = 20,
        viewer_email: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get paginated feed of posts"""
        try:
            skip = (page - 1) * page_size
            
            cursor = self.posts_collection.find(
                {"is_deleted": False}
            ).sort("created_at", -1).skip(skip).limit(page_size)
            
            posts = await cursor.to_list(length=page_size)
            total = await self.posts_collection.count_documents({"is_deleted": False})
            
            if viewer_email:
                post_ids = [str(p["_id"]) for p in posts]
                likes = await self.likes_collection.find({
                    "post_id": {"$in": post_ids},
                    "user_email": viewer_email
                }).to_list(length=None)
                liked_post_ids = {like["post_id"] for like in likes}
                
                for post in posts:
                    post_id = str(post["_id"])
                    post["is_liked_by_user"] = post_id in liked_post_ids
            else:
                for post in posts:
                    post["is_liked_by_user"] = False
            
            for post in posts:
                post["id"] = str(post["_id"])
                post.pop("_id", None)
            
            return {
                "posts": posts,
                "total": total,
                "page": page,
                "page_size": page_size,
                "has_more": skip + len(posts) < total
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
        viewer_email: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get posts by current user or specific user"""
        try:
            skip = (page - 1) * page_size
            
            cursor = self.posts_collection.find({
                "author_email": user_email,
                "is_deleted": False
            }).sort("created_at", -1).skip(skip).limit(page_size)
            
            posts = await cursor.to_list(length=page_size)
            total = await self.posts_collection.count_documents({
                "author_email": user_email,
                "is_deleted": False
            })
            
            if viewer_email:
                post_ids = [str(p["_id"]) for p in posts]
                likes = await self.likes_collection.find({
                    "post_id": {"$in": post_ids},
                    "user_email": viewer_email
                }).to_list(length=None)
                liked_post_ids = {like["post_id"] for like in likes}
                
                for post in posts:
                    post_id = str(post["_id"])
                    post["is_liked_by_user"] = post_id in liked_post_ids
            else:
                for post in posts:
                    post["is_liked_by_user"] = False
            
            for post in posts:
                post["id"] = str(post["_id"])
                post.pop("_id", None)
            
            return {
                "posts": posts,
                "total": total,
                "page": page,
                "page_size": page_size,
                "has_more": skip + len(posts) < total
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
            post = await self.posts_collection.find_one({"_id": ObjectId(post_id), "is_deleted": False})
            if not post:
                return False
            if post["author_email"] != user_email:
                return False
            
            update_data = {"updated_at": datetime.now(timezone.utc)}
            if content is not None:
                update_data["content"] = content
            if tags is not None:
                update_data["tags"] = [tag.lower().strip() for tag in tags if tag.strip()]
            
            result = await self.posts_collection.update_one(
                {"_id": ObjectId(post_id)},
                {"$set": update_data}
            )
            
            return result.matched_count > 0
        except Exception as e:
            logger.error(f"Error updating post {post_id}: {e}", exc_info=True)
            return False
    
    async def delete_post(self, post_id: str, user_email: str) -> bool:
        """Soft delete a post (only by author)"""
        try:
            post = await self.posts_collection.find_one({"_id": ObjectId(post_id), "is_deleted": False})
            if not post:
                return False
            if post["author_email"] != user_email:
                return False
            
            result = await self.posts_collection.update_one(
                {"_id": ObjectId(post_id)},
                {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc)}}
            )
            
            return result.matched_count > 0
        except Exception as e:
            logger.error(f"Error deleting post {post_id}: {e}", exc_info=True)
            return False
    
    async def toggle_like(self, post_id: str, user_email: str) -> Dict[str, Any]:
        """Toggle like on a post"""
        try:
            post = await self.posts_collection.find_one({"_id": ObjectId(post_id), "is_deleted": False})
            if not post:
                raise ValueError("Post not found")
            
            existing_like = await self.likes_collection.find_one({
                "post_id": post_id,
                "user_email": user_email
            })
            
            if existing_like:
                await self.likes_collection.delete_one({"_id": existing_like["_id"]})
                await self.posts_collection.update_one(
                    {"_id": ObjectId(post_id)},
                    {"$inc": {"likes_count": -1}}
                )
                return {"liked": False, "action": "unliked"}
            else:
                await self.likes_collection.insert_one({
                    "post_id": post_id,
                    "user_email": user_email,
                    "created_at": datetime.now(timezone.utc)
                })
                await self.posts_collection.update_one(
                    {"_id": ObjectId(post_id)},
                    {"$inc": {"likes_count": 1}}
                )
                return {"liked": True, "action": "liked"}
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error toggling like: {e}", exc_info=True)
            raise
    
    async def add_comment(self, post_id: str, user_email: str, content: str, parent_comment_id: Optional[str] = None) -> str:
        """Add a comment to a post"""
        try:
            post = await self.posts_collection.find_one({"_id": ObjectId(post_id), "is_deleted": False})
            if not post:
                raise ValueError("Post not found")
            
            user_info = await self._get_user_info(user_email)
            
            comment = {
                "post_id": post_id,
                "author_email": user_email,
                "author_name": user_info["name"],
                "author_profile_picture": user_info["profile_picture"],
                "author_badge": user_info["badge"],
                "content": content,
                "parent_comment_id": parent_comment_id,
                "likes_count": 0,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "is_deleted": False
            }
            
            result = await self.comments_collection.insert_one(comment)
            comment_id = str(result.inserted_id)
            
            await self.posts_collection.update_one(
                {"_id": ObjectId(post_id)},
                {"$inc": {"comments_count": 1}}
            )
            
            logger.info(f"Added comment {comment_id} to post {post_id}")
            return comment_id
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error adding comment: {e}", exc_info=True)
            raise
    
    async def get_comments(self, post_id: str) -> List[Dict[str, Any]]:
        """Get all comments for a post"""
        try:
            cursor = self.comments_collection.find({
                "post_id": post_id,
                "is_deleted": False
            }).sort("created_at", 1)
            
            comments = await cursor.to_list(length=None)
            for comment in comments:
                comment["id"] = str(comment["_id"])
                comment.pop("_id", None)
            
            return comments
        except Exception as e:
            logger.error(f"Error getting comments: {e}", exc_info=True)
            return []
    
    async def delete_comment(self, comment_id: str, user_email: str) -> bool:
        """Delete a comment (only by author)"""
        try:
            comment = await self.comments_collection.find_one({"_id": ObjectId(comment_id), "is_deleted": False})
            if not comment:
                return False
            if comment["author_email"] != user_email:
                return False
            
            result = await self.comments_collection.update_one(
                {"_id": ObjectId(comment_id)},
                {"$set": {"is_deleted": True, "content": "[Comment deleted]", "updated_at": datetime.now(timezone.utc)}}
            )
            
            if result.matched_count > 0:
                await self.posts_collection.update_one(
                    {"_id": ObjectId(comment["post_id"])},
                    {"$inc": {"comments_count": -1}}
                )
            
            return result.matched_count > 0
        except Exception as e:
            logger.error(f"Error deleting comment {comment_id}: {e}", exc_info=True)
            return False
    
    async def record_share(self, post_id: str, user_email: str) -> bool:
        """Record a share action and increment share count"""
        try:
            post = await self.posts_collection.find_one({"_id": ObjectId(post_id), "is_deleted": False})
            if not post:
                raise ValueError("Post not found")
            
            result = await self.posts_collection.update_one(
                {"_id": ObjectId(post_id)},
                {"$inc": {"shares_count": 1}}
            )
            
            if result.matched_count > 0:
                await self.shares_collection.insert_one({
                    "post_id": post_id,
                    "user_email": user_email,
                    "created_at": datetime.now(timezone.utc)
                })
            
            return True
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error recording share: {e}", exc_info=True)
            return False
    


_community_service_instance = None

def get_community_service() -> CommunityService:
    """Get or create CommunityService instance (singleton)"""
    global _community_service_instance
    
    if _community_service_instance is None:
        _community_service_instance = CommunityService()
    
    return _community_service_instance

