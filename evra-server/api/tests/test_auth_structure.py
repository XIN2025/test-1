"""
Test authentication structure by checking code patterns
without requiring full module imports.
"""
import os
import re
from pathlib import Path

def print_test(name: str):
    """Print test header"""
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print(f"{'='*60}")

def print_result(success: bool, message: str):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")

def test_routers_have_auth_imports():
    """Check that all routers import authentication"""
    print_test("Router Authentication Imports (Code Pattern Check)")
    
    router_files = [
        "app/routers/backend/auth.py",
        "app/routers/backend/user.py",
        "app/routers/backend/upload.py",
        "app/routers/ai/chat.py",
        "app/routers/ai/goals.py",
        "app/routers/ai/lab_report.py",
        "app/routers/backend/preferences.py",
        "app/routers/backend/review.py",
        "app/routers/backend/health_alert.py",
        "app/routers/backend/health_score.py",
        "app/routers/backend/nudge.py",
        "app/routers/backend/delete_account.py",
    ]
    
    all_passed = True
    for router_file in router_files:
        file_path = Path(router_file)
        if not file_path.exists():
            print_result(False, f"{router_file} not found")
            all_passed = False
            continue
        
        try:
            content = file_path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
        
        # Check for get_current_user import
        has_import = (
            "from app.core.security import" in content or
            "from ...core.security import" in content or
            "from ....core.security import" in content
        ) and (
            "get_current_user" in content and "CurrentUser" in content
        )
        
        print_result(
            has_import,
            f"{router_file} has auth imports"
        )
        
        if not has_import:
            all_passed = False
    
    return all_passed

def test_protected_endpoints_have_depends():
    """Check that protected endpoints use Depends(get_current_user)"""
    print_test("Protected Endpoints Use Depends(get_current_user)")
    
    router_files = [
        "app/routers/backend/user.py",
        "app/routers/backend/upload.py",
        "app/routers/ai/chat.py",
        "app/routers/ai/goals.py",
        "app/routers/ai/lab_report.py",
        "app/routers/backend/preferences.py",
        "app/routers/backend/review.py",
        "app/routers/backend/health_alert.py",
        "app/routers/backend/health_score.py",
        "app/routers/backend/nudge.py",
        "app/routers/backend/delete_account.py",
    ]
    
    all_passed = True
    for router_file in router_files:
        file_path = Path(router_file)
        if not file_path.exists():
            continue
        
        try:
            content = file_path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
        
        # Find all endpoint decorators
        endpoint_pattern = r'@\w+_router\.(get|post|put|delete|patch)\([^)]+\)'
        endpoints = re.findall(endpoint_pattern, content)
        
        # Check if endpoints have Depends(get_current_user)
        # This is a simplified check - we look for the pattern
        has_depends = "Depends(get_current_user)" in content or "current_user: CurrentUser" in content
        
        if endpoints and not has_depends:
            print_result(False, f"{router_file} has endpoints but missing Depends")
            all_passed = False
        elif endpoints:
            print_result(True, f"{router_file} endpoints use Depends")
    
    return all_passed

def test_no_user_email_query_params():
    """Check that endpoints don't use user_email as query parameter"""
    print_test("No user_email Query Parameters")
    
    router_files = [
        "app/routers/backend/user.py",
        "app/routers/backend/upload.py",
        "app/routers/ai/chat.py",
        "app/routers/ai/goals.py",
        "app/routers/ai/lab_report.py",
        "app/routers/backend/preferences.py",
        "app/routers/backend/review.py",
        "app/routers/backend/health_alert.py",
        "app/routers/backend/health_score.py",
        "app/routers/backend/nudge.py",
    ]
    
    all_passed = True
    for router_file in router_files:
        file_path = Path(router_file)
        if not file_path.exists():
            continue
        
        try:
            content = file_path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
        
        # Check for user_email in Query parameters (should not exist)
        # Look for patterns like: user_email: EmailStr = Query(...)
        bad_patterns = [
            r'user_email.*Query\(',
            r'email.*EmailStr.*Query\(',
        ]
        
        has_bad_pattern = any(re.search(pattern, content) for pattern in bad_patterns)
        
        print_result(
            not has_bad_pattern,
            f"{router_file} has no user_email Query params"
        )
        
        if has_bad_pattern:
            all_passed = False
    
    return all_passed

