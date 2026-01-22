"""
Delete Account Service - Handles secure account deletion with grace period and email confirmation.
"""
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List
import logging
import asyncio

from app.services.backend_services.db import get_db
from app.schemas.backend.delete_account import (
    DeleteAccountStatus,
    DeleteAccountRequest,
    DeleteAccountConfirmationRequest,
    DeleteAccountCancelRequest,
)
from app.exceptions import (
    UserNotFoundError,
    AuthenticationError,
    ValidationException,
    RateLimitError,
    DatabaseError,
)
from app.services.backend_services.email_utils import send_email, is_demo_account
from app.services.ai_services.memory_service import get_memory_service
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)


async def process_scheduled_deletions_job():
    """
    Background job to process scheduled account deletions.
    This job is called periodically by the scheduler to delete accounts
    that have passed their permanent_deletion_at date.
    """
    try:
        delete_service = get_delete_account_service()
        result = await delete_service.process_scheduled_deletions()
        
        if result['processed'] > 0:
            logger.info(
                f"[DELETE_ACCOUNT_JOB] Processed {result['processed']} deletion(s). "
                f"Succeeded: {result['succeeded']}, Failed: {result['failed']}"
            )
    except Exception as e:
        logger.error(
            f"[DELETE_ACCOUNT_JOB] Critical error in scheduled deletion job: {type(e).__name__}: {str(e)}",
            exc_info=True
        )


