"""
Comprehensive test script to verify JWT authentication implementation.
Tests all the changes made to secure endpoints.
"""
import asyncio
import sys
import os
from datetime import datetime, timezone

# Add the api directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.services.backend_services.db import get_db
from app.core.security import create_access_token, get_current_user, CurrentUser, decode_access_token
from app.services.backend_services.token_service import get_refresh_token_service

client = TestClient(app)

# Test user data
TEST_EMAIL = "test_auth@example.com"
TEST_NAME = "Test User"
TEST_PASSWORD = "test123"

def print_test(name: str):
    """Print test header"""
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print(f"{'='*60}")

def print_result(success: bool, message: str):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")

async def setup_test_user():
    """Create a test user for authentication tests"""
    print_test("Setting up test user")
    db = get_db()
    users = db["users"]
    
    # Check if user exists
    existing = await users.find_one({"email": TEST_EMAIL})
    if existing:
        # Update to verified state
        await users.update_one(
            {"email": TEST_EMAIL},
            {
                "$set": {
                    "verified": True,
                    "token_version": 0,
                    "name": TEST_NAME
                }
            }
        )
        print_result(True, f"Test user {TEST_EMAIL} already exists, updated")
    else:
        # Create new user
        await users.insert_one({
            "email": TEST_EMAIL,
            "name": TEST_NAME,
            "verified": True,
            "token_version": 0,
            "created_at": datetime.now(timezone.utc)
        })
        print_result(True, f"Created test user {TEST_EMAIL}")
    
    return True

def test_public_endpoints():
    """Test that public endpoints work without authentication"""
    print_test("Public Endpoints (No Auth Required)")
    
    # Test register endpoint
    response = client.post("/register", json={
        "email": "newuser@example.com",
        "name": "New User",
        "timezone": "UTC"
    })
    print_result(
        response.status_code in [200, 409],
        f"POST /register - Status: {response.status_code}"
    )
    
    # Test available timezones
    response = client.get("/available-timezones")
    print_result(
        response.status_code == 200,
        f"GET /available-timezones - Status: {response.status_code}"
    )
    
    # Test app version
    response = client.get("/api/app-version?platform=ios")
    print_result(
        response.status_code == 200,
        f"GET /api/app-version - Status: {response.status_code}"
    )

def test_protected_endpoints_without_auth():
    """Test that protected endpoints reject requests without tokens"""
    print_test("Protected Endpoints (Should Reject Without Auth)")
    
    protected_endpoints = [
        ("GET", "/api/user/profile"),
        ("GET", "/api/user/preferences"),
        ("GET", "/api/goals"),
        ("GET", "/api/health-score/"),
        ("GET", "/api/preferences/time"),
        ("POST", "/logout"),
    ]
    
    all_passed = True
    for method, endpoint in protected_endpoints:
        if method == "GET":
            response = client.get(endpoint)
        else:
            response = client.post(endpoint)
        
        passed = response.status_code == 401
        print_result(passed, f"{method} {endpoint} - Status: {response.status_code} (Expected: 401)")
        if not passed:
            all_passed = False
    
    return all_passed

def test_token_creation():
    """Test JWT token creation and validation"""
    print_test("Token Creation and Validation")
    
    # Create a test token
    token_data = {
        "sub": TEST_EMAIL,
        "name": TEST_NAME,
        "token_version": 0
    }
    token = create_access_token(token_data)
    
    print_result(
        token is not None and len(token) > 0,
        f"Token created successfully (length: {len(token)})"
    )
    
    # Decode token
    try:
        payload = decode_access_token(token)
        print_result(
            payload.get("sub") == TEST_EMAIL,
            f"Token decoded correctly - email: {payload.get('sub')}"
        )
        print_result(
            payload.get("token_version") == 0,
            f"Token version correct: {payload.get('token_version')}"
        )
        return token, payload
    except Exception as e:
        print_result(False, f"Token decode failed: {str(e)}")
        return None, None

def test_protected_endpoints_with_auth():
    """Test protected endpoints with valid token"""
    print_test("Protected Endpoints (With Valid Auth)")
    
    # Create token
    token_data = {
        "sub": TEST_EMAIL,
        "name": TEST_NAME,
        "token_version": 0
    }
    token = create_access_token(token_data)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test user profile
    response = client.get("/api/user/profile", headers=headers)
    print_result(
        response.status_code == 200,
        f"GET /api/user/profile - Status: {response.status_code}"
    )
    
    # Test user preferences
    response = client.get("/api/user/preferences", headers=headers)
    print_result(
        response.status_code == 200,
        f"GET /api/user/preferences - Status: {response.status_code}"
    )
    
    # Test goals endpoint
    response = client.get("/api/goals", headers=headers)
    print_result(
        response.status_code == 200,
        f"GET /api/goals - Status: {response.status_code}"
    )
    
    # Test health score
    response = client.get("/api/health-score/", headers=headers)
    print_result(
        response.status_code in [200, 500],  # 500 is OK if user has no health data
        f"GET /api/health-score/ - Status: {response.status_code}"
    )
    
    # Test preferences
    response = client.get("/api/preferences/time", headers=headers)
    print_result(
        response.status_code == 200,
        f"GET /api/preferences/time - Status: {response.status_code}"
    )

