from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class ExportFormat(str, Enum):
    CSV = "csv"
    PDF = "pdf"
    XML = "xml"


class DataDomain(str, Enum):
    WEARABLES = "wearables"
    LABS = "labs"
    GOALS = "goals"
    MEDICATIONS = "medications"
    ALLERGIES = "allergies"
    CONDITIONS = "conditions"


class TimeWindow(str, Enum):
    DAYS_30 = "30"
    DAYS_60 = "60"
    DAYS_90 = "90"


class HealthExportRequest(BaseModel):
    time_window: TimeWindow = Field(..., description="Time window in days: 30, 60, or 90")
    format: ExportFormat = Field(..., description="Export format: csv or pdf")


class WearableMetricTrend(BaseModel):
    date: str
    steps: Optional[float] = None
    heart_rate_avg: Optional[float] = None
    heart_rate_max: Optional[float] = None
    heart_rate_min: Optional[float] = None
    active_energy: Optional[float] = None
    sleep_hours: Optional[float] = None
    weight: Optional[float] = None
    body_fat: Optional[float] = None
    blood_glucose_avg: Optional[float] = None
    blood_glucose_max: Optional[float] = None
    blood_glucose_min: Optional[float] = None
    oxygen_saturation_avg: Optional[float] = None
    oxygen_saturation_max: Optional[float] = None
    oxygen_saturation_min: Optional[float] = None


class LabReportExport(BaseModel):
    test_title: Optional[str] = None
    test_description: Optional[str] = None
    test_date: Optional[str] = None
    lab_name: Optional[str] = None
    doctor_name: Optional[str] = None
    properties: List[Dict[str, Any]] = []


class GoalExport(BaseModel):
    goal_id: str
    title: str
    category: str
    priority: str
    created_at: str
    completed: bool
    completion_percentage: float
    action_items_count: int
    completed_action_items_count: int


class MedicationExport(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    source_file: Optional[str] = None
    extracted_at: Optional[str] = None


class AllergyExport(BaseModel):
    allergen: str
    reaction: Optional[str] = None
    severity: Optional[str] = None
    source_file: Optional[str] = None
    extracted_at: Optional[str] = None


class ConditionExport(BaseModel):
    condition: str
    intent: Optional[str] = None  
    source_file: Optional[str] = None
    extracted_at: Optional[str] = None


class HealthExportData(BaseModel):
    user_email: str
    time_window_days: int
    start_date: datetime
    end_date: datetime
    wearable_metrics: List[WearableMetricTrend] = []
    lab_reports: List[LabReportExport] = []
    goals: List[GoalExport] = []
    medications: List[MedicationExport] = []
    allergies: List[AllergyExport] = []
    conditions: List[ConditionExport] = []


class HealthExportResponse(BaseModel):
    success: bool
    message: str
    download_url: Optional[str] = None
    filename: Optional[str] = None

