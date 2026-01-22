"""
Test the LLM guardrails and validation logic
"""
import sys
import os
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_validation_function():
    """Test the _validate_and_fix_llm_response function logic"""
    print("\n=== Test: LLM Response Validation ===\n")
    
    # Simulate the validation logic
    def get_current_week_dates_dict():
        now = datetime.now(timezone.utc)
        days_since_monday = now.weekday()
        monday = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
        weekday_names_lower = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        week_dates_dict = {}
        for i in range(7):
            day_date = monday + timedelta(days=i)
            date_str = day_date.strftime("%Y-%m-%d")
            week_dates_dict[weekday_names_lower[i]] = date_str
        return week_dates_dict
    
    def validate_and_fix_llm_response(action_item_with_schedule, week_dates_str):
        """Simulate the validation function"""
        week_dates_fallback = get_current_week_dates_dict()
        
        # Parse week dates from string
        week_dates_map = {}
        for line in week_dates_str.strip().split("\n"):
            if ":" in line:
                parts = line.strip().split(":")
                if len(parts) == 2:
                    day_name = parts[0].strip().lower()
                    date_str = parts[1].strip()
                    week_dates_map[day_name] = date_str
        
        if not week_dates_map:
            week_dates_map = week_dates_fallback
        
        required_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        issues_found = []
        fixes_applied = []
        
        for action_item in action_item_with_schedule.get("action_items", []):
            weekly_schedule = action_item.get("weekly_schedule", {})
            
            # Check for missing days
            missing_days = [day for day in required_days if day not in weekly_schedule]
            if missing_days:
                issues_found.append(f"Missing days: {missing_days}")
                for day in missing_days:
                    fallback_date = week_dates_map.get(day, week_dates_fallback.get(day))
                    if fallback_date:
                        weekly_schedule[day] = {
                            "date": fallback_date,
                            "start_time": "09:00:00",
                            "end_time": "10:00:00",
                            "notes": None
                        }
                        fixes_applied.append(f"Added missing {day} with date {fallback_date}")
            
            # Validate and fix each day's date
            for day in required_days:
                if day not in weekly_schedule:
                    continue
                    
                day_schedule = weekly_schedule[day]
                date_str = day_schedule.get("date", "")
                
                # Check for placeholder dates
                if isinstance(date_str, str) and date_str.upper() in ['YYYY-MM-DD', 'YYYY/MM/DD', 'YYYY_MM_DD', 'YYYY-MM-DD (ACTUAL DATE)']:
                    issues_found.append(f"{day}: placeholder date '{date_str}'")
                    fallback_date = week_dates_map.get(day, week_dates_fallback.get(day))
                    if fallback_date:
                        day_schedule["date"] = fallback_date
                        fixes_applied.append(f"{day}: replaced placeholder with {fallback_date}")
                
                # Validate date format
                elif isinstance(date_str, str):
                    try:
                        datetime.strptime(date_str, "%Y-%m-%d")
                    except ValueError:
                        issues_found.append(f"{day}: invalid date format '{date_str}'")
                        fallback_date = week_dates_map.get(day, week_dates_fallback.get(day))
                        if fallback_date:
                            day_schedule["date"] = fallback_date
                            fixes_applied.append(f"{day}: replaced invalid date with {fallback_date}")
        
        return {
            "action_item_with_schedule": action_item_with_schedule,
            "issues_found": issues_found,
            "fixes_applied": fixes_applied
        }
    
    # Test Case 1: LLM response with placeholder dates
    print("Test Case 1: LLM response with placeholder dates")
    week_dates_str = """  Monday: 2025-11-17
  Tuesday: 2025-11-18
  Wednesday: 2025-11-19
  Thursday: 2025-11-20
  Friday: 2025-11-21
  Saturday: 2025-11-22
  Sunday: 2025-11-23"""
    
    mock_llm_response = {
        "action_items": [
            {
                "title": "Test Action",
                "description": "Test description",
                "priority": "high",
                "weekly_schedule": {
                    "monday": {"date": "2025-11-17", "start_time": "08:00:00", "end_time": "09:00:00", "notes": None},
                    "tuesday": {"date": "YYYY-MM-DD", "start_time": "08:00:00", "end_time": "09:00:00", "notes": None},
                    "wednesday": {"date": "2025-11-19", "start_time": "08:00:00", "end_time": "09:00:00", "notes": None},
                    "thursday": {"date": "2025-11-20", "start_time": "08:00:00", "end_time": "09:00:00", "notes": None},
                    "friday": {"date": "2025-11-21", "start_time": "08:00:00", "end_time": "09:00:00", "notes": None},
                    "saturday": {"date": "2025-11-22", "start_time": "08:00:00", "end_time": "09:00:00", "notes": None},
                    "sunday": {"date": "YYYY-MM-DD", "start_time": "08:00:00", "end_time": "09:00:00", "notes": None}
                }
            }
        ]
    }
    
    result = validate_and_fix_llm_response(mock_llm_response, week_dates_str)
    
    print(f"  Issues found: {len(result['issues_found'])}")
    print(f"  Fixes applied: {len(result['fixes_applied'])}")
    
    # Verify fixes
    fixed_schedule = result['action_item_with_schedule']['action_items'][0]['weekly_schedule']
    tuesday_date = fixed_schedule['tuesday']['date']
    sunday_date = fixed_schedule['sunday']['date']
    
    if tuesday_date == "2025-11-18" and sunday_date == "2025-11-23":
        print("  ✅ Placeholder dates fixed correctly")
    else:
        print(f"  ❌ FAILED: Tuesday={tuesday_date}, Sunday={sunday_date}")
        return False
    
    # Test Case 2: Missing Sunday
    print("\nTest Case 2: Missing Sunday day")
    mock_llm_response2 = {
        "action_items": [
            {
                "title": "Test Action",
                "description": "Test description",
                "priority": "high",
                "weekly_schedule": {
                    "monday": {"date": "2025-11-17", "start_time": "08:00:00", "end_time": "09:00:00", "notes": None},
                    "tuesday": {"date": "2025-11-18", "start_time": "08:00:00", "end_time": "09:00:00", "notes": None},
                    "wednesday": {"date": "2025-11-19", "start_time": "08:00:00", "end_time": "09:00:00", "notes": None},
                    "thursday": {"date": "2025-11-20", "start_time": "08:00:00", "end_time": "09:00:00", "notes": None},
                    "friday": {"date": "2025-11-21", "start_time": "08:00:00", "end_time": "09:00:00", "notes": None},
                    "saturday": {"date": "2025-11-22", "start_time": "08:00:00", "end_time": "09:00:00", "notes": None}
                    # Sunday is missing!
                }
            }
        ]
    }
    
    result2 = validate_and_fix_llm_response(mock_llm_response2, week_dates_str)
    
    print(f"  Issues found: {len(result2['issues_found'])}")
    print(f"  Fixes applied: {len(result2['fixes_applied'])}")
    
    fixed_schedule2 = result2['action_item_with_schedule']['action_items'][0]['weekly_schedule']
    
    if 'sunday' in fixed_schedule2:
        sunday_date2 = fixed_schedule2['sunday']['date']
        if sunday_date2 == "2025-11-23":
            print("  ✅ Missing Sunday added correctly")
        else:
            print(f"  ❌ FAILED: Sunday date is {sunday_date2}, expected 2025-11-23")
            return False
    else:
        print("  ❌ FAILED: Sunday still missing after validation")
        return False
    
    # Test Case 3: Invalid date format
    print("\nTest Case 3: Invalid date format")
    mock_llm_response3 = {
        "action_items": [
            {
                "title": "Test Action",
                "description": "Test description",
                "priority": "high",
                "weekly_schedule": {
                    "monday": {"date": "2025-11-17", "start_time": "08:00:00", "end_time": "09:00:00", "notes": None},
                    "tuesday": {"date": "2025-11-18", "start_time": "08:00:00", "end_time": "09:00:00", "notes": None},
                    "wednesday": {"date": "2025-11-19", "start_time": "08:00:00", "end_time": "09:00:00", "notes": None},
                    "thursday": {"date": "2025-11-20", "start_time": "08:00:00", "end_time": "09:00:00", "notes": None},
                    "friday": {"date": "2025-11-21", "start_time": "08:00:00", "end_time": "09:00:00", "notes": None},
                    "saturday": {"date": "2025-11-22", "start_time": "08:00:00", "end_time": "09:00:00", "notes": None},
                    "sunday": {"date": "invalid-date-format", "start_time": "08:00:00", "end_time": "09:00:00", "notes": None}
                }
            }
        ]
    }
    
    result3 = validate_and_fix_llm_response(mock_llm_response3, week_dates_str)
    
    print(f"  Issues found: {len(result3['issues_found'])}")
    print(f"  Fixes applied: {len(result3['fixes_applied'])}")
    
    fixed_schedule3 = result3['action_item_with_schedule']['action_items'][0]['weekly_schedule']
    sunday_date3 = fixed_schedule3['sunday']['date']
    
    if sunday_date3 == "2025-11-23":
        print("  ✅ Invalid date format fixed correctly")
    else:
        print(f"  ❌ FAILED: Sunday date is {sunday_date3}, expected 2025-11-23")
        return False
    
    print("\n✅ All validation tests passed!")
    return True

if __name__ == "__main__":
    print("=" * 70)
    print("LLM GUARDRAILS VALIDATION TEST")
    print("=" * 70)
    
    success = test_validation_function()
    
    print("\n" + "=" * 70)
    if success:
        print("✅ ALL TESTS PASSED")
    else:
        print("❌ SOME TESTS FAILED")
    print("=" * 70)
    
    sys.exit(0 if success else 1)