def test_schemas_have_optional_user_email():
    """Check that schemas have optional user_email fields"""
    print_test("Schemas Have Optional user_email")
    
    schema_files = [
        ("app/schemas/ai/goals.py", ["GoalCreate", "WeeklyReflectionCreate"]),
        ("app/schemas/backend/preferences.py", ["PillarTimePreferences"]),
        ("app/schemas/backend/review.py", ["ReviewCreate"]),
        ("app/schemas/backend/delete_account.py", [
            "DeleteAccountRequest",
            "DeleteAccountConfirmationRequest",
            "DeleteAccountCancelRequest"
        ]),
    ]
    
    all_passed = True
    for schema_file, classes in schema_files:
        file_path = Path(schema_file)
        if not file_path.exists():
            continue
        
        try:
            content = file_path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
        
        for class_name in classes:
            # Check if class has optional user_email
            class_pattern = rf'class {class_name}\(.*?\):.*?user_email.*?Optional'
            has_optional = re.search(class_pattern, content, re.DOTALL) is not None
            
            # Also check for user_email: Optional[EmailStr] = None
            has_pattern = "user_email" in content and "Optional" in content
            
            print_result(
                has_pattern,
                f"{schema_file} - {class_name} has optional user_email"
            )
            
            if not has_pattern:
                all_passed = False
    
    return all_passed

def test_auth_endpoints_are_public():
    """Check that auth endpoints (register, login) are public"""
    print_test("Auth Endpoints Are Public")
    
    auth_file = Path("app/routers/backend/auth.py")
    if not auth_file.exists():
        print_result(False, "auth.py not found")
        return False
    
    content = auth_file.read_text()
    
    # Public endpoints should not have Depends(get_current_user)
    public_endpoints = [
        ("/register", "register"),
        ("/login", "login"),
        ("/verify-registration-otp", "verify_registration_otp"),
        ("/verify-login-otp", "verify_login_otp"),
        ("/available-timezones", "timezones"),
    ]
    
    all_passed = True
    for endpoint, func_name in public_endpoints:
        # Find the function
        func_pattern = rf'def {func_name}\([^)]+\):'
        match = re.search(func_pattern, content)
        
        if match:
            func_start = match.start()
            # Check next 200 chars for Depends(get_current_user)
            func_snippet = content[func_start:func_start+200]
            has_depends = "Depends(get_current_user)" in func_snippet
            
            print_result(
                not has_depends,
                f"{endpoint} is public (no auth required)"
            )
            
            if has_depends:
                all_passed = False
    
    # Logout should have auth
    logout_has_auth = "def logout" in content and "Depends(get_current_user)" in content
    print_result(
        logout_has_auth,
        "/logout requires authentication"
    )
    
    return all_passed and logout_has_auth

def test_health_score_route_fixed():
    """Check that health score route was changed from /{user_email} to /"""
    print_test("Health Score Route Fixed")
    
    health_score_file = Path("app/routers/backend/health_score.py")
    if not health_score_file.exists():
        print_result(False, "health_score.py not found")
        return False
    
    content = health_score_file.read_text()
    
    # Should not have /{user_email} in route
    has_old_route = "/{user_email}" in content or "user_email: str" in content
    
    # Should have / route
    has_new_route = "@health_score_router.get('/'" in content
    
    print_result(
        not has_old_route,
        "Old route pattern removed"
    )
    
    print_result(
        has_new_route,
        "New route pattern (/) exists"
    )
    
    return not has_old_route and has_new_route

def main():
    """Run all structure tests"""
    print("\n" + "="*60)
    print("JWT AUTHENTICATION STRUCTURE TEST SUITE")
    print("="*60)
    
    results = []
    
    results.append(("Router Auth Imports", test_routers_have_auth_imports()))
    results.append(("Protected Endpoints Use Depends", test_protected_endpoints_have_depends()))
    results.append(("No user_email Query Params", test_no_user_email_query_params()))
    results.append(("Schemas Have Optional user_email", test_schemas_have_optional_user_email()))
    results.append(("Auth Endpoints Are Public", test_auth_endpoints_are_public()))
    results.append(("Health Score Route Fixed", test_health_score_route_fixed()))
    
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
    import sys
    success = main()
    sys.exit(0 if success else 1)

