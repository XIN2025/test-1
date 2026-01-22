"""
Memory service for managing user-specific memories using Mem0.
Provides persistent memory storage across chat sessions.
"""
import logging
import asyncio
from functools import partial
from typing import List, Dict, Any, Optional
from datetime import datetime
from mem0 import MemoryClient
from app.config import MEM0_API_KEY, MONGODB_URI, MEM0_STORAGE_TYPE
from app.services.backend_services.db import get_db

logger = logging.getLogger(__name__)

_memory_client = None


def get_memory_client() -> Optional[MemoryClient]:
    """Get or create Mem0 client instance (singleton)"""
    global _memory_client
    
    if _memory_client is not None:
        return _memory_client
    
    try:
        # Configure Mem0 based on whether API key is provided (hosted) or not (self-hosted)
        if MEM0_API_KEY:
            # Hosted Mem0 platform
            _memory_client = MemoryClient(api_key=MEM0_API_KEY)
            logger.info("✅ [MEMORY] Initialized Mem0 client with hosted platform")
        else:
            if not MONGODB_URI:
                raise RuntimeError("Mem0 self-hosted mode requires MONGODB_URI to be configured")
            config = {
                "storage": {
                    "type": MEM0_STORAGE_TYPE,
                    "connection_string": MONGODB_URI,
                }
            }
            _memory_client = MemoryClient(config=config)
            logger.info(f"✅ [MEMORY] Initialized Mem0 client with {MEM0_STORAGE_TYPE} storage")
        
        return _memory_client
    except Exception as e:
        logger.error(f"❌ [MEMORY] Failed to initialize Mem0 client: {e}", exc_info=True)
        raise


