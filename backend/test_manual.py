#!/usr/bin/env python3
"""
Manual test script for Sprint 1 authentication flow.
Run this after docker-compose is up and backend is ready.

Usage:
  python backend/test_manual.py
"""

import requests
import json
import time
import sys

BASE_URL = "http://localhost:4000/api/v1"

def print_section(title):
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}\n")

def test_health():
    """Test health endpoint."""
    print_section("1. Health Check")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_register():
    """Test user registration."""
    print_section("2. Register New User")
    payload = {
        "name": "Test User",
        "email": f"test_user_{int(time.time())}@example.com",
        "password": "TestPassword123!"
    }
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=payload)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")

        if response.status_code == 200:
            print("✅ Registration successful")
            return True, data["email"], payload["password"]
        else:
            print(f"❌ Registration failed: {data.get('detail')}")
            return False, None, None
    except Exception as e:
        print(f"❌ Error: {e}")
        return False, None, None

def test_login(email, password):
    """Test user login."""
    print_section("3. User Login")
    payload = {
        "email": email,
        "password": password
    }
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        print(f"Status: {response.status_code}")
        data = response.json()

        if response.status_code == 200:
            print(f"Access Token: {data['access_token'][:50]}...")
            print(f"Refresh Token: {data['refresh_token'][:50]}...")
            print("✅ Login successful")
            return True, data["access_token"], data["refresh_token"]
        else:
            print(f"❌ Login failed: {data.get('detail')}")
            return False, None, None
    except Exception as e:
        print(f"❌ Error: {e}")
        return False, None, None

def test_get_me(access_token):
    """Test get current user endpoint."""
    print_section("4. Get Current User (/me)")
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")

        if response.status_code == 200:
            print("✅ Get user successful")
            return True
        else:
            print(f"❌ Failed: {data.get('detail')}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_refresh_token(refresh_token):
    """Test refresh token endpoint."""
    print_section("5. Refresh Access Token")
    payload = {"refresh_token": refresh_token}
    try:
        response = requests.post(f"{BASE_URL}/auth/refresh", json=payload)
        print(f"Status: {response.status_code}")
        data = response.json()

        if response.status_code == 200:
            print(f"New Access Token: {data['access_token'][:50]}...")
            print("✅ Token refresh successful")
            return True, data["access_token"]
        else:
            print(f"❌ Refresh failed: {data.get('detail')}")
            return False, None
    except Exception as e:
        print(f"❌ Error: {e}")
        return False, None

def test_protected_endpoint_without_token():
    """Test protected endpoint without token (should fail)."""
    print_section("6. Protected Endpoint Without Token (Should Fail)")
    try:
        response = requests.get(f"{BASE_URL}/auth/me")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")

        if response.status_code == 403 or response.status_code == 401:
            print("✅ Protected endpoint correctly rejects unauthed request")
            return True
        else:
            print("❌ Protected endpoint should reject unauthed request")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_admin_login():
    """Test admin login (seeded at startup)."""
    print_section("7. Admin Login (Default Credentials)")
    payload = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        print(f"Status: {response.status_code}")
        data = response.json()

        if response.status_code == 200:
            print(f"Access Token: {data['access_token'][:50]}...")
            print("✅ Admin login successful")
            return True, data["access_token"]
        else:
            print(f"❌ Admin login failed: {data.get('detail')}")
            return False, None
    except Exception as e:
        print(f"❌ Error: {e}")
        return False, None

def test_create_news_as_admin(admin_token):
    """Test creating news with admin token."""
    print_section("8. Create News as Admin (Protected Endpoint)")
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "title": "Test News Article",
        "slug": f"test-news-{int(time.time())}",
        "excerpt": "A test news excerpt",
        "content": "This is test news content",
        "status": "draft"
    }
    try:
        response = requests.post(f"{BASE_URL}/news", headers=headers, json=payload)
        print(f"Status: {response.status_code}")
        data = response.json()

        if response.status_code == 200:
            print(f"Created News ID: {data.get('id')}")
            print("✅ News creation successful")
            return True
        else:
            print(f"❌ News creation failed: {data.get('detail', data)}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_list_news():
    """Test listing public news."""
    print_section("9. List Public News (No Auth Required)")
    try:
        response = requests.get(f"{BASE_URL}/news")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)[:200]}...")

        if response.status_code == 200:
            print("✅ News listing successful")
            return True
        else:
            print(f"❌ Failed: {data.get('detail')}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("  SPRINT 1 — Authentication Manual Test Suite")
    print("="*60)
    print(f"\nBase URL: {BASE_URL}")
    print("Make sure docker-compose is running and backend is ready.\n")

    results = {
        "Health Check": test_health(),
    }

    if not results["Health Check"]:
        print("\n❌ Backend is not responding. Is docker-compose running?")
        sys.exit(1)

    # Test registration
    success, email, password = test_register()
    results["Register User"] = success

    if success:
        # Test login with new user
        success, access_token, refresh_token = test_login(email, password)
        results["Login"] = success

        if success:
            # Test get current user
            results["Get Current User"] = test_get_me(access_token)

            # Test refresh token
            success, new_token = test_refresh_token(refresh_token)
            results["Refresh Token"] = success

    # Test protected endpoint without token
    results["Protected Endpoint Rejection"] = test_protected_endpoint_without_token()

    # Test admin login
    success, admin_token = test_admin_login()
    results["Admin Login"] = success

    if success:
        # Test creating news as admin
        results["Create News (Protected)"] = test_create_news_as_admin(admin_token)

    # Test list news
    results["List News"] = test_list_news()

    # Summary
    print_section("Test Summary")
    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")

    print(f"\n{passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! Sprint 1 is complete.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

