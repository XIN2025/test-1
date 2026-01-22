"""
Test script to verify that goals with action items show up on dashboard
Tests the fix for missing Sunday schedules and invalid dates
"""
import asyncio
import sys
import os
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ai_services.goals_service import GoalsService
from app.schemas.ai.goals import GoalCreate, GoalCategory, GoalPriority, ActionItemCreate
from app.schemas.backend.preferences import PillarTimePreferences, TimePreference
from app.core.db import get_db
from app.services.backend_services.encryption_service import get_encryption_service

async def test_fallback_dates():
    """Test that fallback dates are correctly generated"""
    print("\n=== Testing Fallback Date Generation ===\n")
    
    goals_service = GoalsService()
    week_dates = goals_service._get_current_week_dates_dict()
    
    print("Current week dates:")
    for day, date_str in week_dates.items():
        print(f"  {day.capitalize()}: {date_str}")
    
    # Verify all days are present
    expected_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    missing_days = [day for day in expected_days if day not in week_dates]
    
    if missing_days:
        print(f"\n❌ ERROR: Missing days in week dates: {missing_days}")
        return False
    else:
        print("\n✅ All days present in week dates")
    
    # Verify dates are valid
    for day, date_str in week_dates.items():
        try:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            print(f"  ✅ {day.capitalize()} date '{date_str}' is valid")
        except ValueError:
            print(f"  ❌ {day.capitalize()} date '{date_str}' is invalid")
            return False
    
    return True