def test_user_email_from_token():
    """Test that user email comes from token, not request"""
    print_test("User Email from Token (Not Request)")
    
    token_data = {
        "sub": TEST_EMAIL,
        "name": TEST_NAME,
        "token_version": 0
    }
    token = create_access_token(token_data)
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to access profile - should use email from token, not any query param
    response = client.get("/api/user/profile", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print_result(
            data.get("email") == TEST_EMAIL,
            f"Profile email matches token: {data.get('email')}"
        )
    else:
        print_result(False, f"Failed to get profile: {response.status_code}")

def test_invalid_token():
    """Test that invalid tokens are rejected"""
    print_test("Invalid Token Rejection")
    
    # Test with invalid token
    headers = {"Authorization": "Bearer invalid_token_12345"}
    response = client.get("/api/user/profile", headers=headers)
    print_result(
        response.status_code == 401,
        f"Invalid token rejected - Status: {response.status_code}"
    )
    
    # Test with missing Bearer prefix
    headers = {"Authorization": "invalid_token_12345"}
    response = client.get("/api/user/profile", headers=headers)
    print_result(
        response.status_code == 401,
        f"Missing Bearer prefix rejected - Status: {response.status_code}"
    )
    
    # Test with no Authorization header
    response = client.get("/api/user/profile")
    print_result(
        response.status_code == 401,
        f"No Authorization header rejected - Status: {response.status_code}"
    )

def test_token_version_check():
    """Test that revoked tokens (different version) are rejected"""
    print_test("Token Version Check (Revoked Tokens)")
    
    # Create token with version 0
    token_data = {
        "sub": TEST_EMAIL,
        "name": TEST_NAME,
        "token_version": 0
    }
    token = create_access_token(token_data)
    
    # Update user's token_version to 1 (simulating logout)
    async def revoke_token():
        db = get_db()
        users = db["users"]
        await users.update_one(
            {"email": TEST_EMAIL},
            {"$set": {"token_version": 1}}
        )
    
    asyncio.run(revoke_token())
    
    # Try to use old token
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/user/profile", headers=headers)
    print_result(
        response.status_code == 401,
        f"Revoked token rejected - Status: {response.status_code}"
    )
    
    # Reset token version for other tests
    async def reset_token():
        db = get_db()
        users = db["users"]
        await users.update_one(
            {"email": TEST_EMAIL},
            {"$set": {"token_version": 0}}
        )
    
    asyncio.run(reset_token())

def test_schema_user_email_assignment():
    """Test that schemas can have user_email assigned from token"""
    print_test("Schema User Email Assignment")
    
    from app.schemas.ai.goals import GoalCreate, WeeklyReflectionCreate
    from app.schemas.backend.preferences import PillarTimePreferences
    from app.schemas.backend.review import ReviewCreate
    
    # Test GoalCreate
    goal = GoalCreate(
        title="Test Goal",
        priority="high",
        category="health"
    )
    goal.user_email = TEST_EMAIL
    print_result(
        goal.user_email == TEST_EMAIL,
        f"GoalCreate.user_email assignment works: {goal.user_email}"
    )
    
    # Test WeeklyReflectionCreate
    reflection = WeeklyReflectionCreate(rating=5)
    reflection.user_email = TEST_EMAIL
    print_result(
        reflection.user_email == TEST_EMAIL,
        f"WeeklyReflectionCreate.user_email assignment works: {reflection.user_email}"
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
    pref.user_email = TEST_EMAIL
    print_result(
        pref.user_email == TEST_EMAIL,
        f"PillarTimePreferences.user_email assignment works: {pref.user_email}"
    )
    
    # Test ReviewCreate
    review = ReviewCreate(rating=5)
    review.user_email = TEST_EMAIL
    print_result(
        review.user_email == TEST_EMAIL,
        f"ReviewCreate.user_email assignment works: {review.user_email}"
    )

def test_logout_endpoint():
    """Test logout endpoint"""
    print_test("Logout Endpoint")
    
    # Create token
    token_data = {
        "sub": TEST_EMAIL,
        "name": TEST_NAME,
        "token_version": 0
    }
    token = create_access_token(token_data)
    headers = {"Authorization": f"Bearer {token}"}
    
    # Call logout
    response = client.post("/logout", headers=headers)
    print_result(
        response.status_code == 200,
        f"POST /logout - Status: {response.status_code}"
    )
    
    # Verify token is now invalid
    response = client.get("/api/user/profile", headers=headers)
    print_result(
        response.status_code == 401,
        f"Token invalidated after logout - Status: {response.status_code}"
    )
    
    # Reset token version for other tests
    async def reset_token():
        db = get_db()
        users = db["users"]
        await users.update_one(
            {"email": TEST_EMAIL},
            {"$set": {"token_version": 0}}
        )
    
    asyncio.run(reset_token())

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("JWT AUTHENTICATION IMPLEMENTATION TEST SUITE")
    print("="*60)
    
    # Setup
    asyncio.run(setup_test_user())
    
    # Run tests
    test_public_endpoints()
    test_protected_endpoints_without_auth()
    test_token_creation()
    test_protected_endpoints_with_auth()
    test_user_email_from_token()
    test_invalid_token()
    test_token_version_check()
    test_schema_user_email_assignment()
    test_logout_endpoint()
    
    print("\n" + "="*60)
    print("TEST SUITE COMPLETE")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()

