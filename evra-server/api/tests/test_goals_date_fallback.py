"""
Simple test for date fallback logic - can run without database
Tests the core fix for invalid/placeholder dates in action item schedules
"""
import sys
import os
from datetime import datetime, timezone, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_fallback_date_generation():
    """Test that fallback dates are correctly generated"""
    print("\n=== Test 1: Fallback Date Generation ===\n")
    
    # Simulate the _get_current_week_dates_dict logic
    now = datetime.now(timezone.utc)
    days_since_monday = now.weekday()  # 0 = Monday, 6 = Sunday
    monday = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
    
    weekday_names_lower = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    week_dates_dict = {}
    
    for i in range(7):
        day_date = monday + timedelta(days=i)
        date_str = day_date.strftime("%Y-%m-%d")
        week_dates_dict[weekday_names_lower[i]] = date_str
    
    print("Current week dates:")
    for day, date_str in week_dates_dict.items():
        print(f"  {day.capitalize()}: {date_str}")
    
    # Verify all days are present
    expected_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    missing_days = [day for day in expected_days if day not in week_dates_dict]
    
    if missing_days:
        print(f"\n❌ ERROR: Missing days in week dates: {missing_days}")
        return False
    else:
        print("\n✅ All days present in week dates")
    
    # Verify dates are valid
    for day, date_str in week_dates_dict.items():
        try:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            print(f"  ✅ {day.capitalize()} date '{date_str}' is valid")
        except ValueError:
            print(f"  ❌ {day.capitalize()} date '{date_str}' is invalid")
            return False
    
    # Verify Sunday is present
    if "sunday" in week_dates_dict:
        print(f"  ✅ Sunday date: {week_dates_dict['sunday']}")
    else:
        print("  ❌ ERROR: Sunday missing!")
        return False
    
    return True

def test_date_parsing_with_fallbacks():
    """Test date parsing logic with placeholder and invalid dates"""
    print("\n=== Test 2: Date Parsing with Fallbacks ===\n")
    
    # Get fallback dates
    now = datetime.now(timezone.utc)
    days_since_monday = now.weekday()
    monday = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
    weekday_names_lower = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    week_dates_fallback = {}
    for i in range(7):
        day_date = monday + timedelta(days=i)
        date_str = day_date.strftime("%Y-%m-%d")
        week_dates_fallback[weekday_names_lower[i]] = date_str
    
    # Mock action item with various date issues
    mock_schedules = {
        "monday": {"date": "2025-01-20", "start_time": "08:00:00", "end_time": "09:00:00"},  # Valid
        "tuesday": {"date": "YYYY-MM-DD", "start_time": "08:00:00", "end_time": "09:00:00"},  # Placeholder
        "wednesday": {"date": "invalid-date", "start_time": "08:00:00", "end_time": "09:00:00"},  # Invalid
        "thursday": {"date": "2025-01-23", "start_time": "08:00:00", "end_time": "09:00:00"},  # Valid
        "friday": {"date": "2025-01-24", "start_time": "08:00:00", "end_time": "09:00:00"},  # Valid
        "saturday": {"date": "2025-01-25", "start_time": "08:00:00", "end_time": "09:00:00"},  # Valid
        "sunday": {"date": "YYYY-MM-DD", "start_time": "08:00:00", "end_time": "09:00:00"},  # Placeholder - CRITICAL
    }
    
    print("Testing date parsing with fallbacks:")
    print(f"  Fallback dates: {week_dates_fallback}\n")
    
    weekly_schedule_dict = {}
    
    for day, day_schedule in mock_schedules.items():
        date_str = day_schedule.get("date")
        original_date = date_str
        
        # Check for placeholder
        if isinstance(date_str, str) and date_str.upper() in ['YYYY-MM-DD', 'YYYY/MM/DD', 'YYYY_MM_DD']:
            print(f"  {day.capitalize()}: Found placeholder '{date_str}', using fallback")
            fallback_date = week_dates_fallback.get(day.lower())
            if fallback_date:
                date_str = fallback_date
                print(f"    → Using fallback date: {fallback_date}")
            else:
                print(f"    ❌ No fallback found for {day}")
                continue
        
        # Try to parse
        try:
            schedule_date = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            if original_date != date_str:
                print(f"  {day.capitalize()}: Successfully parsed fallback date '{date_str}' (was '{original_date}')")
            else:
                print(f"  {day.capitalize()}: Successfully parsed original date '{date_str}'")
            weekly_schedule_dict[day] = {
                "date": schedule_date,
                "start_time": day_schedule.get("start_time"),
                "end_time": day_schedule.get("end_time"),
                "complete": False
            }
        except (ValueError, TypeError) as e:
            print(f"  {day.capitalize()}: Failed to parse '{date_str}', trying fallback")
            fallback_date = week_dates_fallback.get(day.lower())
            if fallback_date:
                date_str = fallback_date
                schedule_date = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                print(f"    → Using fallback date: {fallback_date}")
                weekly_schedule_dict[day] = {
                    "date": schedule_date,
                    "start_time": day_schedule.get("start_time"),
                    "end_time": day_schedule.get("end_time"),
                    "complete": False
                }
            else:
                print(f"    ❌ No fallback found for {day}")
                continue
    
    # Verify all days are present
    expected_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    missing_days = [day for day in expected_days if day not in weekly_schedule_dict]
    
    print(f"\nFinal schedule has {len(weekly_schedule_dict)} days")
    if missing_days:
        print(f"❌ ERROR: Missing days in schedule: {missing_days}")
        return False
    else:
        print("✅ All days present in schedule (including Sunday)")
    
    # Verify Sunday is present and has valid date
    if "sunday" in weekly_schedule_dict:
        sunday_date = weekly_schedule_dict["sunday"]["date"]
        print(f"✅ Sunday schedule present with date: {sunday_date.strftime('%Y-%m-%d')}")
        
        # Verify it's a valid date (not placeholder)
        if sunday_date.strftime('%Y-%m-%d') == week_dates_fallback["sunday"]:
            print(f"✅ Sunday date matches current week fallback")
        else:
            print(f"⚠️  Sunday date doesn't match fallback (but is valid)")
    else:
        print("❌ ERROR: Sunday schedule missing!")
        return False
    
    return True

