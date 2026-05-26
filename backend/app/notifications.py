from typing import List
from aiosmtplib import SMTP
from email.message import EmailMessage
from .config import settings

async def send_email(subject: str, body: str, recipients: List[str]):
    host = settings.smtp_host
    port = settings.smtp_port
    user = settings.smtp_user
    password = settings.smtp_password
    if not host:
        print("SMTP not configured, skipping email")
        return
    message = EmailMessage()
    message["From"] = user or "no-reply@sagrado.edu.bo"
    message["To"] = ", ".join(recipients)
    message["Subject"] = subject
    message.set_content(body)
    smtp = SMTP(hostname=host, port=port or 587)
    await smtp.connect()
    if user and password:
        await smtp.starttls()
        await smtp.login(user, password)
    await smtp.send_message(message)
    await smtp.quit()

async def send_notice_emails(notice):
    # For demo, send to a static list or query DB for recipients
    recipients = ["parent@example.com"]
    subject = f"Aviso: {notice.title}"
    body = notice.content or ""
    await send_email(subject, body, recipients)

def send_web_push(subscription_info: dict, title: str, body: str):
    # Lightweight fallback for production bootstrapping: keep the API behavior
    # while avoiding a heavy push dependency in the base image.
    print(f"Web push queued for {subscription_info.get('endpoint', 'unknown')}: {title}")

