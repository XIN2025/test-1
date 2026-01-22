from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
import logging
import io
from datetime import datetime
from typing import List, Optional
import re

from app.services.backend_services.health_export_service import get_health_export_service
from app.schemas.backend.health_export import (
    ExportFormat,
    TimeWindow,
    DataDomain,
)
from app.core.security import get_current_user, CurrentUser

logger = logging.getLogger(__name__)

health_export_router = APIRouter(prefix="/health-export", tags=["health-export"])


@health_export_router.get("/")
async def export_health_data(
    time_window: TimeWindow = Query(..., description="Time window in days: 30, 60, or 90"),
    format: ExportFormat = Query(..., description="Export format: csv, pdf, or xml"),
    domains: Optional[List[DataDomain]] = Query(
        None, 
        description="Data domains to include. If not specified, includes all domains. Options: wearables, labs, goals, medications, allergies, conditions"
    ),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Export user's health data in CSV, PDF, or XML format
    
    You can selectively choose which data domains to include in the export:
    - wearables: Activity, heart rate, sleep, glucose, etc.
    - labs: Laboratory test results
    - goals: Health goals and adherence tracking
    - medications: Medication list
    - allergies: Allergy information
    - conditions: Health conditions (prevent/manage/reverse)
    
    If no domains are specified, all data will be included.
    """
    try:
        service = get_health_export_service()
        
    
        domains_set = set(domains) if domains else None
        
        export_data = await service.aggregate_health_data(
            current_user.email, time_window, domains_set
        )
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Sanitize email for filename - remove special characters to prevent header injection
        safe_email = re.sub(r'[^\w\-.]', '_', current_user.email)
        
        if format == ExportFormat.CSV:
            file_content = service.generate_csv(export_data, domains_set)
            filename = f"health_export_{safe_email}_{time_window.value}days_{timestamp}.csv"
            media_type = "text/csv"
        elif format == ExportFormat.PDF:
            file_content = service.generate_pdf(export_data, domains_set)
            filename = f"health_export_{safe_email}_{time_window.value}days_{timestamp}.pdf"
            media_type = "application/pdf"
        else: 
            file_content = service.generate_xml(export_data, domains_set)
            filename = f"health_export_{safe_email}_{time_window.value}days_{timestamp}.xml"
            media_type = "application/xml"
        
        # Properly quote the filename to prevent header injection
        safe_filename = filename.replace('"', '\\"')
        
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{safe_filename}"',
            },
        )
        
    except Exception as e:
        logger.error(f"Error exporting health data for {current_user.email}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to export health data. Please try again later or contact support if the issue persists."
        )