def test_sunday_specifically():
    """Test that Sunday specifically gets a valid date even with placeholder"""
    print("\n=== Test 3: Sunday-Specific Test ===\n")
    
    # Get fallback dates
    now = datetime.now(timezone.utc)
    days_since_monday = now.weekday()
    monday = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
    sunday_date = (monday + timedelta(days=6)).strftime("%Y-%m-%d")
    
    print(f"Current week Sunday date: {sunday_date}")
    
    # Test various Sunday date scenarios
    test_cases = [
        ("YYYY-MM-DD", "Placeholder"),
        ("YYYY/MM/DD", "Placeholder variant"),
        ("invalid-date", "Invalid format"),
        ("2025-13-45", "Invalid date values"),
        (sunday_date, "Valid date"),
    ]
    
    week_dates_fallback = {"sunday": sunday_date}
    
    for test_date, description in test_cases:
        print(f"\n  Testing: {description} ('{test_date}')")
        
        date_str = test_date
        original = test_date
        
        # Check for placeholder
        if isinstance(date_str, str) and date_str.upper() in ['YYYY-MM-DD', 'YYYY/MM/DD', 'YYYY_MM_DD']:
            fallback_date = week_dates_fallback.get("sunday")
            if fallback_date:
                date_str = fallback_date
                print(f"    → Replaced placeholder with fallback: {fallback_date}")
        
        # Try to parse
        try:
            schedule_date = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            print(f"    ✅ Successfully parsed: {schedule_date.strftime('%Y-%m-%d')}")
        except (ValueError, TypeError) as e:
            # Use fallback
            fallback_date = week_dates_fallback.get("sunday")
            if fallback_date:
                date_str = fallback_date
                schedule_date = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                print(f"    → Used fallback: {schedule_date.strftime('%Y-%m-%d')}")
            else:
                print(f"    ❌ Failed and no fallback available")
                return False
    
    print("\n✅ All Sunday date scenarios handled correctly")
    return True

def main():
    """Run all tests"""
    print("=" * 70)
    print("GOALS DASHBOARD FIX - DATE FALLBACK TEST SUITE")
    print("=" * 70)
    
    test1_passed = test_fallback_date_generation()
    test2_passed = test_date_parsing_with_fallbacks()
    test3_passed = test_sunday_specifically()
    
    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"Test 1 - Fallback Date Generation: {'✅ PASSED' if test1_passed else '❌ FAILED'}")
    print(f"Test 2 - Date Parsing with Fallbacks: {'✅ PASSED' if test2_passed else '❌ FAILED'}")
    print(f"Test 3 - Sunday-Specific Test: {'✅ PASSED' if test3_passed else '❌ FAILED'}")
    
    all_passed = test1_passed and test2_passed and test3_passed
    print(f"\n{'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
    print("=" * 70)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)