class MemoryService:
    """Service for managing user memories using Mem0"""
    
    def __init__(self):
        self.client = get_memory_client()
    
    def _ensure_client(self) -> bool:
        """Ensure client is available, return False if not"""
        if self.client is None:
            logger.warning("⚠️ [MEMORY] Mem0 client not available, memory operations disabled")
            return False
        return True
    
    async def get_memories(
        self, 
        user_email: str, 
        query: str, 
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant memories for a user based on current query.
        Uses both semantic search AND recent memories for comprehensive recall.
        
        Args:
            user_email: User identifier (used as agent_id in Mem0)
            query: Current query to search memories for
            limit: Maximum number of memories to retrieve
            
        Returns:
            List of memory dictionaries with 'memory' and 'metadata' fields
        """
        if not self._ensure_client():
            return []
        
        try:
            all_memories = []
            
            try:
                get_all_func = partial(
                    self.client.get_all,
                    user_id=user_email,
                    filters={"user_id": user_email}  
                )
                all_user_memories = await asyncio.to_thread(get_all_func)
                
                if isinstance(all_user_memories, dict):
                    if 'results' in all_user_memories:
                        all_user_memories = all_user_memories['results']
                    elif 'data' in all_user_memories:
                        all_user_memories = all_user_memories['data']
                
                if isinstance(all_user_memories, list):
                    all_memories = all_user_memories
                    logger.info(f"📚 [MEMORY] Retrieved {len(all_user_memories)} total memories for user {user_email}")
                    
                    for i, mem in enumerate(all_user_memories[:2]):
                        mem_content = self._extract_memory_content(mem)
                        preview = mem_content[:80] + "..." if len(mem_content) > 80 else mem_content
                        logger.debug(f"🔍 [MEMORY] Sample {i+1}: {preview}")
            except Exception as get_all_error:
                logger.warning(f"⚠️ [MEMORY] Could not get all memories: {get_all_error}")
            
            if query and query.strip():
                try:
                    search_func = partial(
                        self.client.search,
                        query=query,
                        user_id=user_email,
                        filters={"user_id": user_email},  
                        limit=limit * 2 
                    )
                    search_memories = await asyncio.to_thread(search_func)
                    
                    if isinstance(search_memories, dict):
                        if 'results' in search_memories:
                            search_memories = search_memories['results']
                        elif 'data' in search_memories:
                            search_memories = search_memories['data']
                    
                    if isinstance(search_memories, list):
                        logger.info(f"🔍 [MEMORY] Search found {len(search_memories)} relevant memories for query")
                        seen = set()
                        combined = []
                        
                        for mem in search_memories + all_memories:
                            content = self._extract_memory_content(mem)
                            if content and content not in seen:
                                seen.add(content)
                                combined.append(mem)
                        
                        all_memories = combined
                except Exception as search_error:
                    logger.warning(f"⚠️ [MEMORY] Search failed: {search_error}")
            
            result_count = min(len(all_memories), limit * 3)
            logger.info(f"✅ [MEMORY] Returning {result_count} memories for user {user_email}")
            return all_memories[:result_count]
            
        except Exception as e:
            logger.error(f"❌ [MEMORY] Error retrieving memories for {user_email}: {e}", exc_info=True)
            return []
    
    def _extract_memory_content(self, memory: Any) -> str:
        """Helper to extract text content from memory object"""
        if isinstance(memory, str):
            return memory
        elif isinstance(memory, dict):
            return (
                memory.get("memory", "") or 
                memory.get("content", "") or 
                memory.get("text", "") or
                memory.get("data", "") or
                str(memory)
            )
        elif hasattr(memory, 'memory'):
            return getattr(memory, 'memory', "")
        elif hasattr(memory, 'content'):
            return getattr(memory, 'content', "")
        return str(memory)
    
    async def add_memory(
        self, 
        user_email: str, 
        messages: List[Dict[str, str]]
    ) -> bool:
        """
        Store conversation memories after each chat interaction.
        
        Args:
            user_email: User identifier (used as agent_id in Mem0)
            messages: List of message dictionaries with 'role' and 'content' keys
            
        Returns:
            True if successful, False otherwise
        """
        if not self._ensure_client():
            return False
        
        if not messages or len(messages) == 0:
            logger.warning("⚠️ [MEMORY] No messages provided to store")
            return False
        
        try:
            # Convert messages to Mem0 format if needed
            formatted_messages = []
            for msg in messages:
                if isinstance(msg, dict):
                    # Ensure proper format: {"role": "user"/"assistant", "content": "..."}
                    role = msg.get("role") or msg.get("user") or "user"
                    content = msg.get("content") or msg.get("assistant") or msg.get("message", "")
                    
                    if role.lower() in ["user", "human"]:
                        role = "user"
                    elif role.lower() in ["assistant", "ai", "bot"]:
                        role = "assistant"
                    else:
                        role = "user"
                    
                    if content and isinstance(content, str) and len(content.strip()) > 3:
                        formatted_messages.append({
                            "role": role,
                            "content": content.strip()
                        })
            
            if not formatted_messages or len(formatted_messages) < 2:
                logger.warning(f"⚠️ [MEMORY] Insufficient messages to store: {len(formatted_messages)}")
                return False
            
            messages_to_send = formatted_messages[-2:]
            
            for msg in messages_to_send:
                if msg["role"] not in ["user", "assistant"]:
                    logger.error(f"❌ [MEMORY] Invalid role: {msg['role']}")
                    return False
                if not msg["content"] or len(msg["content"]) < 3:
                    logger.error(f"❌ [MEMORY] Invalid content for role {msg['role']}")
                    return False
            
            logger.info(f"🔍 [MEMORY] Storing message pair for {user_email}")
            
            metadata = {
                "user_id": user_email,
                "category": "preferences",
                "timestamp": str(datetime.now()),
                "type": "conversation"
            }
            
            infer_instructions = """Extract and remember:
            - Health routines, exercise programs, workout plans, physical therapy routines
            - Health goals, concerns, conditions, symptoms, body areas of focus
            - Dietary preferences, restrictions, meal plans, nutrition goals, eating patterns
            - Family information, dependents, family health history, caregiver responsibilities
            - Time preferences, daily schedules, routine timing, activity patterns
            - Healthcare memberships, gym memberships, wellness programs, subscriptions
            - Medications, supplements, treatments currently following
            - Sleep patterns, stress levels, mental health practices
            - Any other lifestyle preferences, habits, or personal health details"""
            
            try:
                add_func = partial(
                    self.client.add,
                    messages=messages_to_send,
                    user_id=user_email,
                    metadata=metadata,
                    infer=True,  
                    instructions=infer_instructions
                )
                result = await asyncio.to_thread(add_func)
                logger.info(f"✅ [MEMORY] Stored conversation pair as memories for user {user_email}")
                logger.debug(f"🔍 [MEMORY] Add result: {result}")
                return True
            except Exception as add_error:
                logger.error(f"❌ [MEMORY] Mem0 API error for {user_email}: {add_error}")
                logger.error(f"❌ [MEMORY] Messages that failed: {messages_to_send}")
                return False
        except Exception as e:
            logger.error(f"❌ [MEMORY] Error preparing memories for {user_email}: {e}", exc_info=True)
            return False
    
    async def get_user_profile(self, user_email: str) -> Dict[str, Any]:
        """
        Retrieve user profile/facts built from all interactions.
        
        Args:
            user_email: User identifier
            
        Returns:
            Dictionary containing user profile information
        """
        if not self._ensure_client():
            return {}
        
        try:
            # Get all memories for the user to build profile
            # Run in thread pool since it's synchronous
            get_all_func = partial(
                self.client.get_all,
                user_id=user_email,
                filters={"user_id": user_email}  
            )
            all_memories = await asyncio.to_thread(get_all_func)
            
            profile = {
                "user_id": user_email,
                "total_memories": len(all_memories),
                "memories": all_memories
            }
            
            logger.info(f"✅ [MEMORY] Retrieved profile for user {user_email} with {len(all_memories)} memories")
            return profile
        except Exception as e:
            logger.error(f"❌ [MEMORY] Error retrieving profile for {user_email}: {e}", exc_info=True)
            return {}
    
    async def search_memories(
        self, 
        user_email: str, 
        query: str, 
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search memories by relevance (alias for get_memories for consistency).
        
        Args:
            user_email: User identifier
            query: Search query
            limit: Maximum number of results
            
        Returns:
            List of relevant memories
        """
        return await self.get_memories(user_email, query, limit)
    
    async def delete_user_memories(self, user_email: str) -> bool:
        """
        Delete all memories for a user (used in account deletion).
        
        Args:
            user_email: User identifier
            
        Returns:
            True if successful, False otherwise
        """
        if not self._ensure_client():
            return False
        
        try:
            db = get_db()
            collection_names = await db.list_collection_names()
            total_deleted = 0
            
            for collection_name in collection_names:
                # Target likely Mem0 collections
                if not (
                    collection_name in {"memories", "mem0_memories", "mem0_agents"}
                    or collection_name.startswith("mem0")
                    or collection_name.startswith("memory")
                ):
                    continue
                
                collection = db[collection_name]
                result = await collection.delete_many({
                    "$or": [
                        {"user_id": user_email},
                        {"agent_id": user_email},
                        {"metadata.user_id": user_email}
                    ]
                })
                deleted_count = result.deleted_count
                if deleted_count > 0:
                    total_deleted += deleted_count
                    logger.info(f"✅ [MEMORY] Deleted {deleted_count} memories from {collection_name} for user {user_email}")
            
            if total_deleted == 0:
                logger.warning(f"⚠️ [MEMORY] No memories found to delete for user {user_email}")
            else:
                logger.info(f"✅ [MEMORY] Deleted {total_deleted} total memories for user {user_email}")
            return True
        except Exception as e:
            logger.error(f"❌ [MEMORY] Error deleting memories for {user_email}: {e}", exc_info=True)
            return False


_memory_service_instance = None


def get_memory_service() -> MemoryService:
    """Get or create MemoryService instance (singleton)"""
    global _memory_service_instance
    
    if _memory_service_instance is None:
        _memory_service_instance = MemoryService()
    
    return _memory_service_instance

