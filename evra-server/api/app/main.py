import asyncio
import logging
import sys
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from starlette.formparsers import MultiPartParser
from starlette.requests import Request as StarletteRequest
import httpx
import os

from app.config import (
    DEBUG_COLLECTION_NAME,
    PROFILE_PICTURE_MAX_BYTES,
    MULTIPART_SPOOL_MAX_SIZE,
    MULTIPART_MAX_FILES,
    MULTIPART_MAX_FIELDS,
    PLEROMA_INSTANCE_URL,
)
from app.exceptions import AppException, custom_exception_handler, generic_exception_handler
from app.core.security import get_current_user, CurrentUser
from app.routers.ai.chat import chat_router
from app.routers.ai.goals import goals_router
from app.routers.ai.lab_report import lab_report_router
from app.routers.ai.personalization_profile import personalization_router
from app.routers.backend.auth import auth_router
from app.routers.backend.health_alert import health_alert_router
from app.routers.backend.health_score import health_score_router
from app.routers.backend.health_export import health_export_router
from app.routers.backend.nudge import nudge_router
from app.routers.backend.delete_account import delete_account_router
from app.routers.backend.preferences import preferences_router
from app.routers.backend.upload import upload_router
from app.routers.backend.user import user_router
from app.routers.backend.review import review_router
from app.routers.backend.app_version import app_version_router
from app.routers.backend.community import community_router
from app.routers.backend.deep_links import deep_links_router
from app.routers.backend.dexcom import dexcom_router
from app.services.backend_services.db import close_db, get_client, get_db
from app.services.backend_services.email_utils import send_email
from app.services.backend_services.nudge_service import get_nudge_service
from app.services.backend_services.delete_account_service import process_scheduled_deletions_job
from fastapi import Depends

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("evra.api")


def stop_scheduler(scheduler):
    scheduler.shutdown()
    logger.info("🛑 Nudge scheduler stopped")




@asynccontextmanager
async def lifespan(app: FastAPI):
    get_db()
    
    nudge_service = get_nudge_service()
    nudge_service.start_scheduler()
    print("🚀 Nudge scheduler started")
    
    nudge_service.scheduler.add_job(
        process_scheduled_deletions_job,
        trigger='cron',
        hour=7,      
        minute=0,    
        id='account_deletion_processor',
        replace_existing=True,
        coalesce=True,
        misfire_grace_time=15 * 60,  
    )

    print("🗑️  Account deletion processor scheduled")
    
    # Schedule notifications in background, don't block startup
    task = asyncio.create_task(nudge_service.schedule_daily_notifications())
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
        nudge_service.stop_scheduler()
        await close_db()
    print("✅ Shutdown complete")


class TenMBMultiPartParser(MultiPartParser):
    spool_max_size = MULTIPART_SPOOL_MAX_SIZE  
    max_part_size = PROFILE_PICTURE_MAX_BYTES  

    def __init__(
        self,
        headers,
        stream,
        *,
        max_files=MULTIPART_MAX_FILES,
        max_fields=MULTIPART_MAX_FIELDS,
        max_part_size=PROFILE_PICTURE_MAX_BYTES,
    ):
        super().__init__(
            headers,
            stream,
            max_files=max_files,
            max_fields=max_fields,
            max_part_size=max_part_size,
        )


class LargeMultipartRequest(StarletteRequest):
    async def _get_form(
        self,
        *,
        max_files: int | float = MULTIPART_MAX_FILES,
        max_fields: int | float = MULTIPART_MAX_FIELDS,
    ):
        return await super()._get_form(
            max_files=max_files,
            max_fields=max_fields,
        )

    def form(
        self,
        *,
        max_files: int | float = MULTIPART_MAX_FILES,
        max_fields: int | float = MULTIPART_MAX_FIELDS,
    ):
        return super().form(
            max_files=max_files,
            max_fields=max_fields,
        )

app = FastAPI(
    title="Medical RAG API", 
    description="Medical RAG API with async support",
    version="1.0.0",
    lifespan=lifespan,
    request_class=LargeMultipartRequest,
)

app.router.default_form_parser_class = TenMBMultiPartParser

