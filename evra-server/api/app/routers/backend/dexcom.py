from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse, HTMLResponse
import logging
from datetime import datetime

from app.core.security import get_current_user, CurrentUser
from app.schemas.utils import HttpResponse
from app.services.backend_services.dexcom_service import get_dexcom_service

logger = logging.getLogger(__name__)

dexcom_router = APIRouter(
    prefix="/integrations/dexcom", tags=["dexcom"]
)

dexcom_service = get_dexcom_service()



@dexcom_router.get("/auth-url")
async def get_dexcom_auth_url(
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Get Dexcom OAuth authorization URL
    User must be authenticated
    """
    try:
        auth_url, state = dexcom_service.generate_auth_url(current_user.email)
        return {
            "success": True,
            "auth_url": auth_url,
            "state": state,
        }
    except Exception as e:
        logger.error(f"Failed to generate auth URL: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate auth URL: {str(e)}",
        )


@dexcom_router.get("/callback", response_class=HTMLResponse)
async def dexcom_callback(
    code: str = Query(..., description="Authorization code from Dexcom"),
    state: str = Query(..., description="State parameter"),
):
    """
    OAuth callback endpoint
    Handles redirect from Dexcom after authorization
    Returns simple HTML page that works in both web browser and mobile app
    """
    try:
        result = await dexcom_service.exchange_code_for_tokens(code, state)
        user_email = result['user_email']
        deep_link = f"evra://dexcom/connected?user_email={user_email}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dexcom Connected - Evra</title>
            <style>
                body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }}
                .container {{ background: white; padding: 30px; border-radius: 10px; max-width: 400px; margin: 0 auto; }}
                h1 {{ color: #4CAF50; }}
                p {{ color: #666; }}
                .button {{ display: inline-block; margin-top: 20px; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>✅ Dexcom Connected!</h1>
                <p>Your Dexcom account has been linked to your Evra profile.</p>
                <p><strong>{user_email}</strong></p>
                <p style="font-size: 14px; color: #999; margin-top: 30px;">
                    You will be redirected to the Evra app shortly...
                </p>
                <a href="{deep_link}" class="button">Open Evra App</a>
            </div>
            <script>
                setTimeout(function() {{
                    window.location.href = "{deep_link}";
                }}, 1000);
            </script>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content)
        
    except Exception as e:
        logger.error(f"Dexcom callback failed: {e}", exc_info=True)
        error_message = str(e).replace('"', '&quot;').replace("'", "&#39;")
        error_deep_link = f"evra://dexcom/error?message={error_message}"
        
        error_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Connection Error - Evra</title>
            <style>
                body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }}
                .container {{ background: white; padding: 30px; border-radius: 10px; max-width: 400px; margin: 0 auto; }}
                h1 {{ color: #f44336; }}
                .error {{ background: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; color: #c62828; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>❌ Connection Failed</h1>
                <div class="error">{error_message}</div>
                <p>Please try again.</p>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=error_html, status_code=400)


@dexcom_router.get("/status", response_model=HttpResponse)
async def get_dexcom_status(
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Check Dexcom connection status
    """
    try:
        status = await dexcom_service.get_connection_status(current_user.email)
        return HttpResponse(
            success=True,
            message="Status retrieved successfully",
            data=status,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get status: {str(e)}",
        )


@dexcom_router.post("/sync", response_model=HttpResponse)
async def sync_dexcom_data(
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Manually trigger Dexcom data sync
    """
    try:
        result = await dexcom_service.sync_user_data(current_user.email)
        return HttpResponse(
            success=True,
            message=result["message"],
            data={"readings_count": result["readings_count"]},
        )
    except Exception as e:
        logger.error(f"Sync failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync Dexcom data: {str(e)}",
        )


@dexcom_router.get("/latest-reading", response_model=HttpResponse)
async def get_latest_dexcom_reading(
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Get the latest CGM reading for the user
    Triggers a sync first to fetch any new data, then returns only the most recent reading
    """
    try:
        sync_result = await dexcom_service.sync_user_data(current_user.email)
        logger.info(f"Sync during latest-reading: {sync_result}")

        latest_reading = await dexcom_service.get_latest_reading(current_user.email)
        if not latest_reading:
            return HttpResponse(
                success=True,
                message="No readings available yet",
                data=None,
            )

        latest_reading.pop("_id", None)
        if isinstance(latest_reading.get("timestamp"), datetime):
            latest_reading["timestamp"] = latest_reading["timestamp"].isoformat()
        if isinstance(latest_reading.get("created_at"), datetime):
            latest_reading["created_at"] = latest_reading["created_at"].isoformat()

        return HttpResponse(
            success=True,
            message="Latest reading retrieved",
            data=latest_reading,
        )
    except Exception as e:
        logger.error(f"Failed to get latest reading: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get latest reading: {str(e)}",
        )


@dexcom_router.delete("/disconnect", response_model=HttpResponse)
async def disconnect_dexcom(
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Disconnect Dexcom account
    Removes stored tokens and stops syncing
    """
    try:
        await dexcom_service.disconnect(current_user.email)
        
        return HttpResponse(
            success=True,
            message="Dexcom disconnected successfully",
            data=None,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to disconnect Dexcom: {str(e)}",
        )





