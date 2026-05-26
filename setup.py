#!/usr/bin/env python3
"""
Setup helper script for Sprint 0 & 1.
Creates .env file and initializes project for local development.

Usage:
  python setup.py
"""

import os
import sys
import secrets
from pathlib import Path

def generate_secret_key(length: int = 32) -> str:
    """Generate a secure random secret key."""
    return secrets.token_urlsafe(length)

def setup_backend_env():
    """Create backend .env file from template."""
    backend_dir = Path("backend")
    env_example = backend_dir / ".env.example"
    env_file = backend_dir / ".env"

    if env_file.exists():
        print(f"✅ {env_file} already exists, skipping.")
        return

    if not env_example.exists():
        print(f"❌ {env_example} not found. Are you in the project root?")
        return

    # Read template
    with open(env_example, 'r') as f:
        content = f.read()

    # Replace placeholders
    secret_key = generate_secret_key()
    content = content.replace("change-me", secret_key)
    content = content.replace("change-me-in-production", secret_key)

    # Write .env
    with open(env_file, 'w') as f:
        f.write(content)

    print(f"✅ Created {env_file}")
    print(f"   Secret Key: {secret_key[:20]}...")
    print(f"   Admin credentials: admin@example.com / admin123")
    print(f"   Database: Postgres (from docker-compose)")

def setup_frontend_env():
    """Create frontend .env file from template."""
    frontend_dir = Path("frontend")
    env_example = frontend_dir / ".env.example"
    env_file = frontend_dir / ".env"

    if env_file.exists():
        print(f"✅ {env_file} already exists, skipping.")
        return

    if not env_example.exists():
        print(f"⚠️  {env_example} not found, skipping frontend setup.")
        return

    # Read template
    with open(env_example, 'r') as f:
        content = f.read()

    # Write .env with defaults
    with open(env_file, 'w') as f:
        f.write(content)

    print(f"✅ Created {env_file}")
    print(f"   API URL: http://localhost:4000/api/v1")

def main():
    """Run setup."""
    print("\n" + "="*60)
    print("  U.E. Sagrado Corazón — Sprint 0 & 1 Setup")
    print("="*60 + "\n")

    # Check if in project root
    if not Path("docker-compose.yml").exists():
        print("❌ docker-compose.yml not found. Are you in the project root?")
        return 1

    print("Setting up environment files...\n")

    setup_backend_env()
    setup_frontend_env()

    print("\n" + "="*60)
    print("  Setup complete! Next steps:")
    print("="*60)
    print("""
1. Start services:
   docker-compose up --build

2. Wait for Postgres to be ready (~5 seconds)

3. Access:
   - API Docs: http://localhost:4000/docs
   - Frontend: http://localhost:3000
   - Health:   http://localhost:4000/api/v1/health

4. Test authentication:
   - Login: admin@example.com / admin123
   - Run: python backend/test_manual.py

5. Run unit tests:
   - cd backend && pytest tests/test_auth.py -v

📚 See QUICK_START.md for more information.
""")

    return 0

if __name__ == "__main__":
    sys.exit(main())

