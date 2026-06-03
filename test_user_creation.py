import asyncio
import aiohttp
import json

async def test_user_creation():
    base_url = "http://localhost:4000/api/v1"

    # Credenciales admin (desde .env o docker-compose)
    admin_email = "admin@example.com"
    admin_password = "admin123"

    async with aiohttp.ClientSession() as session:
        # 1. Login as admin
        print("1. Logging in as admin...")
        login_resp = await session.post(
            f"{base_url}/auth/login",
            json={"email": admin_email, "password": admin_password}
        )

        if login_resp.status != 200:
            login_data = await login_resp.text()
            print(f"Login failed: {login_resp.status} - {login_data}")
            return

        login_data = await login_resp.json()
        access_token = login_data.get("access_token")
        print(f"✓ Login successful! Token: {access_token[:20]}...")

        # 2. Create a new user
        print("\n2. Creating new user as admin...")
        new_user = {
            "email": "test.user@example.com",
            "password": "testpass123",
            "name": "Test User",
            "role_name": "STUDENT"
        }

        headers = {"Authorization": f"Bearer {access_token}"}

        create_resp = await session.post(
            f"{base_url}/auth/users",
            json=new_user,
            headers=headers
        )

        create_data = await create_resp.text()
        print(f"Response status: {create_resp.status}")
        print(f"Response body: {create_data}")

        if create_resp.status == 200:
            user_data = await create_resp.json()
            print(f"✓ User created successfully!")
            print(json.dumps(user_data, indent=2))
        else:
            print(f"✗ User creation failed")

if __name__ == "__main__":
    asyncio.run(test_user_creation())

