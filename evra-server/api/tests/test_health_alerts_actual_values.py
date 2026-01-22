"""
Test to verify that health alerts contain actual metric values from uploaded hourly health data,
not hardcoded values.
"""
import pytest
from datetime import datetime, timezone
from app.services.backend_services.health_alert_service import get_health_alert_service
from app.schemas.backend.health_alert import (
    HealthMetricData,
    HealthMetric,
    HealthMetricHourlyData,
)


@pytest.mark.asyncio
async def test_health_alerts_contain_actual_values():
    """Test that alerts generated from hourly health data contain actual values, not hardcoded ones"""
    service = get_health_alert_service()
    test_user_email = "test_actual_values@example.com"
    
    # Create test hourly health data with specific values
    test_steps_value = 50  # Below threshold of 100
    test_heart_rate_value = 45  # Below threshold of 50
    test_blood_glucose_value = 55  # Below threshold of 60
    
    test_health_data = HealthMetricData(
        steps=HealthMetric(value=test_steps_value, unit="steps", isAvailable=True, error=""),
        heartRate=HealthMetric(value=test_heart_rate_value, unit="bpm", isAvailable=True, error=""),
        activeEnergy=HealthMetric(value=25, unit="kcal/hour", isAvailable=True, error=""),
        sleep=HealthMetric(value=3, unit="hours", isAvailable=True, error=""),
        weight=HealthMetric(value=70, unit="kg", isAvailable=True, error=""),
        bodyFat=HealthMetric(value=15, unit="%", isAvailable=True, error=""),
        bloodGlucose=HealthMetric(value=test_blood_glucose_value, unit="mg/dL", isAvailable=True, error=""),
        oxygenSaturation=HealthMetric(value=88, unit="%", isAvailable=True, error=""),
    )
    
    # Upload hourly health data
    hourly_data = await service.store_hourly_health_data(test_user_email, test_health_data)
    
    # Get active alerts
    alerts = await service.get_active_health_alerts(test_user_email)
    
    # Verify alerts were created
    assert len(alerts) > 0, "No alerts were generated from test data"
    
    # Find alerts for our test metrics
    steps_alert = next((a for a in alerts if a.metric.value == "steps"), None)
    heart_rate_alert = next((a for a in alerts if a.metric.value == "heartRate"), None)
    blood_glucose_alert = next((a for a in alerts if a.metric.value == "bloodGlucose"), None)
    
    # Verify steps alert contains actual value
    if steps_alert:
        assert hasattr(steps_alert, 'current_value'), "Alert missing current_value field"
        assert steps_alert.current_value == test_steps_value, \
            f"Steps alert current_value ({steps_alert.current_value}) doesn't match uploaded value ({test_steps_value})"
        assert steps_alert.current_value is not None, "Steps alert current_value is None"
        assert isinstance(steps_alert.current_value, (int, float)), "Steps alert current_value is not a number"
        print(f"✅ Steps alert: current_value={steps_alert.current_value}, threshold_value={steps_alert.threshold_value}, unit={steps_alert.unit}")
    
    # Verify heart rate alert contains actual value
    if heart_rate_alert:
        assert hasattr(heart_rate_alert, 'current_value'), "Alert missing current_value field"
        assert heart_rate_alert.current_value == test_heart_rate_value, \
            f"Heart rate alert current_value ({heart_rate_alert.current_value}) doesn't match uploaded value ({test_heart_rate_value})"
        assert heart_rate_alert.current_value is not None, "Heart rate alert current_value is None"
        assert isinstance(heart_rate_alert.current_value, (int, float)), "Heart rate alert current_value is not a number"
        print(f"✅ Heart rate alert: current_value={heart_rate_alert.current_value}, threshold_value={heart_rate_alert.threshold_value}, unit={heart_rate_alert.unit}")
    
    # Verify blood glucose alert contains actual value
    if blood_glucose_alert:
        assert hasattr(blood_glucose_alert, 'current_value'), "Alert missing current_value field"
        assert blood_glucose_alert.current_value == test_blood_glucose_value, \
            f"Blood glucose alert current_value ({blood_glucose_alert.current_value}) doesn't match uploaded value ({test_blood_glucose_value})"
        assert blood_glucose_alert.current_value is not None, "Blood glucose alert current_value is None"
        assert isinstance(blood_glucose_alert.current_value, (int, float)), "Blood glucose alert current_value is not a number"
        print(f"✅ Blood glucose alert: current_value={blood_glucose_alert.current_value}, threshold_value={blood_glucose_alert.threshold_value}, unit={blood_glucose_alert.unit}")
    
    # Verify all alerts have the required fields
    for alert in alerts:
        assert hasattr(alert, 'current_value'), f"Alert for {alert.metric.value} missing current_value"
        assert hasattr(alert, 'threshold_value'), f"Alert for {alert.metric.value} missing threshold_value"
        assert hasattr(alert, 'unit'), f"Alert for {alert.metric.value} missing unit"
        assert alert.current_value is not None, f"Alert for {alert.metric.value} has None current_value"
        assert alert.threshold_value is not None, f"Alert for {alert.metric.value} has None threshold_value"
        assert alert.unit is not None, f"Alert for {alert.metric.value} has None unit"
    
    print(f"\n✅ All {len(alerts)} alerts contain actual metric values from uploaded health data!")


@pytest.mark.asyncio
async def test_alert_values_match_uploaded_data():
    """Test that alert values exactly match the values in uploaded hourly health data"""
    service = get_health_alert_service()
    test_user_email = "test_exact_match@example.com"
    
    # Use very specific values to ensure we can verify exact matches
    specific_values = {
        "steps": 75,  # Below threshold
        "heartRate": 48,  # Below threshold
        "bloodGlucose": 58,  # Below threshold
        "oxygenSaturation": 89,  # Below threshold
    }
    
    test_health_data = HealthMetricData(
        steps=HealthMetric(value=specific_values["steps"], unit="steps", isAvailable=True, error=""),
        heartRate=HealthMetric(value=specific_values["heartRate"], unit="bpm", isAvailable=True, error=""),
        activeEnergy=HealthMetric(value=20, unit="kcal/hour", isAvailable=True, error=""),
        sleep=HealthMetric(value=3.5, unit="hours", isAvailable=True, error=""),
        weight=HealthMetric(value=70, unit="kg", isAvailable=True, error=""),
        bodyFat=HealthMetric(value=15, unit="%", isAvailable=True, error=""),
        bloodGlucose=HealthMetric(value=specific_values["bloodGlucose"], unit="mg/dL", isAvailable=True, error=""),
        oxygenSaturation=HealthMetric(value=specific_values["oxygenSaturation"], unit="%", isAvailable=True, error=""),
    )
    
    # Upload hourly health data
    await service.store_hourly_health_data(test_user_email, test_health_data)
    
    # Get active alerts
    alerts = await service.get_active_health_alerts(test_user_email)
    
    # Verify exact value matches
    for metric_name, expected_value in specific_values.items():
        alert = next((a for a in alerts if a.metric.value == metric_name), None)
        if alert:
            assert alert.current_value == expected_value, \
                f"{metric_name} alert value mismatch: expected {expected_value}, got {alert.current_value}"
            print(f"✅ {metric_name}: uploaded={expected_value}, alert={alert.current_value} ✓")
    
    print("\n✅ All alert values exactly match uploaded health data values!")

