"""
Tests for news permissions (edit, publish, manage attachments).
Validates that only creator or admin can edit/attach; only admin can publish.
"""
import pytest
from uuid import UUID
from fastapi import status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import News, User, Role
from app.session_ops import session_commit, session_exec


@pytest.mark.asyncio
async def test_update_news_creator_can_edit_own_draft(client, admin_token, editor_token, session: AsyncSession):
    """Creator can edit their own draft."""
    # Create a news as editor
    news_data = {"title": "Test News", "excerpt": "Test", "content": "Test content", "status": "draft"}
    response = client.post("/api/v1/news", json=news_data, headers={"Authorization": f"Bearer {editor_token}"})
    assert response.status_code == 201
    news_id = response.json()["id"]

    # Editor updates their own news
    update_data = {"title": "Updated Title", "content": "Updated content"}
    response = client.put(f"/api/v1/news/{news_id}", json=update_data, headers={"Authorization": f"Bearer {editor_token}"})
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"


@pytest.mark.asyncio
async def test_update_news_non_creator_cannot_edit(client, admin_token, editor_token, other_editor_token, session: AsyncSession):
    """Non-creator editor cannot edit another editor's draft."""
    # Create news as editor1
    news_data = {"title": "Test News", "excerpt": "Test", "content": "Test content", "status": "draft"}
    response = client.post("/api/v1/news", json=news_data, headers={"Authorization": f"Bearer {editor_token}"})
    assert response.status_code == 201
    news_id = response.json()["id"]

    # Editor2 tries to update editor1's news
    update_data = {"title": "Hacked Title"}
    response = client.put(f"/api/v1/news/{news_id}", json=update_data, headers={"Authorization": f"Bearer {other_editor_token}"})
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_news_admin_can_edit_any(client, admin_token, editor_token, session: AsyncSession):
    """Admin can edit any news."""
    # Create news as editor
    news_data = {"title": "Test News", "excerpt": "Test", "content": "Test content", "status": "draft"}
    response = client.post("/api/v1/news", json=news_data, headers={"Authorization": f"Bearer {editor_token}"})
    assert response.status_code == 201
    news_id = response.json()["id"]

    # Admin updates editor's news
    update_data = {"title": "Admin Updated", "content": "Admin update"}
    response = client.put(f"/api/v1/news/{news_id}", json=update_data, headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    assert response.json()["title"] == "Admin Updated"


@pytest.mark.asyncio
async def test_publish_news_only_admin_can_publish(client, admin_token, editor_token, session: AsyncSession):
    """Only admin can publish news."""
    # Create news as editor
    news_data = {"title": "Test News", "excerpt": "Test", "content": "Test content", "status": "draft"}
    response = client.post("/api/v1/news", json=news_data, headers={"Authorization": f"Bearer {editor_token}"})
    assert response.status_code == 201
    news_id = response.json()["id"]

    # Editor tries to publish their own news -> should fail when trying to set status to published
    update_data = {"status": "published"}
    response = client.put(f"/api/v1/news/{news_id}", json=update_data, headers={"Authorization": f"Bearer {editor_token}"})
    assert response.status_code == 403

    # Admin publishes the news -> should succeed
    response = client.post(f"/api/v1/news/{news_id}/publish", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    assert response.json()["status"] == "published"


@pytest.mark.asyncio
async def test_upload_attachment_creator_can_attach(client, editor_token, session: AsyncSession):
    """Creator can upload attachments to their own news."""
    # Create news as editor
    news_data = {"title": "Test News", "excerpt": "Test", "content": "Test", "status": "draft"}
    response = client.post("/api/v1/news", json=news_data, headers={"Authorization": f"Bearer {editor_token}"})
    assert response.status_code == 201
    news_id = response.json()["id"]

    # Creator uploads attachment
    files = {"file": ("test.txt", b"test content", "text/plain")}
    response = client.post(
        f"/api/v1/news/{news_id}/attachments",
        headers={"Authorization": f"Bearer {editor_token}"},
        files=files
    )
    assert response.status_code == 200
    assert len(response.json()["attachments"]) >= 1


@pytest.mark.asyncio
async def test_upload_attachment_non_creator_cannot_attach(client, editor_token, other_editor_token, session: AsyncSession):
    """Non-creator cannot upload attachments."""
    # Create news as editor1
    news_data = {"title": "Test News", "excerpt": "Test", "content": "Test", "status": "draft"}
    response = client.post("/api/v1/news", json=news_data, headers={"Authorization": f"Bearer {editor_token}"})
    assert response.status_code == 201
    news_id = response.json()["id"]

    # Editor2 tries to upload attachment
    files = {"file": ("test.txt", b"test content", "text/plain")}
    response = client.post(
        f"/api/v1/news/{news_id}/attachments",
        headers={"Authorization": f"Bearer {other_editor_token}"},
        files=files
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_upload_attachment_admin_can_attach(client, admin_token, editor_token, session: AsyncSession):
    """Admin can upload attachments to any news."""
    # Create news as editor
    news_data = {"title": "Test News", "excerpt": "Test", "content": "Test", "status": "draft"}
    response = client.post("/api/v1/news", json=news_data, headers={"Authorization": f"Bearer {editor_token}"})
    assert response.status_code == 201
    news_id = response.json()["id"]

    # Admin uploads attachment
    files = {"file": ("admin_file.txt", b"admin content", "text/plain")}
    response = client.post(
        f"/api/v1/news/{news_id}/attachments",
        headers={"Authorization": f"Bearer {admin_token}"},
        files=files
    )
    assert response.status_code == 200
    assert len(response.json()["attachments"]) >= 1


@pytest.mark.asyncio
async def test_delete_attachment_creator_can_delete(client, editor_token, session: AsyncSession):
    """Creator can delete their attachments."""
    # Create news as editor
    news_data = {"title": "Test News", "excerpt": "Test", "content": "Test", "status": "draft"}
    response = client.post("/api/v1/news", json=news_data, headers={"Authorization": f"Bearer {editor_token}"})
    assert response.status_code == 201
    news_id = response.json()["id"]

    # Upload attachment
    files = {"file": ("test.txt", b"test", "text/plain")}
    response = client.post(
        f"/api/v1/news/{news_id}/attachments",
        headers={"Authorization": f"Bearer {editor_token}"},
        files=files
    )
    assert response.status_code == 200
    attachment_id = response.json()["attachments"][0]["id"]

    # Creator deletes attachment
    response = client.delete(
        f"/api/v1/news/{news_id}/attachments/{attachment_id}",
        headers={"Authorization": f"Bearer {editor_token}"}
    )
    assert response.status_code == 200
    updated_attachments = response.json()["attachments"]
    assert all(att["id"] != attachment_id for att in updated_attachments)


@pytest.mark.asyncio
async def test_delete_attachment_non_creator_cannot_delete(client, editor_token, other_editor_token, session: AsyncSession):
    """Non-creator cannot delete attachments."""
    # Create news as editor1
    news_data = {"title": "Test News", "excerpt": "Test", "content": "Test", "status": "draft"}
    response = client.post("/api/v1/news", json=news_data, headers={"Authorization": f"Bearer {editor_token}"})
    assert response.status_code == 201
    news_id = response.json()["id"]

    # Upload attachment as editor1
    files = {"file": ("test.txt", b"test", "text/plain")}
    response = client.post(
        f"/api/v1/news/{news_id}/attachments",
        headers={"Authorization": f"Bearer {editor_token}"},
        files=files
    )
    assert response.status_code == 200
    attachment_id = response.json()["attachments"][0]["id"]

    # Editor2 tries to delete
    response = client.delete(
        f"/api/v1/news/{news_id}/attachments/{attachment_id}",
        headers={"Authorization": f"Bearer {other_editor_token}"}
    )
    assert response.status_code == 403

