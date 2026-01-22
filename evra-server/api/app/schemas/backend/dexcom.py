from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DexcomAccountData(BaseModel):
    """Dexcom account connection data"""
    user_email: str
    dexcom_user_id: Optional[str] = None
    last_sync_time: Optional[datetime] = None
    connected: bool = True


class DexcomConnectionStatus(BaseModel):
    """Dexcom connection status"""
    connected: bool
    dexcom_user_id: Optional[str] = None
    last_sync_time: Optional[datetime] = None


class GlucoseReading(BaseModel):
    """Glucose reading from Dexcom"""
    value: float
    timestamp: datetime
    trend: Optional[str] = None
    trend_rate: Optional[float] = None
    source: str = "dexcom_api"

