"""
Core authentication tests - tests the security module directly
without requiring full app dependencies.
"""
import sys
import os
from datetime import datetime, timedelta, timezone

# Add the api directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def print_test(name: str):
    """Print test header"""
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print(f"{'='*60}")

def print_result(success: bool, message: str):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")

def test_security_imports():
    """Test that security module imports correctly"""
    print_test("Security Module Imports")
    
    try:
        from app.core.security import (
            CurrentUser,
            create_access_token,
            decode_access_token,
            get_bearer_token,
            get_current_user,
            ACCESS_TOKEN_EXPIRE_MINUTES
        )
        print_result(True, "All security imports successful")
        return True
    except Exception as e:
        print_result(False, f"Import failed: {str(e)}")
        return False

def test_current_user_model():
    """Test CurrentUser model"""
    print_test("CurrentUser Model")
    
    try:
        from app.core.security import CurrentUser
        
        user = CurrentUser(
            email="test@example.com",
            name="Test User",
            token_version=0
        )
        
        print_result(
            user.email == "test@example.com",
            f"Email set correctly: {user.email}"
        )
        print_result(
            user.name == "Test User",
            f"Name set correctly: {user.name}"
        )
        print_result(
            user.token_version == 0,
            f"Token version set correctly: {user.token_version}"
        )
        return True
    except Exception as e:
        print_result(False, f"CurrentUser test failed: {str(e)}")
        return False

def test_token_creation():
    """Test JWT token creation"""
    print_test("Token Creation")
    
    try:
        from app.core.security import create_access_token
        
        token_data = {
            "sub": "test@example.com",
            "name": "Test User",
            "token_version": 0
        }
        
        token = create_access_token(token_data)
        
        print_result(
            token is not None and len(token) > 0,
            f"Token created (length: {len(token)})"
        )
        
        # Check token format (JWT has 3 parts separated by dots)
        parts = token.split(".")
        print_result(
            len(parts) == 3,
            f"Token has correct format (3 parts): {len(parts)}"
        )
        
        return token
    except Exception as e:
        print_result(False, f"Token creation failed: {str(e)}")
        return None

def test_token_decoding():
    """Test JWT token decoding"""
    print_test("Token Decoding")
    
    try:
        from app.core.security import create_access_token, decode_access_token
        
        token_data = {
            "sub": "test@example.com",
            "name": "Test User",
            "token_version": 0
        }
        
        token = create_access_token(token_data)
        payload = decode_access_token(token)
        
        print_result(
            payload.get("sub") == "test@example.com",
            f"Email decoded correctly: {payload.get('sub')}"
        )
        print_result(
            payload.get("name") == "Test User",
            f"Name decoded correctly: {payload.get('name')}"
        )
        print_result(
            payload.get("token_version") == 0,
            f"Token version decoded correctly: {payload.get('token_version')}"
        )
        print_result(
            "exp" in payload,
            "Expiration time included in token"
        )
        
        return True
    except Exception as e:
        print_result(False, f"Token decoding failed: {str(e)}")
        return False

