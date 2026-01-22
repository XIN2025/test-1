from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Set
import csv
import io
import logging
from bson import ObjectId
import xml.etree.ElementTree as ET
from xml.dom import minidom

from app.services.backend_services.db import get_db
from app.services.backend_services.encryption_service import get_encryption_service
from app.schemas.backend.health_export import (
    HealthExportData,
    WearableMetricTrend,
    LabReportExport,
    GoalExport,
    MedicationExport,
    AllergyExport,
    ConditionExport,
    ExportFormat,
    TimeWindow,
    DataDomain,
)
from app.schemas.ai.goals import Goal, ActionItem
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

logger = logging.getLogger(__name__)


class HealthExportService:
    def __init__(self):
        self.db = get_db()
        self.health_data_collection = self.db["health_data"]
        self.lab_reports_collection = self.db["lab_reports"]
        self.goals_collection = self.db["goals"]
        self.action_items_collection = self.db["action_items"]
        self.uploaded_files_collection = self.db["uploaded_files"]
        self.encryption_service = get_encryption_service()

    async def aggregate_health_data(
        self, user_email: str, time_window: TimeWindow, domains: Optional[Set[DataDomain]] = None
    ) -> HealthExportData:
        """Aggregate health data for a user over the specified time window
        
        Args:
            user_email: User's email address
            time_window: Time window enum (30, 60, or 90 days)
            domains: Optional set of data domains to include. If None, includes all domains.
        """
        days = int(time_window.value)
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)

        if domains is None:
            domains = set(DataDomain)
        
        logger.info(
            f"Aggregating health data for {user_email} from {start_date} to {end_date}, domains: {[d.value for d in domains]}"
        )

        wearable_metrics = []
        lab_reports = []
        goals = []
        medications = []
        allergies = []
        conditions = []
        
        if DataDomain.WEARABLES in domains:
            wearable_metrics = await self._fetch_wearable_metrics(
                user_email, start_date, end_date
            )
        
        if DataDomain.LABS in domains:
            lab_reports = await self._fetch_lab_reports(user_email, start_date, end_date)
        
        if DataDomain.GOALS in domains:
            goals = await self._fetch_goals_with_attainment(
                user_email, start_date, end_date
            )
        
        if DataDomain.MEDICATIONS in domains or DataDomain.ALLERGIES in domains or DataDomain.CONDITIONS in domains:
            medications_data, allergies_data, conditions_data = await self._fetch_medical_data(
                user_email, start_date, end_date
            )
            if DataDomain.MEDICATIONS in domains:
                medications = medications_data
            if DataDomain.ALLERGIES in domains:
                allergies = allergies_data
            if DataDomain.CONDITIONS in domains:
                conditions = conditions_data

        return HealthExportData(
            user_email=user_email,
            time_window_days=days,
            start_date=start_date,
            end_date=end_date,
            wearable_metrics=wearable_metrics,
            lab_reports=lab_reports,
            goals=goals,
            medications=medications,
            allergies=allergies,
            conditions=conditions,
        )

    async def _fetch_wearable_metrics(
        self, user_email: str, start_date: datetime, end_date: datetime
    ) -> List[WearableMetricTrend]:
        """Fetch and aggregate wearable metrics over time period"""
        try:
            cursor = self.health_data_collection.find(
                {
                    "user_email": user_email,
                    "created_at": {"$gte": start_date, "$lte": end_date},
                }
            ).sort("created_at", 1)

            health_data_docs = await cursor.to_list(None)
            trends = []

            for doc in health_data_docs:
                aggregated_summary = doc.get("aggregated_summary")
                if not aggregated_summary:
                    continue

                date_str = doc["created_at"].strftime("%Y-%m-%d")
                trend = WearableMetricTrend(
                    date=date_str,
                    steps=aggregated_summary.get("step", {}).get("total"),
                    heart_rate_avg=aggregated_summary.get("heartRate", {}).get("average"),
                    heart_rate_max=aggregated_summary.get("heartRate", {}).get("max"),
                    heart_rate_min=aggregated_summary.get("heartRate", {}).get("min"),
                    active_energy=aggregated_summary.get("activeEnergy", {}).get("total"),
                    sleep_hours=aggregated_summary.get("sleep", {}).get("totalHours"),
                    weight=aggregated_summary.get("weight", {}).get("value"),
                    body_fat=aggregated_summary.get("bodyFat", {}).get("value"),
                    blood_glucose_avg=aggregated_summary.get("bloodGlucose", {}).get("average"),
                    blood_glucose_max=aggregated_summary.get("bloodGlucose", {}).get("max"),
                    blood_glucose_min=aggregated_summary.get("bloodGlucose", {}).get("min"),
                    oxygen_saturation_avg=aggregated_summary.get("oxygenSaturation", {}).get("average"),
                    oxygen_saturation_max=aggregated_summary.get("oxygenSaturation", {}).get("max"),
                    oxygen_saturation_min=aggregated_summary.get("oxygenSaturation", {}).get("min"),
                )
                trends.append(trend)

            return trends
        except Exception as e:
            logger.error(f"Error fetching wearable metrics: {e}", exc_info=True)
            return []

    async def _fetch_lab_reports(
        self, user_email: str, start_date: datetime, end_date: datetime
    ) -> List[LabReportExport]:
        """Fetch lab reports within time window"""
        try:
            from app.schemas.ai.lab_report import LabReportSummary, LabReportPropertyExtracted
            
            cursor = self.lab_reports_collection.find(
                {
                    "user_email": user_email,
                    "created_at": {"$gte": start_date, "$lte": end_date},
                }
            ).sort("created_at", -1)

            lab_reports_docs = await cursor.to_list(None)
            lab_reports = []

            for doc in lab_reports_docs:
                # Convert to LabReportSummary format for decryption
                summary_doc = {
                    "id": str(doc.get("_id", "")),
                    "test_title": doc.get("test_title", ""),
                    "test_description": doc.get("test_description", ""),
                    "test_date": doc.get("test_date"),
                    "properties_count": len(doc.get("properties", [])),
                    "filename": doc.get("filename", ""),
                    "created_at": doc.get("created_at", datetime.utcnow()),
                    "upload_id": doc.get("upload_id", ""),
                }
                
                # Decrypt using LabReportSummary schema (same pattern as lab_report_service)
                decrypted_summary = self.encryption_service.decrypt_document(
                    summary_doc, LabReportSummary
                )
                
                # Extract decrypted fields
                if isinstance(decrypted_summary, dict):
                    test_title = decrypted_summary.get("test_title", "")
                    test_description = decrypted_summary.get("test_description", "")
                    test_date = decrypted_summary.get("test_date")
                else:
                    test_title = getattr(decrypted_summary, "test_title", "")
                    test_description = getattr(decrypted_summary, "test_description", "")
                    test_date = getattr(decrypted_summary, "test_date", None)

                # Format test_date
                test_date_str = None
                if test_date:
                    if isinstance(test_date, datetime):
                        test_date_str = test_date.isoformat()
                    elif isinstance(test_date, str):
                        test_date_str = test_date
                    else:
                        test_date_str = str(test_date)

                # Decrypt properties
                properties = doc.get("properties", [])
                decrypted_properties = []
                if properties:
                    try:
                        for prop in properties:
                            decrypted_prop = self.encryption_service.decrypt_document(
                                prop, LabReportPropertyExtracted
                            )
                            if isinstance(decrypted_prop, dict):
                                decrypted_properties.append(decrypted_prop)
                            else:
                                decrypted_properties.append(decrypted_prop.model_dump() if hasattr(decrypted_prop, "model_dump") else {})
                    except Exception as prop_error:
                        logger.warning(f"Error decrypting properties: {prop_error}")
                        # Fallback: use raw properties
                        decrypted_properties = properties if isinstance(properties[0], dict) else []
                
                # Get and decrypt lab_name and doctor_name
                lab_name = doc.get("lab_name", "")
                doctor_name = doc.get("doctor_name", "")
                
                # Try to decrypt if they look encrypted (long base64 strings)
                if lab_name and isinstance(lab_name, str) and len(lab_name) > 50:
                    try:
                        lab_name = self.encryption_service._decrypt_value(lab_name)
                    except:
                        pass
                if doctor_name and isinstance(doctor_name, str) and len(doctor_name) > 50:
                    try:
                        doctor_name = self.encryption_service._decrypt_value(doctor_name)
                    except:
                        pass

                lab_report = LabReportExport(
                    test_title=test_title or "",
                    test_description=test_description or "",
                    test_date=test_date_str,
                    lab_name=lab_name or "",
                    doctor_name=doctor_name or "",
                    properties=decrypted_properties,
                )
                lab_reports.append(lab_report)

            return lab_reports
        except Exception as e:
            logger.error(f"Error fetching lab reports: {e}", exc_info=True)
            return []

    async def _fetch_goals_with_attainment(
        self, user_email: str, start_date: datetime, end_date: datetime
    ) -> List[GoalExport]:
        """Fetch goals and calculate attainment within time window"""
        try:
            # Fetch goals created or active within the time window
            cursor = self.goals_collection.find(
                {
                    "user_email": user_email,
                    "created_at": {"$lte": end_date},  # Goals created before end date
                }
            ).sort("created_at", -1)

            goals_docs = await cursor.to_list(None)
            goals = []

            for doc in goals_docs:
                # Decrypt goal
                goal_dict = self.encryption_service.decrypt_document(doc, Goal)
                goal_id = str(doc.get("_id", doc.get("id")))

                # Fetch action items for this goal
                action_items = await self.action_items_collection.find(
                    {"goal_id": goal_id}
                ).to_list(None)
                
                logger.info(f"Found {len(action_items)} action items for goal {goal_id} ({goal_dict.get('title', 'Untitled')})")

                action_items = self.encryption_service.decrypt_documents_bulk(
                    action_items, ActionItem
                )

                # Calculate completion within time window
                total_action_items = 0
                completed_action_items = 0

                for action_item in action_items:
                    weekly_schedule = action_item.get("weekly_schedule", {})
                    if not weekly_schedule:
                        continue

                    for daily_schedule in weekly_schedule.values():
                        if not daily_schedule or not isinstance(daily_schedule, dict):
                            continue

                        date_value = daily_schedule.get("date")
                        if not date_value:
                            continue

                        action_item_date = None
                        if isinstance(date_value, datetime):
                            action_item_date = date_value.replace(
                                tzinfo=timezone.utc
                            ) if date_value.tzinfo is None else date_value
                        elif isinstance(date_value, str):
                            if date_value.upper() in ['YYYY-MM-DD', 'YYYY/MM/DD', 'YYYY_MM_DD']:
                                continue
                            try:
                                action_item_date = datetime.fromisoformat(
                                    date_value.replace("Z", "+00:00")
                                )
                            except (ValueError, AttributeError):
                                try:
                                    action_item_date = datetime.strptime(date_value, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                                except ValueError:
                                    try:
                                        action_item_date = datetime.strptime(date_value.split("T")[0], "%Y-%m-%d").replace(tzinfo=timezone.utc)
                                    except (ValueError, IndexError):
                                        logger.debug(f"Could not parse date: {date_value} for goal {goal_id}")
                                        continue
                        else:
                            continue

                        if action_item_date is None:
                            continue

                        if action_item_date.tzinfo is None:
                            action_item_date = action_item_date.replace(tzinfo=timezone.utc)

                        action_date_only = action_item_date.date()
                        start_date_only = start_date.date()
                        end_date_only = end_date.date()
                        
                        if start_date_only <= action_date_only <= end_date_only:
                            total_action_items += 1
                            complete_status = daily_schedule.get("complete", False)
                            is_completed = False
                            if complete_status is True:
                                is_completed = True
                            elif isinstance(complete_status, str):
                                is_completed = complete_status.lower() in ["true", "1", "yes", "completed"]
                            elif isinstance(complete_status, (int, float)):
                                is_completed = bool(complete_status)
                            
                            if is_completed:
                                completed_action_items += 1

                completion_percentage = (
                    (completed_action_items / total_action_items * 100)
                    if total_action_items > 0
                    else 0.0
                )

                created_at_val = goal_dict.get("created_at")
                if created_at_val is None:
                    created_at_val = doc.get("created_at")
                
                if isinstance(created_at_val, datetime):
                    created_at_str = created_at_val.isoformat()
                elif created_at_val:
                    created_at_str = str(created_at_val)
                else:
                    created_at_str = ""  

                goal_export = GoalExport(
                    goal_id=goal_id,
                    title=goal_dict.get("title", ""),
                    category=goal_dict.get("category", "").value if hasattr(goal_dict.get("category"), "value") else str(goal_dict.get("category", "")),
                    priority=goal_dict.get("priority", "").value if hasattr(goal_dict.get("priority"), "value") else str(goal_dict.get("priority", "")),
                    created_at=created_at_str,
                    completed=goal_dict.get("completed", False),
                    completion_percentage=completion_percentage,
                    action_items_count=total_action_items,
                    completed_action_items_count=completed_action_items,
                )
                goals.append(goal_export)

            return goals
        except Exception as e:
            logger.error(f"Error fetching goals: {e}", exc_info=True)
            return []

    async def _fetch_medical_data(
        self, user_email: str, start_date: datetime, end_date: datetime
    ) -> tuple[List[MedicationExport], List[AllergyExport], List[ConditionExport]]:
        """Fetch medications, allergies, and conditions from uploaded files"""
        try:
            cursor = self.uploaded_files_collection.find(
                {
                    "user_email": user_email,
                    "created_at": {"$lte": end_date},  # Files uploaded before end date
                }
            ).sort("created_at", -1)

            uploaded_files_docs = await cursor.to_list(None)

            medications = []
            allergies = []
            conditions = []

            for doc in uploaded_files_docs:
                filename = doc.get("filename", "Unknown")
                created_at = doc.get("created_at", datetime.now(timezone.utc))
                created_at_str = (
                    created_at.isoformat()
                    if isinstance(created_at, datetime)
                    else str(created_at)
                )

                # Extract medications
                meds = doc.get("medications", [])
                for med in meds:
                    # Handle both dict and string formats
                    if isinstance(med, dict):
                        medication = MedicationExport(
                            name=med.get("name", ""),
                            dosage=med.get("dosage"),
                            frequency=med.get("frequency"),
                            source_file=filename,
                            extracted_at=created_at_str,
                        )
                    elif isinstance(med, str):
                        medication = MedicationExport(
                            name=med,
                            dosage=None,
                            frequency=None,
                            source_file=filename,
                            extracted_at=created_at_str,
                        )
                    else:
                        continue
                    medications.append(medication)

                # Extract allergies
                alls = doc.get("allergies", [])
                for allergy in alls:
                    # Handle both dict and string formats
                    if isinstance(allergy, dict):
                        allergy_export = AllergyExport(
                            allergen=allergy.get("allergen", ""),
                            reaction=allergy.get("reaction"),
                            severity=allergy.get("severity"),
                            source_file=filename,
                            extracted_at=created_at_str,
                        )
                    elif isinstance(allergy, str):
                        allergy_export = AllergyExport(
                            allergen=allergy,
                            reaction=None,
                            severity=None,
                            source_file=filename,
                            extracted_at=created_at_str,
                        )
                    else:
                        continue
                    allergies.append(allergy_export)

                # Extract conditions
                conds = doc.get("conditions_diagnoses", [])
                for cond in conds:
                    # Handle both dict and string formats
                    if isinstance(cond, dict):
                        condition = ConditionExport(
                            condition=cond.get("condition", cond.get("diagnosis", "")),
                            intent=cond.get("intent"),
                            source_file=filename,
                            extracted_at=created_at_str,
                        )
                    elif isinstance(cond, str):
                        # For legacy string format, no intent available
                        condition = ConditionExport(
                            condition=cond,
                            intent=None,
                            source_file=filename,
                            extracted_at=created_at_str,
                        )
                    else:
                        continue
                    conditions.append(condition)

            return medications, allergies, conditions
        except Exception as e:
            logger.error(f"Error fetching medical data: {e}", exc_info=True)
            return [], [], []

    def generate_csv(self, export_data: HealthExportData, domains: Optional[Set[DataDomain]] = None) -> bytes:
        """Generate CSV file from export data
        
        Args:
            export_data: The aggregated health data
            domains: Optional set of domains that were requested. If None, includes all non-empty domains.
        """
        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow(["Health Data Export"])
        writer.writerow([f"User: {export_data.user_email}"])
        writer.writerow([f"Time Window: {export_data.time_window_days} days"])
        writer.writerow([f"Start Date: {export_data.start_date.strftime('%B %d, %Y')}"])
        writer.writerow([f"End Date: {export_data.end_date.strftime('%B %d, %Y')}"])
        writer.writerow([])

        # If no domains specified, include all domains
        if domains is None:
            domains = set(DataDomain)

        # Wearable Metrics
        if DataDomain.WEARABLES in domains:
            writer.writerow(["WEARABLE METRICS & TRENDS"])
            writer.writerow(
                [
                    "Date",
                    "Steps",
                    "Heart Rate (Avg)",
                    "Heart Rate (Max)",
                    "Heart Rate (Min)",
                    "Active Energy (kcal)",
                    "Sleep (Hours)",
                    "Weight",
                    "Body Fat (%)",
                    "Blood Glucose (Avg)",
                    "Blood Glucose (Max)",
                    "Blood Glucose (Min)",
                    "Oxygen Saturation (Avg)",
                    "Oxygen Saturation (Max)",
                    "Oxygen Saturation (Min)",
                ]
            )
            for metric in export_data.wearable_metrics:
                writer.writerow(
                    [
                        metric.date,
                        metric.steps or "",
                        metric.heart_rate_avg or "",
                        metric.heart_rate_max or "",
                        metric.heart_rate_min or "",
                        metric.active_energy or "",
                        metric.sleep_hours or "",
                        metric.weight or "",
                        metric.body_fat or "",
                        metric.blood_glucose_avg or "",
                        metric.blood_glucose_max or "",
                        metric.blood_glucose_min or "",
                        metric.oxygen_saturation_avg or "",
                        metric.oxygen_saturation_max or "",
                        metric.oxygen_saturation_min or "",
                    ]
                )
            writer.writerow([])

        # Lab Reports
        if DataDomain.LABS in domains:
            writer.writerow(["LAB REPORTS"])
            writer.writerow(
                [
                    "Test Title",
                    "Test Description",
                    "Test Date",
                    "Lab Name",
                    "Doctor Name",
                    "Properties Count",
                ]
            )
            for lab in export_data.lab_reports:
                writer.writerow(
                    [
                        lab.test_title or "",
                        lab.test_description or "",
                        lab.test_date or "",
                        lab.lab_name or "",
                        lab.doctor_name or "",
                        len(lab.properties),
                    ]
                )
            writer.writerow([])

        # Goals
        if DataDomain.GOALS in domains:
            writer.writerow(["GOALS & GOAL ATTAINMENT"])
            writer.writerow(
                [
                    "Title",
                    "Category",
                    "Priority",
                    "Created At",
                    "Status",
                    "Completion %",
                    "Completed Actions",
                    "Total Actions",
                ]
            )
            for goal in export_data.goals:
                writer.writerow(
                    [
                        goal.title,
                        goal.category,
                        goal.priority,
                        goal.created_at,
                        "Completed" if goal.completed else "In Progress",
                        f"{goal.completion_percentage:.1f}%",
                        goal.completed_action_items_count,
                        goal.action_items_count,
                    ]
                )
            writer.writerow([])

        # Medications
        if DataDomain.MEDICATIONS in domains:
            writer.writerow(["MEDICATIONS"])
            writer.writerow(["Name", "Dosage", "Frequency", "Source"])
            for med in export_data.medications:
                writer.writerow(
                    [
                        med.name,
                        med.dosage or "",
                        med.frequency or "",
                        med.source_file or "",
                    ]
                )
            writer.writerow([])

        # Allergies
        if DataDomain.ALLERGIES in domains:
            writer.writerow(["ALLERGIES"])
            writer.writerow(
                ["Allergen", "Reaction", "Severity", "Source"]
            )
            for allergy in export_data.allergies:
                writer.writerow(
                    [
                        allergy.allergen,
                        allergy.reaction or "",
                        allergy.severity or "",
                        allergy.source_file or "",
                    ]
                )
            writer.writerow([])

        # Conditions
        if DataDomain.CONDITIONS in domains:
            writer.writerow(["CONDITIONS"])
            writer.writerow(["Condition", "Intent", "Source"])
            for condition in export_data.conditions:
                writer.writerow(
                    [
                        condition.condition,
                        condition.intent or "",
                        condition.source_file or "",
                    ]
                )
            writer.writerow([])

        return output.getvalue().encode("utf-8")

    def generate_pdf(self, export_data: HealthExportData, domains: Optional[Set[DataDomain]] = None) -> bytes:
        """Generate PDF file from export data
        
        Args:
            export_data: The aggregated health data
            domains: Optional set of domains that were requested. If None, includes all non-empty domains.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        styles = getSampleStyleSheet()

        # If no domains specified, include all domains
        if domains is None:
            domains = set(DataDomain)

        # Title style
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            fontSize=16,
            textColor=colors.HexColor("#1a1a1a"),
            spaceAfter=12,
        )

        # Section style
        section_style = ParagraphStyle(
            "CustomSection",
            parent=styles["Heading2"],
            fontSize=14,
            textColor=colors.HexColor("#2c3e50"),
            spaceAfter=6,
            spaceBefore=12,
        )

        # Header
        story.append(Paragraph("Health Data Export", title_style))
        story.append(Spacer(1, 0.2 * inch))
        story.append(Paragraph(f"User: {export_data.user_email}", styles["Normal"]))
        story.append(
            Paragraph(
                f"Time Window: {export_data.time_window_days} days", styles["Normal"]
            )
        )
        story.append(
            Paragraph(
                f"Period: {export_data.start_date.strftime('%B %d, %Y')} to {export_data.end_date.strftime('%B %d, %Y')}",
                styles["Normal"],
            )
        )
        story.append(Spacer(1, 0.3 * inch))

        # Wearable Metrics
        if DataDomain.WEARABLES in domains:
            story.append(Paragraph("Wearable Metrics & Trends", section_style))
            if export_data.wearable_metrics:
                headers = [
                    "Date",
                    "Steps",
                    "HR Avg",
                    "Sleep (hrs)",
                    "Weight",
                    "BG Avg",
                ]
                data = [headers]
                for metric in export_data.wearable_metrics[:50]:  # Limit to 50 rows
                    data.append(
                        [
                            metric.date,
                            str(metric.steps) if metric.steps else "-",
                            f"{metric.heart_rate_avg:.1f}" if metric.heart_rate_avg else "-",
                            f"{metric.sleep_hours:.1f}" if metric.sleep_hours else "-",
                            f"{metric.weight:.1f}" if metric.weight else "-",
                            f"{metric.blood_glucose_avg:.1f}" if metric.blood_glucose_avg else "-",
                        ]
                    )
                table = Table(data)
                table.setStyle(
                    TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                            ("FONTSIZE", (0, 0), (-1, 0), 10),
                            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                            ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                            ("GRID", (0, 0), (-1, -1), 1, colors.black),
                            ("FONTSIZE", (0, 1), (-1, -1), 8),
                        ]
                    )
                )
                story.append(table)
            else:
                story.append(Paragraph("No wearable metrics data available.", styles["Normal"]))
            story.append(Spacer(1, 0.2 * inch))

        # Lab Reports
        if DataDomain.LABS in domains:
            story.append(Paragraph("Lab Reports", section_style))
            if export_data.lab_reports:
                headers = ["Test Title", "Test Date", "Lab Name", "Properties"]
                data = [headers]
                for lab in export_data.lab_reports:
                    data.append(
                        [
                            lab.test_title or "-",
                            lab.test_date or "-",
                            lab.lab_name or "-",
                            str(len(lab.properties)),
                        ]
                    )
                table = Table(data)
                table.setStyle(
                    TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                            ("FONTSIZE", (0, 0), (-1, 0), 10),
                            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                            ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                            ("GRID", (0, 0), (-1, -1), 1, colors.black),
                            ("FONTSIZE", (0, 1), (-1, -1), 9),
                        ]
                    )
                )
                story.append(table)
            else:
                story.append(Paragraph("No lab reports available.", styles["Normal"]))
            story.append(Spacer(1, 0.2 * inch))

        # Goals
        if DataDomain.GOALS in domains:
            story.append(Paragraph("Goals & Goal Attainment", section_style))
            if export_data.goals:
                headers = ["Goal", "Category", "Priority", "Adherence", "Status"]
                data = [headers]
                for goal in export_data.goals:
                    data.append(
                        [
                            goal.title[:35] + "..." if len(goal.title) > 35 else goal.title,
                            goal.category,
                            goal.priority,
                            f"{goal.completion_percentage:.1f}%",
                            "✓ Done" if goal.completed else "In Progress",
                        ]
                    )
                table = Table(data)
                table.setStyle(
                    TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                            ("FONTSIZE", (0, 0), (-1, 0), 10),
                            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                            ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                            ("GRID", (0, 0), (-1, -1), 1, colors.black),
                            ("FONTSIZE", (0, 1), (-1, -1), 9),
                        ]
                    )
                )
                story.append(table)
            else:
                story.append(Paragraph("No goals available.", styles["Normal"]))
            story.append(Spacer(1, 0.2 * inch))

        # Medications
        if DataDomain.MEDICATIONS in domains:
            story.append(Paragraph("Medications", section_style))
            if export_data.medications:
                headers = ["Name", "Dosage", "Frequency", "Source"]
                data = [headers]
                for med in export_data.medications:
                    data.append(
                        [
                            med.name,
                            med.dosage or "-",
                            med.frequency or "-",
                            med.source_file or "-",
                        ]
                    )
                table = Table(data)
                table.setStyle(
                    TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                            ("FONTSIZE", (0, 0), (-1, 0), 10),
                            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                            ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                            ("GRID", (0, 0), (-1, -1), 1, colors.black),
                            ("FONTSIZE", (0, 1), (-1, -1), 9),
                        ]
                    )
                )
                story.append(table)
            else:
                story.append(Paragraph("No medications recorded.", styles["Normal"]))
            story.append(Spacer(1, 0.2 * inch))

        # Allergies
        if DataDomain.ALLERGIES in domains:
            story.append(Paragraph("Allergies", section_style))
            if export_data.allergies:
                headers = ["Allergen", "Reaction", "Severity", "Source"]
                data = [headers]
                for allergy in export_data.allergies:
                    data.append(
                        [
                            allergy.allergen,
                            allergy.reaction or "-",
                            allergy.severity or "-",
                            allergy.source_file or "-",
                        ]
                    )
                table = Table(data)
                table.setStyle(
                    TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                            ("FONTSIZE", (0, 0), (-1, 0), 10),
                            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                            ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                            ("GRID", (0, 0), (-1, -1), 1, colors.black),
                            ("FONTSIZE", (0, 1), (-1, -1), 9),
                        ]
                    )
                )
                story.append(table)
            else:
                story.append(Paragraph("No allergies recorded.", styles["Normal"]))
            story.append(Spacer(1, 0.2 * inch))

        # Conditions
        if DataDomain.CONDITIONS in domains:
            story.append(Paragraph("Conditions", section_style))
            if export_data.conditions:
                headers = ["Condition", "Intent", "Source"]
                data = [headers]
                for condition in export_data.conditions:
                    intent_display = condition.intent.capitalize() if condition.intent else "-"
                    data.append(
                        [
                            condition.condition,
                            intent_display,
                            condition.source_file or "-",
                        ]
                    )
                table = Table(data)
                table.setStyle(
                    TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                            ("FONTSIZE", (0, 0), (-1, 0), 10),
                            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                            ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                            ("GRID", (0, 0), (-1, -1), 1, colors.black),
                            ("FONTSIZE", (0, 1), (-1, -1), 9),
                        ]
                    )
                )
                story.append(table)
            else:
                story.append(Paragraph("No conditions recorded.", styles["Normal"]))
            story.append(Spacer(1, 0.2 * inch))

        doc.build(story)
        return buffer.getvalue()

    def generate_xml(self, export_data: HealthExportData, domains: Optional[Set[DataDomain]] = None) -> bytes:
        """Generate XML file from export data
        
        Args:
            export_data: The aggregated health data
            domains: Optional set of domains that were requested. If None, includes all non-empty domains.
        """
        root = ET.Element("HealthExport")
        root.set("user_email", export_data.user_email)
        root.set("time_window_days", str(export_data.time_window_days))
        root.set("start_date", export_data.start_date.strftime('%Y-%m-%d'))
        root.set("end_date", export_data.end_date.strftime('%Y-%m-%d'))
        root.set("generated_at", datetime.now(timezone.utc).isoformat())

        if domains is None:
            domains = set(DataDomain)

        disclaimer = ET.SubElement(root, "Disclaimer")
        disclaimer.text = "This export is a Patient-Generated Health Summary. It does not constitute a medical record and does not replace clinical judgment."

        if DataDomain.WEARABLES in domains and export_data.wearable_metrics:
            wearables = ET.SubElement(root, "WearableMetrics")
            for metric in export_data.wearable_metrics:
                m = ET.SubElement(wearables, "Metric")
                m.set("date", metric.date)
                for field in metric.model_dump(exclude={"date"}, exclude_none=True):
                    val = getattr(metric, field)
                    if val is not None:
                        elem = ET.SubElement(m, field)
                        elem.text = str(val)

        if DataDomain.LABS in domains and export_data.lab_reports:
            labs = ET.SubElement(root, "LabReports")
            for lab in export_data.lab_reports:
                l = ET.SubElement(labs, "Report")
                if lab.test_title: 
                    l.set("title", lab.test_title)
                if lab.test_date: 
                    l.set("date", lab.test_date)
                if lab.lab_name: 
                    ET.SubElement(l, "LabName").text = lab.lab_name
                if lab.doctor_name: 
                    ET.SubElement(l, "DoctorName").text = lab.doctor_name
                
                if lab.properties:
                    props = ET.SubElement(l, "Properties")
                    for prop in lab.properties:
                        if isinstance(prop, dict):
                            p = ET.SubElement(props, "Property")
                            p.set("name", prop.get("property_name", prop.get("test_name", "")))
                            if prop.get("value"):
                                p.text = str(prop.get("value"))
                            if prop.get("unit"): 
                                p.set("unit", prop.get("unit"))
                            if prop.get("reference_range"): 
                                p.set("range", prop.get("reference_range"))

        if DataDomain.GOALS in domains and export_data.goals:
            goals = ET.SubElement(root, "Goals")
            for goal in export_data.goals:
                g = ET.SubElement(goals, "Goal")
                g.set("id", goal.goal_id)
                g.set("status", "Completed" if goal.completed else "In Progress")
                ET.SubElement(g, "Name").text = goal.title
                ET.SubElement(g, "CreatedAt").text = goal.created_at
                ET.SubElement(g, "AdherencePercentage").text = f"{goal.completion_percentage:.1f}"
                if goal.category: 
                    ET.SubElement(g, "Category").text = goal.category
                if goal.priority: 
                    ET.SubElement(g, "Priority").text = goal.priority

        if DataDomain.MEDICATIONS in domains and export_data.medications:
            meds = ET.SubElement(root, "Medications")
            for med in export_data.medications:
                m = ET.SubElement(meds, "Medication")
                ET.SubElement(m, "Name").text = med.name
                if med.dosage: 
                    ET.SubElement(m, "Dosage").text = med.dosage
                if med.frequency: 
                    ET.SubElement(m, "Frequency").text = med.frequency
                if med.source_file: 
                    ET.SubElement(m, "Source").text = med.source_file

        if DataDomain.ALLERGIES in domains and export_data.allergies:
            allergies = ET.SubElement(root, "Allergies")
            for allergy in export_data.allergies:
                a = ET.SubElement(allergies, "Allergy")
                ET.SubElement(a, "Allergen").text = allergy.allergen
                if allergy.reaction: 
                    ET.SubElement(a, "Reaction").text = allergy.reaction
                if allergy.severity: 
                    ET.SubElement(a, "Severity").text = allergy.severity
                if allergy.source_file: 
                    ET.SubElement(a, "Source").text = allergy.source_file

        if DataDomain.CONDITIONS in domains and export_data.conditions:
            conds = ET.SubElement(root, "HealthFocusAreas")
            for condition in export_data.conditions:
                c = ET.SubElement(conds, "Condition")
                ET.SubElement(c, "Name").text = condition.condition
                if condition.intent:
                    ET.SubElement(c, "Intent").text = condition.intent
                if condition.source_file: 
                    ET.SubElement(c, "Source").text = condition.source_file
                if condition.extracted_at: 
                    ET.SubElement(c, "ExtractedAt").text = condition.extracted_at

        xml_str = minidom.parseString(ET.tostring(root)).toprettyxml(indent="  ")
        return xml_str.encode("utf-8")


# Global instance
_health_export_service = None


def get_health_export_service() -> HealthExportService:
    global _health_export_service
    if _health_export_service is None:
        _health_export_service = HealthExportService()
    return _health_export_service