app.add_exception_handler(AppException, custom_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(auth_router, tags=["auth"])
app.include_router(user_router, tags=["user"])
app.include_router(chat_router, tags=["chat"])
app.include_router(upload_router, tags=["upload"])
app.include_router(goals_router, tags=["goals"])
app.include_router(lab_report_router, tags=["lab-reports"])
app.include_router(personalization_router, tags=["personalization"])
app.include_router(delete_account_router, tags=["delete-account"])
app.include_router(preferences_router, tags=["preferences"])
app.include_router(nudge_router, prefix="/api/nudge", tags=["nudge"])
app.include_router(health_alert_router, prefix="/api/health-alert", tags=["health-alert"])
app.include_router(health_score_router, prefix="/api/health-score", tags=["health-score"])
app.include_router(health_export_router, prefix="/api", tags=["health-export"])
app.include_router(review_router, tags=["review"])
app.include_router(app_version_router, tags=["app-version"])
app.include_router(community_router, tags=["community"])
app.include_router(deep_links_router, tags=["deep-links"])
app.include_router(dexcom_router, prefix="/api/v1", tags=["dexcom"])

@app.get("/media/{full_path:path}")
async def proxy_pleroma_media(full_path: str):
    """
    Proxy media requests to Pleroma container.
    """
    use_docker_network = os.getenv("USE_DOCKER_NETWORK", "true").lower() == "true"
    
    if use_docker_network:
        pleroma_url = f"http://pleroma:4000/media/{full_path}"
    else:
        base_url = PLEROMA_INSTANCE_URL.rstrip('/')
        pleroma_url = f"{base_url}/media/{full_path}"
    
    logger.debug(f"Proxying media request to: {pleroma_url}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(pleroma_url)
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Media not found")
            
            if response.status_code >= 400:
                logger.error(f"Pleroma media proxy error: {response.status_code} for {full_path}")
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch media")
            
            content_type = response.headers.get("content-type", "image/jpeg")
            
            headers = {
                "Cache-Control": "public, max-age=31536000, immutable",
                "Content-Type": content_type,
            }
            
            if "content-length" in response.headers:
                headers["Content-Length"] = response.headers["content-length"]
            
            return StreamingResponse(
                iter([response.content]),
                media_type=content_type,
                headers=headers,
                status_code=response.status_code
            )
            
    except httpx.TimeoutException:
        logger.error(f"Timeout fetching media from Pleroma: {full_path}")
        raise HTTPException(status_code=504, detail="Media request timeout")
    except httpx.RequestError as e:
        logger.error(f"Error connecting to Pleroma for media: {full_path} - {e}")
        raise HTTPException(status_code=502, detail="Failed to connect to media server")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error proxying media {full_path}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error while fetching media")

@app.get("/")
async def root():
    try:
        db = get_db()
        client = get_client()
        
        collections = await db.list_collection_names()
        server_info = await client.server_info()
        
        return {
            "message": "Hello World", 
            "mongodb": "connected", 
            "collections_count": len(collections),
            "mongodb_version": server_info.get("version", "unknown")
        }
    except Exception as e:
        return {"message": "Hello World", "mongodb": f"connection error: {str(e)}"}

@app.post("/send-email")
def send_email_endpoint(
    to_email: str = Body(...),
    subject: str = Body(...),
    body: str = Body(...)
):
    send_email(to_email, subject, body)
    return {"message": "Email sent successfully"}

@app.post("/debug/store")
async def store_debug_data(
    data: dict = Body(...),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Store debug data. Requires authentication.
    """
    if DEBUG_COLLECTION_NAME == None:
        return {"error": "DEBUG_COLLECTION_NAME is not set in configuration."}
    try:
        db = get_db()
        debug_collection = db[DEBUG_COLLECTION_NAME]
        
        debug_entry = {
            "data": data,
            "email": current_user.email, 
            "timestamp": datetime.now(timezone.utc)
        }
        result = await debug_collection.insert_one(debug_entry)
        return {
            "message": "Debug data stored successfully",
            "id": str(result.inserted_id),
            "email": current_user.email,
            "timestamp": debug_entry["timestamp"].isoformat()
        }
    except Exception as e:
        return {"error": f"Failed to store debug data: {str(e)}"}

@app.get("/debug/store")
async def get_debug_data(current_user: CurrentUser = Depends(get_current_user)):
    """
    Get debug data for the authenticated user only.
    Users can only see their own debug data.
    """
    try:
        db = get_db()
        debug_collection = db[DEBUG_COLLECTION_NAME]
        query = {"email": current_user.email}
        debug_entries = await debug_collection.find(query).sort("timestamp", -1).to_list(length=None)
        
        for entry in debug_entries:
            entry["_id"] = str(entry["_id"])
            entry["timestamp"] = entry["timestamp"].isoformat()
        
        return {
            "message": "Debug data retrieved successfully",
            "count": len(debug_entries),
            "data": debug_entries
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to retrieve debug data")
