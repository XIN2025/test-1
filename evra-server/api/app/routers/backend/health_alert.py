from fastapi import APIRouter, HTTPException, Depends, Request
import json
from datetime import datetime, timezone
from typing import Dict, Any

from app.services.backend_services.health_alert_service import (
    get_health_alert_service,
)
from app.services.backend_services.db import get_db
from app.schemas.utils import HttpResponse
from app.schemas.backend.health_alert import HealthMetricData
from app.core.security import get_current_user, CurrentUser

health_alert_router = APIRouter()
health_alert_service = get_health_alert_service()


async def store_debug_data(user_email: str, raw_data: Dict[str, Any]):
    """Store raw incoming health data in debug collection for analysis"""
    try:
        db = get_db()
        debug_collection = db["health_data_debug"]
        
        debug_document = {
            "user_email": user_email,
            "raw_data": raw_data, 
            "created_at": datetime.now(timezone.utc),
            "source": "frontend_api",
            "timestamp_utc": datetime.now(timezone.utc).isoformat()
        }
        
        result = await debug_collection.insert_one(debug_document)
        print(f"✅ Debug data stored with ID: {result.inserted_id}")
    except Exception as e:
        print(f"⚠️ Warning: Failed to store debug data: {e}")


@health_alert_router.post(
    "/hourly-data", response_model=HttpResponse
)
async def upload_hourly_health_data(
    request: Request,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Upload hourly health data from frontend.
    Stores raw incoming data in health_data_debug collection for analysis.
    """
    try:
        raw_body = await request.body()
        raw_data = json.loads(raw_body) if raw_body else {}
        
        await store_debug_data(current_user.email, raw_data)
        
        try:
            data = HealthMetricData(**raw_data)
        except Exception as validation_error:
            try:
                db = get_db()
                debug_collection = db["health_data_debug"]
                await debug_collection.insert_one({
                    "user_email": current_user.email,
                    "raw_data": raw_data,
                    "validation_error": str(validation_error),
                    "created_at": datetime.now(timezone.utc),
                    "source": "frontend_api",
                    "status": "validation_failed"
                })
            except:
                pass
            return HttpResponse(success=False, message=f"Invalid data format: {str(validation_error)}", data=None)
        
        health_data = await health_alert_service.store_hourly_health_data(current_user.email, data)
        return HttpResponse(success=True, message="Health data uploaded successfully", data={"health_data": health_data.model_dump()})
    except json.JSONDecodeError as e:
        return HttpResponse(success=False, message=f"Invalid JSON: {str(e)}", data=None)
    except Exception as e:
        return HttpResponse(success=False, message=str(e), data=None)


@health_alert_router.get(
    "/active", response_model=HttpResponse
)
async def get_active_health_alerts(current_user: CurrentUser = Depends(get_current_user)):
    try:
        alerts = await health_alert_service.get_active_health_alerts(current_user.email)
        return HttpResponse(
            success=True,
            message="Active alerts fetched successfully",
            data={"alerts": [alert.model_dump() for alert in alerts]},
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching active alerts")

@health_alert_router.post("/{health_alert_id}/resolve", response_model=HttpResponse)
async def resolve_health_alert(
    health_alert_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    try:
        # Verify ownership before resolving
        alerts = await health_alert_service.get_active_health_alerts(current_user.email)
        alert_ids = [str(alert.id) for alert in alerts]
        if health_alert_id not in alert_ids:
            raise HTTPException(status_code=403, detail="Not authorized to resolve this alert")
        
        success = await health_alert_service.mark_health_alert_resolve(health_alert_id)
        if not success:
            raise HTTPException(status_code=404, detail="Health alert not found or already resolved")
        return HttpResponse(success=True, message="Health alert resolved successfully")
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to resolve health alert")