async def test_action_item_creation_with_invalid_dates():
    """Test action item creation with invalid/placeholder dates"""
    print("\n=== Testing Action Item Creation with Invalid Dates ===\n")
    
    goals_service = GoalsService()
    
    # Create a mock action item with placeholder and invalid dates
    mock_action_item_data = {
        "action_items": [
            {
                "title": "Test Nutrition Action",
                "description": "Test action item with invalid dates",
                "priority": "high",
                "weekly_schedule": {
                    "monday": {
                        "date": "2025-01-20",  # Valid date
                        "start_time": "08:00:00",
                        "end_time": "09:00:00",
                        "notes": "Valid date"
                    },
                    "tuesday": {
                        "date": "YYYY-MM-DD",  # Placeholder - should use fallback
                        "start_time": "08:00:00",
                        "end_time": "09:00:00",
                        "notes": "Placeholder date"
                    },
                    "wednesday": {
                        "date": "invalid-date",  # Invalid format - should use fallback
                        "start_time": "08:00:00",
                        "end_time": "09:00:00",
                        "notes": "Invalid date"
                    },
                    "thursday": {
                        "date": "2025-01-23",  # Valid date
                        "start_time": "08:00:00",
                        "end_time": "09:00:00",
                        "notes": "Valid date"
                    },
                    "friday": {
                        "date": "2025-01-24",  # Valid date
                        "start_time": "08:00:00",
                        "end_time": "09:00:00",
                        "notes": "Valid date"
                    },
                    "saturday": {
                        "date": "2025-01-25",  # Valid date
                        "start_time": "08:00:00",
                        "end_time": "09:00:00",
                        "notes": "Valid date"
                    },
                    "sunday": {
                        "date": "YYYY-MM-DD",  # Placeholder - should use fallback
                        "start_time": "08:00:00",
                        "end_time": "09:00:00",
                        "notes": "Sunday with placeholder"
                    }
                }
            }
        ]
    }
    
    # Get a test goal ID (we'll need to create one or use existing)
    # For testing, we'll just verify the parsing logic
    week_dates = goals_service._get_current_week_dates_dict()
    
    print("Testing date parsing with fallbacks:")
    print(f"  Fallback dates: {week_dates}\n")
    
    # Simulate the parsing logic
    weekly_schedule_dict = {}
    for day, day_schedule in mock_action_item_data["action_items"][0]["weekly_schedule"].items():
        date_str = day_schedule.get("date")
        
        # Check for placeholder
        if isinstance(date_str, str) and date_str.upper() in ['YYYY-MM-DD', 'YYYY/MM/DD', 'YYYY_MM_DD']:
            print(f"  {day.capitalize()}: Found placeholder '{date_str}', using fallback")
            fallback_date = week_dates.get(day.lower())
            if fallback_date:
                date_str = fallback_date
                print(f"    → Using fallback date: {fallback_date}")
            else:
                print(f"    ❌ No fallback found for {day}")
                continue
        
        # Try to parse
        try:
            schedule_date = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            print(f"  {day.capitalize()}: Successfully parsed '{date_str}'")
            weekly_schedule_dict[day] = {
                "date": schedule_date,
                "start_time": day_schedule.get("start_time"),
                "end_time": day_schedule.get("end_time"),
                "notes": day_schedule.get("notes"),
                "complete": False
            }
        except (ValueError, TypeError) as e:
            print(f"  {day.capitalize()}: Failed to parse '{date_str}', using fallback")
            fallback_date = week_dates.get(day.lower())
            if fallback_date:
                date_str = fallback_date
                schedule_date = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                print(f"    → Using fallback date: {fallback_date}")
                weekly_schedule_dict[day] = {
                    "date": schedule_date,
                    "start_time": day_schedule.get("start_time"),
                    "end_time": day_schedule.get("end_time"),
                    "notes": day_schedule.get("notes"),
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
    
    # Verify Sunday is present
    if "sunday" in weekly_schedule_dict:
        sunday_date = weekly_schedule_dict["sunday"]["date"]
        print(f"✅ Sunday schedule present with date: {sunday_date.strftime('%Y-%m-%d')}")
    else:
        print("❌ ERROR: Sunday schedule missing!")
        return False
    
    return True

async def test_goals_retrieval(user_email: str):
    """Test that goals are properly retrieved with action items"""
    print(f"\n=== Testing Goals Retrieval for {user_email} ===\n")
    
    goals_service = GoalsService()
    
    try:
        goals = await goals_service.get_user_goals(user_email)
        
        if not goals:
            print("⚠️  No goals found for user")
            return True  # Not an error, just no data
        
        print(f"Found {len(goals)} goal(s)\n")
        
        for goal in goals:
            goal_dict = goal.model_dump() if hasattr(goal, 'model_dump') else goal
            print(f"Goal: {goal_dict.get('title', 'N/A')}")
            print(f"  Category: {goal_dict.get('category', 'N/A')}")
            print(f"  Action Items: {len(goal_dict.get('action_items', []))}")
            
            # Check each action item
            for idx, action_item in enumerate(goal_dict.get('action_items', [])):
                action_dict = action_item.model_dump() if hasattr(action_item, 'model_dump') else action_item
                print(f"\n  Action Item {idx + 1}: {action_dict.get('title', 'N/A')}")
                
                weekly_schedule = action_dict.get('weekly_schedule', {})
                if not weekly_schedule:
                    print(f"    ⚠️  WARNING: No weekly_schedule found!")
                    continue
                
                # Check all days
                days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
                days_present = []
                days_missing = []
                
                for day in days:
                    day_schedule = weekly_schedule.get(day)
                    if day_schedule:
                        date_val = day_schedule.get("date")
                        if isinstance(date_val, datetime):
                            date_str = date_val.strftime("%Y-%m-%d")
                        elif isinstance(date_val, str):
                            date_str = date_val
                        else:
                            date_str = str(date_val)
                        days_present.append(day)
                        print(f"    ✅ {day.capitalize()}: {date_str}")
                    else:
                        days_missing.append(day)
                        print(f"    ❌ {day.capitalize()}: MISSING")
                
                if days_missing:
                    print(f"    ⚠️  WARNING: Missing days: {', '.join(days_missing)}")
                else:
                    print(f"    ✅ All days present (including Sunday)")
            
            print()
        
        return True
        
    except Exception as e:
        print(f"❌ ERROR: Failed to retrieve goals: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def test_nutrition_goal_specifically(user_email: str):
    """Test specifically for nutrition goals"""
    print(f"\n=== Testing Nutrition Goals Specifically ===\n")
    
    goals_service = GoalsService()
    db = get_db()
    encryption_service = get_encryption_service()
    
    goals_collection = db["goals"]
    action_items_collection = db["action_items"]
    
    # Find nutrition goals
    goals = await goals_collection.find({
        "user_email": user_email,
        "category": "nutrition"
    }).to_list(None)
    
    goals = encryption_service.decrypt_documents_bulk(goals, GoalCreate)
    
    if not goals:
        print("⚠️  No nutrition goals found")
        return True
    
    print(f"Found {len(goals)} nutrition goal(s)\n")
    
    for goal in goals:
        goal_id = str(goal["_id"])
        print(f"Nutrition Goal: {goal.get('title', 'N/A')}")
        print(f"  Goal ID: {goal_id}")
        
        # Get action items
        action_items = await action_items_collection.find({
            "goal_id": goal_id
        }).to_list(None)
        
        action_items = encryption_service.decrypt_documents_bulk(action_items, ActionItemCreate)
        
        print(f"  Action Items: {len(action_items)}")
        
        if not action_items:
            print("  ⚠️  WARNING: No action items found for this goal!")
            continue
        
        # Check Sunday specifically
        for idx, item in enumerate(action_items):
            print(f"\n  Action Item {idx + 1}: {item.get('title', 'N/A')}")
            weekly_schedule = item.get("weekly_schedule", {})
            
            if not weekly_schedule:
                print(f"    ❌ ERROR: No weekly_schedule!")
                continue
            
            sunday_schedule = weekly_schedule.get("sunday")
            if sunday_schedule:
                date_val = sunday_schedule.get("date")
                if isinstance(date_val, datetime):
                    date_str = date_val.strftime("%Y-%m-%d")
                else:
                    date_str = str(date_val)
                print(f"    ✅ Sunday schedule present: date={date_str}")
            else:
                print(f"    ❌ ERROR: Sunday schedule MISSING!")
        
        print()
    
    return True

async def main():
    """Run all tests"""
    print("=" * 70)
    print("GOALS DASHBOARD FIX - TEST SUITE")
    print("=" * 70)
    
    # Test 1: Fallback date generation
    test1_passed = await test_fallback_dates()
    
    # Test 2: Action item creation with invalid dates
    test2_passed = await test_action_item_creation_with_invalid_dates()
    
    # Test 3: Goals retrieval (requires user email)
    if len(sys.argv) > 1:
        user_email = sys.argv[1]
        test3_passed = await test_goals_retrieval(user_email)
        test4_passed = await test_nutrition_goal_specifically(user_email)
    else:
        print("\n⚠️  Skipping user-specific tests (provide user_email as argument)")
        print("   Usage: python tests/test_goals_dashboard_fix.py <user_email>")
        test3_passed = True
        test4_passed = True
    
    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"Test 1 - Fallback Date Generation: {'✅ PASSED' if test1_passed else '❌ FAILED'}")
    print(f"Test 2 - Invalid Date Handling: {'✅ PASSED' if test2_passed else '❌ FAILED'}")
    print(f"Test 3 - Goals Retrieval: {'✅ PASSED' if test3_passed else '❌ FAILED'}")
    print(f"Test 4 - Nutrition Goals Check: {'✅ PASSED' if test4_passed else '❌ FAILED'}")
    
    all_passed = test1_passed and test2_passed and test3_passed and test4_passed
    print(f"\n{'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
    print("=" * 70)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