def test_schema_models():
    """Test that schema models work with user_email assignment"""
    print_test("Schema Models - User Email Assignment")
    
    try:
        from app.schemas.ai.goals import GoalCreate, WeeklyReflectionCreate
        from app.schemas.backend.preferences import PillarTimePreferences
        from app.schemas.backend.review import ReviewCreate
        from app.schemas.backend.delete_account import DeleteAccountRequest
        
        # Test GoalCreate
        goal = GoalCreate(
            title="Test Goal",
            priority="high",
            category="health"
        )
        goal.user_email = "test@example.com"
        print_result(
            goal.user_email == "test@example.com",
            f"GoalCreate.user_email: {goal.user_email}"
        )
        
        # Test WeeklyReflectionCreate
        reflection = WeeklyReflectionCreate(rating=5)
        reflection.user_email = "test@example.com"
        print_result(
            reflection.user_email == "test@example.com",
            f"WeeklyReflectionCreate.user_email: {reflection.user_email}"
        )
        
        # Test ReviewCreate
        review = ReviewCreate(rating=5)
        review.user_email = "test@example.com"
        print_result(
            review.user_email == "test@example.com",
            f"ReviewCreate.user_email: {review.user_email}"
        )
        
        # Test DeleteAccountRequest
        delete_req = DeleteAccountRequest(reason="Testing")
        delete_req.user_email = "test@example.com"
        print_result(
            delete_req.user_email == "test@example.com",
            f"DeleteAccountRequest.user_email: {delete_req.user_email}"
        )
        
        # Test PillarTimePreferences
        from app.schemas.backend.preferences import TimePreference, PillarType
        pref = PillarTimePreferences(
            preferences={PillarType.HEALTH: TimePreference(
                preferred_time="09:00",
                duration_minutes=30,
                days_of_week=[0, 1, 2]
            )}
        )
        pref.user_email = "test@example.com"
        print_result(
            pref.user_email == "test@example.com",
            f"PillarTimePreferences.user_email: {pref.user_email}"
        )
        
        return True
    except Exception as e:
        print_result(False, f"Schema model test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_router_imports():
    """Test that all routers import authentication correctly"""
    print_test("Router Authentication Imports")
    
    routers_to_test = [
        ("app.routers.backend.auth", ["get_current_user", "CurrentUser"]),
        ("app.routers.backend.user", ["get_current_user", "CurrentUser"]),
        ("app.routers.backend.upload", ["get_current_user", "CurrentUser"]),
        ("app.routers.ai.chat", ["get_current_user", "CurrentUser"]),
        ("app.routers.ai.goals", ["get_current_user", "CurrentUser"]),
        ("app.routers.ai.lab_report", ["get_current_user", "CurrentUser"]),
        ("app.routers.backend.preferences", ["get_current_user", "CurrentUser"]),
        ("app.routers.backend.review", ["get_current_user", "CurrentUser"]),
        ("app.routers.backend.health_alert", ["get_current_user", "CurrentUser"]),
        ("app.routers.backend.health_score", ["get_current_user", "CurrentUser"]),
        ("app.routers.backend.nudge", ["get_current_user", "CurrentUser"]),
        ("app.routers.backend.delete_account", ["get_current_user", "CurrentUser"]),
    ]
    
    all_passed = True
    for module_name, expected_imports in routers_to_test:
        try:
            module = __import__(module_name, fromlist=expected_imports)
            for import_name in expected_imports:
                if hasattr(module, import_name):
                    print_result(True, f"{module_name} has {import_name}")
                else:
                    print_result(False, f"{module_name} missing {import_name}")
                    all_passed = False
        except Exception as e:
            print_result(False, f"{module_name} import failed: {str(e)}")
            all_passed = False
    
    return all_passed

def test_token_expiration():
    """Test that tokens have expiration"""
    print_test("Token Expiration")
    
    try:
        from app.core.security import create_access_token, decode_access_token
        from datetime import timedelta
        
        token_data = {
            "sub": "test@example.com",
            "name": "Test User",
            "token_version": 0
        }
        
        # Create token with short expiration
        token = create_access_token(token_data, expires_delta=timedelta(seconds=-1))
        
        # Try to decode expired token
        try:
            payload = decode_access_token(token)
            print_result(False, "Expired token should be rejected")
            return False
        except Exception as e:
            # Should raise HTTPException for expired token
            print_result(
                "expired" in str(e).lower() or "401" in str(e),
                f"Expired token correctly rejected: {type(e).__name__}"
            )
            return True
    except Exception as e:
        print_result(False, f"Token expiration test failed: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("JWT AUTHENTICATION CORE FUNCTIONALITY TEST SUITE")
    print("="*60)
    
    results = []
    
    results.append(("Security Imports", test_security_imports()))
    results.append(("CurrentUser Model", test_current_user_model()))
    results.append(("Token Creation", test_token_creation() is not None))
    results.append(("Token Decoding", test_token_decoding()))
    results.append(("Schema Models", test_schema_models()))
    results.append(("Router Imports", test_router_imports()))
    results.append(("Token Expiration", test_token_expiration()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    print("="*60 + "\n")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