class DeleteAccountService:
    """Service for managing account deletion"""
    
    GRACE_PERIOD_DAYS = 7  # Grace period before permanent deletion
    TOKEN_EXPIRY_HOURS = 24  # Confirmation token expires after 24 hours
    
    # Collections that store user data (to be deleted)
    USER_DATA_COLLECTIONS = [
        "users",
        "health_data",
        "health_alerts",
        "reviews",
        "goals",
        "action_items",
        "nudges",
        "preferences",
        "community_posts",
        "community_likes",
        "community_comments",
        "community_shares",
    ]
    
    def __init__(self):
        self.db = get_db()
        self.deletion_requests_collection = self.db["account_deletion_requests"]
        self.users_collection = self.db["users"]
        self._rate_limit_cache: Dict[str, list] = {}
    
    def _generate_confirmation_token(self, user_email: str) -> str:
        """Generate a secure confirmation token"""
        # Create a unique token using email + timestamp + random
        timestamp = datetime.now(timezone.utc).isoformat()
        random_part = secrets.token_urlsafe(32)
        token_data = f"{user_email}:{timestamp}:{random_part}"
        token = hashlib.sha256(token_data.encode()).hexdigest()
        return token
    
    def _generate_cancellation_token(self, user_email: str) -> str:
        """Generate a secure cancellation token"""
        timestamp = datetime.now(timezone.utc).isoformat()
        random_part = secrets.token_urlsafe(32)
        token_data = f"cancel:{user_email}:{timestamp}:{random_part}"
        token = hashlib.sha256(token_data.encode()).hexdigest()
        return token
    
    async def _check_rate_limit(self, user_email: str) -> None:
        """Check if user has exceeded rate limits for deletion requests"""
        now = datetime.now(timezone.utc)
        one_hour_ago = now - timedelta(hours=1)
        
        # Check deletion requests in last hour
        recent_requests = await self.deletion_requests_collection.count_documents({
            "user_email": user_email,
            "created_at": {"$gte": one_hour_ago},
            "status": {"$in": [DeleteAccountStatus.PENDING.value, DeleteAccountStatus.CONFIRMED.value]}
        })
        
        if recent_requests >= 3:  # Max 3 deletion requests per hour
            logger.warning(f"[DELETE_ACCOUNT] Rate limit exceeded for {user_email}: {recent_requests} requests in last hour")
            raise RateLimitError(
                "Too many deletion requests. Please wait before trying again.",
                details={"limit": 3, "period": "hour", "current_count": recent_requests}
            )
    
    async def _validate_user(self, user_email: str) -> Dict:
        """Validate that user exists and is verified"""
        user = await self.users_collection.find_one({"email": user_email})
        
        if not user:
            logger.warning(f"[DELETE_ACCOUNT] User not found: {user_email}")
            raise UserNotFoundError(f"User not found: {user_email}")
        
        if not user.get("verified", False):
            logger.warning(f"[DELETE_ACCOUNT] User not verified: {user_email}")
            raise AuthenticationError(
                "User is not verified. Please verify your email before requesting account deletion.",
                details={"email": user_email, "verified": False}
            )
        
        return user
    
    async def _check_existing_deletion_request(self, user_email: str) -> Optional[Dict]:
        """Check if there's an existing pending or confirmed deletion request"""
        existing = await self.deletion_requests_collection.find_one({
            "user_email": user_email,
            "status": {"$in": [DeleteAccountStatus.PENDING.value, DeleteAccountStatus.CONFIRMED.value]}
        })
        return existing
    
    async def get_deletion_status(self, user_email: str) -> Optional[Dict]:
        """Get the current deletion request status for a user (most recent request)"""
        deletion_request = await self.deletion_requests_collection.find_one(
            {"user_email": user_email},
            sort=[("created_at", -1)]  # Get most recent
        )
        
        if deletion_request:
            deletion_request["id"] = str(deletion_request["_id"])
            del deletion_request["_id"]
        
        return deletion_request
    
    async def initiate_deletion(
        self, 
        request: DeleteAccountRequest,
        ip_address: Optional[str] = None
    ) -> Dict:
        """
        Initiate account deletion process.
        Creates a deletion request and sends confirmation email.
        """
        user_email = request.user_email
        logger.info(f"[DELETE_ACCOUNT] Initiation request from {user_email} (IP: {ip_address})")
        
        try:
            if is_demo_account(user_email):
                logger.warning(f"[DELETE_ACCOUNT] Deletion attempt blocked for demo account: {user_email}")
                # Return success=False with explanation instead of raising error
                return {
                    "success": False,
                    "message": "This is a demo account created for app review purposes and cannot be deleted. ",
                    "is_demo_account": True,
                }
            
            # Step 1: Validate user
            user = await self._validate_user(user_email)
            
            # Step 2: Check rate limits
            await self._check_rate_limit(user_email)
            
            # Step 3: Check for existing deletion request
            existing_request = await self._check_existing_deletion_request(user_email)
            if existing_request:
                status = existing_request.get("status")
                if status == DeleteAccountStatus.PENDING.value:
                    logger.info(f"[DELETE_ACCOUNT] Existing pending deletion request for {user_email}")
                    return {
                        "success": True,
                        "message": "A deletion request is already pending. Please check your email for the confirmation link.",
                        "status": "pending",
                        "deletion_scheduled_at": existing_request.get("scheduled_deletion_at"),
                        "confirmation_token": existing_request.get("confirmation_token"),
                        "cancellation_token": existing_request.get("cancellation_token"),
                    }
                elif status == DeleteAccountStatus.CONFIRMED.value:
                    logger.info(f"[DELETE_ACCOUNT] Account deletion already confirmed for {user_email}")
                    return {
                        "success": True,
                        "message": "Account deletion is already confirmed. Your account will be permanently deleted after the grace period.",
                        "status": "confirmed",
                        "permanent_deletion_at": existing_request.get("permanent_deletion_at"),
                        "grace_period_days": self.GRACE_PERIOD_DAYS,
                        "cancellation_token": existing_request.get("cancellation_token"),
                    }
            
            # Step 4: Generate confirmation and cancellation tokens
            confirmation_token = self._generate_confirmation_token(user_email)
            cancellation_token = self._generate_cancellation_token(user_email)
            
            # Step 5: Calculate deletion dates
            now = datetime.now(timezone.utc)
            token_expiry = now + timedelta(hours=self.TOKEN_EXPIRY_HOURS)
            scheduled_deletion = now + timedelta(days=self.GRACE_PERIOD_DAYS)
            
            # Step 6: Create deletion request document
            deletion_request = {
                "user_email": user_email,
                "status": DeleteAccountStatus.PENDING.value,
                "confirmation_token": confirmation_token,
                "cancellation_token": cancellation_token,
                "token_expires_at": token_expiry,
                "reason": request.reason,
                "scheduled_deletion_at": scheduled_deletion,
                "permanent_deletion_at": scheduled_deletion,  # Will be updated after confirmation
                "created_at": now,
                "updated_at": now,
                "ip_address": ip_address,
            }
            
            # Step 7: Store deletion request
            result = await self.deletion_requests_collection.insert_one(deletion_request)
            if not result.inserted_id:
                raise DatabaseError("Failed to create deletion request")
                
            logger.info(f"[DELETE_ACCOUNT] Deletion request created for {user_email} with ID: {result.inserted_id}")
            
            # Step 8: Send confirmation email with browser links
            try:
                import urllib.parse
                confirmation_url = f"https://api.evra.opengig.work/api/delete-account/confirm?email={urllib.parse.quote(user_email)}&token={confirmation_token}"
                cancellation_url = f"https://api.evra.opengig.work/api/delete-account/cancel?email={urllib.parse.quote(user_email)}&token={cancellation_token}"
                
                logger.info(f"[DELETE_ACCOUNT] Confirmation email sent to {user_email}")
                
                email_body = f"""
Dear User,

You have requested to delete your account. This action cannot be undone after the grace period.

To confirm account deletion, click this link (opens in your browser):
{confirmation_url}

This link will expire in {self.TOKEN_EXPIRY_HOURS} hours.

If you did not request this, you can cancel the deletion by clicking (opens in your browser):
{cancellation_url}

Your account will be permanently deleted on {scheduled_deletion.strftime('%Y-%m-%d %H:%M:%S UTC')} unless you cancel before then.

If you have any questions, please contact support.

Best regards,
The Evra Team
"""
                
                await asyncio.to_thread(
                    send_email,
                    user_email,
                    "Confirm Account Deletion",
                    email_body
                )
                
            except Exception as e:
                logger.error(f"[DELETE_ACCOUNT] Failed to send confirmation email to {user_email}: {str(e)}", exc_info=True)
                # Don't fail the request if email fails - user can request again
            
            return {
                "success": True,
                "message": "Account deletion request created. Please check your email to confirm.",
                "deletion_scheduled_at": scheduled_deletion.isoformat(),
                "permanent_deletion_at": scheduled_deletion.isoformat(),
                "grace_period_days": self.GRACE_PERIOD_DAYS,
                "confirmation_token": confirmation_token,
                "cancellation_token": cancellation_token,
            }
            
        except (UserNotFoundError, AuthenticationError, RateLimitError, DatabaseError, ValidationException):
            raise
        except Exception as e:
            logger.error(
                f"[DELETE_ACCOUNT] Unexpected error initiating deletion for {user_email}: {type(e).__name__}: {str(e)}",
                exc_info=True
            )
            raise DatabaseError(
                f"Failed to initiate account deletion: {str(e)}",
                details={"user_email": user_email, "error_type": type(e).__name__}
            )
    
    async def confirm_deletion(
        self,
        request: DeleteAccountConfirmationRequest
    ) -> Dict:
        """
        Confirm account deletion using email token.
        Moves account to grace period before permanent deletion.
        """
        user_email = request.user_email
        token = request.confirmation_token
        
        logger.info(f"[DELETE_ACCOUNT] Confirmation attempt for {user_email}")
        
        try:
            deletion_request = await self.deletion_requests_collection.find_one({
                "user_email": user_email,
                "confirmation_token": token,
                "status": DeleteAccountStatus.PENDING.value
            })
            
            if not deletion_request:
                logger.warning(f"[DELETE_ACCOUNT] Invalid or expired confirmation token for {user_email}")
                raise ValidationException(
                    "Invalid or expired confirmation token. Please request a new deletion.",
                    details={"user_email": user_email}
                )
            
            # Step 2: Check token expiry
            token_expires_at = deletion_request.get("token_expires_at")
            # Handle both datetime objects and ISO strings from MongoDB
            if token_expires_at:
                if isinstance(token_expires_at, str):
                    try:
                        from dateutil import parser as date_parser
                        if date_parser:
                            token_expires_at = date_parser.parse(token_expires_at)
                        else:
                            token_expires_at = datetime.fromisoformat(token_expires_at.replace('Z', '+00:00'))
                    except Exception:
                        logger.warning(f"[DELETE_ACCOUNT] Could not parse token_expires_at for {user_email}, treating as expired")
                        token_expires_at = None
                
                if token_expires_at and isinstance(token_expires_at, datetime):
                    if token_expires_at.tzinfo is None:
                        token_expires_at = token_expires_at.replace(tzinfo=timezone.utc)
                    if datetime.now(timezone.utc) > token_expires_at:
                        logger.warning(f"[DELETE_ACCOUNT] Expired confirmation token for {user_email}")
                        # Mark request as expired
                        await self.deletion_requests_collection.update_one(
                            {"_id": deletion_request["_id"]},
                            {"$set": {"status": DeleteAccountStatus.CANCELLED.value, "updated_at": datetime.now(timezone.utc)}}
                        )
                        raise ValidationException(
                            "Confirmation token has expired. Please request a new deletion.",
                            details={"user_email": user_email}
                        )
            
            # Step 3: Update deletion request to confirmed
            scheduled_deletion = deletion_request.get("scheduled_deletion_at")
            # Handle datetime from MongoDB (might be datetime or string)
            if isinstance(scheduled_deletion, str):
                from dateutil import parser as date_parser
                if date_parser:
                    scheduled_deletion = date_parser.parse(scheduled_deletion)
                else:
                    scheduled_deletion = datetime.fromisoformat(scheduled_deletion.replace('Z', '+00:00'))
            if isinstance(scheduled_deletion, datetime) and scheduled_deletion.tzinfo is None:
                scheduled_deletion = scheduled_deletion.replace(tzinfo=timezone.utc)
            permanent_deletion = scheduled_deletion
            
            await self.deletion_requests_collection.update_one(
                {"_id": deletion_request["_id"]},
                {
                    "$set": {
                        "status": DeleteAccountStatus.CONFIRMED.value,
                        "confirmed_at": datetime.now(timezone.utc),
                        "permanent_deletion_at": permanent_deletion,
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            await self.users_collection.update_one(
                {"email": user_email},
                {
                    "$set": {
                        "deleted_at": datetime.now(timezone.utc),
                        "status": "deleted",
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            logger.info(f"[DELETE_ACCOUNT] Account deletion confirmed for {user_email}. Permanent deletion scheduled for {permanent_deletion}")
            
            return {
                "success": True,
                "message": "Account deletion confirmed. Your account will be permanently deleted after the grace period.",
                "permanent_deletion_at": permanent_deletion.isoformat(),
                "grace_period_days": self.GRACE_PERIOD_DAYS,
            }
            
        except ValidationException:
            raise
        except Exception as e:
            logger.error(
                f"[DELETE_ACCOUNT] Error confirming deletion for {user_email}: {type(e).__name__}: {str(e)}",
                exc_info=True
            )
            raise DatabaseError(
                f"Failed to confirm account deletion: {str(e)}",
                details={"user_email": user_email}
            )
    
    async def cancel_deletion(
        self,
        request: DeleteAccountCancelRequest
    ) -> Dict:
        """Cancel a pending account deletion request"""
        user_email = request.user_email
        token = request.cancellation_token
        
        logger.info(f"[DELETE_ACCOUNT] Cancellation attempt for {user_email}")
        
        try:
            # Find deletion request
            deletion_request = await self.deletion_requests_collection.find_one({
                "user_email": user_email,
                "cancellation_token": token,
                "status": {"$in": [DeleteAccountStatus.PENDING.value, DeleteAccountStatus.CONFIRMED.value]}
            })
            
            if not deletion_request:
                raise ValidationException(
                    "Invalid cancellation token or no active deletion request found.",
                    details={"user_email": user_email}
                )
            
            # Check if already past grace period (cannot cancel)
            permanent_deletion = deletion_request.get("permanent_deletion_at")
            if permanent_deletion:
                # Handle both datetime objects and ISO strings from MongoDB
                if isinstance(permanent_deletion, str):
                    try:
                        from dateutil import parser as date_parser
                        if date_parser:
                            permanent_deletion = date_parser.parse(permanent_deletion)
                        else:
                            permanent_deletion = datetime.fromisoformat(permanent_deletion.replace('Z', '+00:00'))
                    except Exception:
                        logger.warning(f"[DELETE_ACCOUNT] Could not parse permanent_deletion_at for {user_email}")
                        permanent_deletion = None
                
                if permanent_deletion and isinstance(permanent_deletion, datetime):
                    if permanent_deletion.tzinfo is None:
                        permanent_deletion = permanent_deletion.replace(tzinfo=timezone.utc)
                    if datetime.now(timezone.utc) >= permanent_deletion:
                        raise ValidationException(
                            "Cannot cancel deletion. The grace period has expired and the account is scheduled for permanent deletion.",
                            details={"user_email": user_email, "permanent_deletion_at": permanent_deletion.isoformat()}
                        )
            
            # Cancel deletion request
            await self.deletion_requests_collection.update_one(
                {"_id": deletion_request["_id"]},
                {
                    "$set": {
                        "status": DeleteAccountStatus.CANCELLED.value,
                        "cancelled_at": datetime.now(timezone.utc),
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            # Restore user account if it was soft deleted
            await self.users_collection.update_one(
                {"email": user_email},
                {
                    "$unset": {"deleted_at": "", "status": ""},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                }
            )
            
            logger.info(f"[DELETE_ACCOUNT] Account deletion cancelled for {user_email}")
            
            return {
                "success": True,
                "message": "Account deletion has been cancelled. Your account is now active again.",
            }
            
        except ValidationException:
            raise
        except Exception as e:
            logger.error(
                f"[DELETE_ACCOUNT] Error cancelling deletion for {user_email}: {type(e).__name__}: {str(e)}",
                exc_info=True
            )
            raise DatabaseError(
                f"Failed to cancel account deletion: {str(e)}",
                details={"user_email": user_email}
            )
    
    async def _delete_user_data_from_collection(
        self,
        collection_name: str,
        user_email: str
    ) -> int:
        """Delete all user data from a specific collection"""
        try:
            collection = self.db[collection_name]
            
            # Delete documents where user_email matches
            result = await collection.delete_many({"user_email": user_email})
            deleted_count = result.deleted_count
            
            # NOTE: After DB purge, this special case can be removed
            if collection_name == "action_items":
                goals = await self.db["goals"].find({"user_email": user_email}).to_list(None)
                goal_ids = [str(goal["_id"]) for goal in goals]
                
                if goal_ids:
                    additional_result = await collection.delete_many({
                        "goal_id": {"$in": goal_ids},
                        "user_email": {"$exists": False}
                    })
                    deleted_count += additional_result.deleted_count
                    
                    if additional_result.deleted_count > 0:
                        logger.info(f"[DELETE_ACCOUNT] Deleted {additional_result.deleted_count} additional action_items without user_email field")
            
            logger.info(f"[DELETE_ACCOUNT] Deleted {deleted_count} documents from {collection_name} for {user_email}")
            return deleted_count
            
        except Exception as e:
            logger.error(
                f"[DELETE_ACCOUNT] Error deleting data from {collection_name} for {user_email}: {str(e)}",
                exc_info=True
            )
            # Don't fail entire deletion if one collection fails
            return 0
    
    async def _delete_user_vector_store_data(self, user_email: str) -> int:
        """Delete user's vector store documents"""
        try:
            from app.config import VECTOR_DB_NAME, VECTOR_COLLECTION_NAME
            from motor.motor_asyncio import AsyncIOMotorClient
            from app.config import VECTOR_STORE_DB_URI
            
            if not VECTOR_STORE_DB_URI:
                logger.warning("[DELETE_ACCOUNT] VECTOR_STORE_DB_URI not configured, skipping vector store deletion")
                return 0
            
            client = AsyncIOMotorClient(VECTOR_STORE_DB_URI)
            db = client[VECTOR_DB_NAME]
            collection = db[VECTOR_COLLECTION_NAME]
            
            result = await collection.delete_many({"user_email": user_email})
            deleted_count = result.deleted_count
            
            await client.close()
            logger.info(f"[DELETE_ACCOUNT] Deleted {deleted_count} vector store documents for {user_email}")
            return deleted_count
            
        except Exception as e:
            logger.error(
                f"[DELETE_ACCOUNT] Error deleting vector store data for {user_email}: {str(e)}",
                exc_info=True
            )
            return 0
    
    async def get_expired_deletion_requests(self) -> List[Dict]:
        """
        Query for deletion requests that are ready to be executed.
        Returns deletion requests with status='confirmed' and permanent_deletion_at <= now.
        """
        now = datetime.now(timezone.utc)
        
        try:
            cursor = self.deletion_requests_collection.find({
                "status": DeleteAccountStatus.CONFIRMED.value,
                "permanent_deletion_at": {"$lte": now}
            })
            
            expired_requests = await cursor.to_list(length=None)
            return expired_requests
            
        except Exception as e:
            logger.error(
                f"[DELETE_ACCOUNT_SCHEDULER] Error querying expired deletion requests: {type(e).__name__}: {str(e)}",
                exc_info=True
            )
            return []
    
    async def process_scheduled_deletions(self) -> Dict:
        """
        Process all scheduled deletions that have passed their permanent_deletion_at date.
        This method should be called periodically by a background scheduler.
        
        Returns:
            Dict containing summary of processed deletions
        """
        summary = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "processed": 0,
            "succeeded": 0,
            "failed": 0,
            "errors": []
        }
        
        try:
            expired_requests = await self.get_expired_deletion_requests()
            summary["processed"] = len(expired_requests)
            
            if not expired_requests:
                return summary
            
            for request in expired_requests:
                user_email = request.get("user_email")
                
                try:
                    await self.permanently_delete_account(user_email)
                    summary["succeeded"] += 1
                    logger.info(f"[DELETE_ACCOUNT_SCHEDULER] Successfully deleted account for {user_email}")
                except Exception as e:
                    summary["failed"] += 1
                    error_msg = f"Failed to delete {user_email}: {type(e).__name__}: {str(e)}"
                    summary["errors"].append(error_msg)
                    logger.error(f"[DELETE_ACCOUNT_SCHEDULER] Error deleting account for {user_email}: {type(e).__name__}: {str(e)}", exc_info=True)
            
            return summary
            
        except Exception as e:
            error_msg = f"Critical error in scheduled deletion processing: {type(e).__name__}: {str(e)}"
            summary["errors"].append(error_msg)
            logger.error(f"[DELETE_ACCOUNT_SCHEDULER] {error_msg}", exc_info=True)
            return summary
    
    async def permanently_delete_account(self, user_email: str) -> Dict:
        """
        Permanently delete user account and all associated data.
        This should only be called after the grace period expires.
        """
        logger.info(f"[DELETE_ACCOUNT] Starting permanent deletion for {user_email}")
        
        deletion_summary = {
            "user_email": user_email,
            "collections_cleaned": {},
            "total_documents_deleted": 0,
            "errors": []
        }
        
        try:
            deletion_request = await self.deletion_requests_collection.find_one({
                "user_email": user_email,
                "status": DeleteAccountStatus.CONFIRMED.value
            })
            
            if not deletion_request:
                error_msg = f"No confirmed deletion request found for {user_email}"
                deletion_summary["errors"].append(error_msg)
                raise DatabaseError(error_msg)
            
            for collection_name in self.USER_DATA_COLLECTIONS:
                try:
                    deleted_count = await self._delete_user_data_from_collection(collection_name, user_email)
                    deletion_summary["collections_cleaned"][collection_name] = deleted_count
                    deletion_summary["total_documents_deleted"] += deleted_count
                except Exception as e:
                    error_msg = f"Error deleting from {collection_name}: {str(e)}"
                    deletion_summary["errors"].append(error_msg)
                    logger.error(f"[DELETE_ACCOUNT] {error_msg}", exc_info=True)
            
            try:
                vector_deleted = await self._delete_user_vector_store_data(user_email)
                deletion_summary["collections_cleaned"]["vector_store"] = vector_deleted
                deletion_summary["total_documents_deleted"] += vector_deleted
            except Exception as e:
                error_msg = f"Error deleting vector store data: {str(e)}"
                deletion_summary["errors"].append(error_msg)
                logger.error(f"[DELETE_ACCOUNT] {error_msg}", exc_info=True)
            
            try:
                memory_service = get_memory_service()
                memory_deleted = await memory_service.delete_user_memories(user_email)
                deletion_summary["collections_cleaned"]["memories"] = 1 if memory_deleted else 0
            except Exception as e:
                error_msg = f"Error deleting memories: {str(e)}"
                deletion_summary["errors"].append(error_msg)
                logger.error(f"[DELETE_ACCOUNT] {error_msg}", exc_info=True)
            
            await self.deletion_requests_collection.update_one(
                {"user_email": user_email, "status": DeleteAccountStatus.CONFIRMED.value},
                {
                    "$set": {
                        "status": DeleteAccountStatus.DELETED.value,
                        "permanently_deleted_at": datetime.now(timezone.utc),
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            logger.info(
                f"[DELETE_ACCOUNT] Permanently deleted account for {user_email}. "
                f"Total documents deleted: {deletion_summary['total_documents_deleted']}"
            )
            
            return deletion_summary
            
        except Exception as e:
            logger.error(
                f"[DELETE_ACCOUNT] Critical error during permanent deletion for {user_email}: {type(e).__name__}: {str(e)}",
                exc_info=True
            )
            deletion_summary["errors"].append(f"Critical error: {str(e)}")
            raise DatabaseError(
                f"Failed to permanently delete account: {str(e)}",
                details=deletion_summary
            )


# Singleton pattern
_delete_account_service_instance = None

def get_delete_account_service():
    """Get singleton instance of DeleteAccountService"""
    global _delete_account_service_instance
    if _delete_account_service_instance is None:
        _delete_account_service_instance = DeleteAccountService()
    return _delete_account_service_instance

