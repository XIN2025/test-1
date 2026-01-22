"""
Manual test script to verify health alerts contain actual values from uploaded data.
Run this to verify the fix works correctly.
"""
import asyncio
import sys
from datetime import datetime, timezone
from app.services.backend_services.health_alert_service import get_health_alert_service
from app.schemas.backend.health_alert import (
    HealthMetricData,
    HealthMetric,
)


async def test_alert_values():
    """Test that alerts contain actual values from uploaded health data"""
    service = get_health_alert_service()
    test_user_email = "test_manual@example.com"
    
    print("=" * 60)
    print("Testing Health Alerts with Actual Values")
    print("=" * 60)
    
    # Create test data with specific values
    test_values = {
        "steps": 75,  # Below threshold of 100
        "heartRate": 48,  # Below threshold of 50
        "bloodGlucose": 58,  # Below threshold of 60
    }
    
    print(f"\n📊 Uploading test health data:")
    print(f"  - Steps: {test_values['steps']} (threshold: 100)")
    print(f"  - Heart Rate: {test_values['heartRate']} bpm (threshold: 50)")
    print(f"  - Blood Glucose: {test_values['bloodGlucose']} mg/dL (threshold: 60)")
    
    test_health_data = HealthMetricData(
        steps=HealthMetric(value=test_values["steps"], unit="steps", isAvailable=True, error=""),
        heartRate=HealthMetric(value=test_values["heartRate"], unit="bpm", isAvailable=True, error=""),
        activeEnergy=HealthMetric(value=25, unit="kcal/hour", isAvailable=True, error=""),
        sleep=HealthMetric(value=3, unit="hours", isAvailable=True, error=""),
        weight=HealthMetric(value=70, unit="kg", isAvailable=True, error=""),
        bodyFat=HealthMetric(value=15, unit="%", isAvailable=True, error=""),
        bloodGlucose=HealthMetric(value=test_values["bloodGlucose"], unit="mg/dL", isAvailable=True, error=""),
        oxygenSaturation=HealthMetric(value=88, unit="%", isAvailable=True, error=""),
    )
    
    try:
        # Upload hourly health data
        hourly_data = await service.store_hourly_health_data(test_user_email, test_health_data)
        print(f"\n✅ Health data uploaded successfully")
        
        # Wait a moment for alerts to be generated
        await asyncio.sleep(2)
        
        # Get active alerts
        alerts = await service.get_active_health_alerts(test_user_email)
        
        print(f"\n📋 Retrieved {len(alerts)} active alert(s)")
        print("=" * 60)
        
        if len(alerts) == 0:
            print("⚠️  No alerts generated. This might be expected if alerts were filtered.")
            return
        
        # Check each alert
        all_correct = True
        for alert in alerts:
            metric_name = alert.metric.value if hasattr(alert.metric, 'value') else str(alert.metric)
            print(f"\n🔔 Alert: {alert.title}")
            print(f"   Metric: {metric_name}")
            print(f"   Severity: {alert.severity.value if hasattr(alert.severity, 'value') else alert.severity}")
            
            # Check if alert has actual values
            has_current = hasattr(alert, 'current_value')
            has_threshold = hasattr(alert, 'threshold_value')
            has_unit = hasattr(alert, 'unit')
            
            if has_current and has_threshold and has_unit:
                current_val = alert.current_value
                threshold_val = alert.threshold_value
                unit = alert.unit
                
                print(f"   ✅ Current Value: {current_val} {unit}")
                print(f"   ✅ Threshold Value: {threshold_val} {unit}")
                print(f"   ✅ Unit: {unit}")
                
                # Verify value matches uploaded data
                if metric_name in test_values:
                    expected = test_values[metric_name]
                    if current_val == expected:
                        print(f"   ✅ Value matches uploaded data: {current_val} == {expected}")
                    else:
                        print(f"   ❌ Value mismatch: expected {expected}, got {current_val}")
                        all_correct = False
                else:
                    print(f"   ⚠️  Metric {metric_name} not in test values to verify")
            else:
                print(f"   ❌ Missing value fields:")
                if not has_current:
                    print(f"      - Missing current_value")
                if not has_threshold:
                    print(f"      - Missing threshold_value")
                if not has_unit:
                    print(f"      - Missing unit")
                all_correct = False
        
        print("\n" + "=" * 60)
        if all_correct:
            print("✅ SUCCESS: All alerts contain actual values from uploaded health data!")
        else:
            print("❌ FAILURE: Some alerts are missing actual values or have incorrect values")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error during test: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_alert_values())

