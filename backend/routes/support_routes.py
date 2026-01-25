from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import os
from datetime import datetime
import requests

router = APIRouter(prefix="/api/v1/support", tags=["Support"])

class ContactRequest(BaseModel):
    email: str
    message: str
    timestamp: str
    username: Optional[str] = None

def send_support_email(email: str, message: str, username: Optional[str] = None):
    """
    Send support email using Brevo (Sendinblue) API
    """
    # Get configuration from environment variables
    brevo_api_key = os.getenv("BREVO_API_KEY", "")
    from_email = os.getenv("BREVO_FROM_EMAIL", "noreply@yourdomain.com")
    from_name = os.getenv("BREVO_FROM_NAME", "Reword Support")
    to_email = os.getenv("BREVO_TO_EMAIL", "business@entrext.in")
    
    print(f"📧 Attempting to send support email from {email}")
    print(f"📧 Brevo Config: from={from_email}, to={to_email}")
    
    # Email content
    display_info = f"{username} ({email})" if username else email
    subject = f"Reword Support Request from {display_info}"
    
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="padding: 20px; text-align: center;">
            <img src="{backend_url.rstrip('/')}/static/logo.png" alt="Reword Logo" style="width: 60px; height: 60px; margin-bottom: 10px;">
            <h2 style="color: #3b82f6; margin: 10px 0;">New Support Request</h2>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>From:</strong> {email}</p>
            <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
        
        <div style="background-color: #fff; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Message:</h3>
            <p style="white-space: pre-wrap; color: #555;">{message}</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #888; font-size: 14px;">
                Please reply directly to this email to respond to the user at: <strong>{email}</strong>
            </p>
        </div>
    </div>
    """
    
    try:
        if not brevo_api_key:
            # If no API key, just print to console (useful for dev)
            print("⚠️ BREVO_API_KEY not found. Simulating email send:")
            print(f"Subject: {subject}")
            print(f"From: {from_name} <{from_email}>")
            print(f"To: {to_email}")
            print(f"Reply-To: {email}")
            print(f"\nMessage:\n{message}")
            print("\n💡 To enable email sending, add BREVO_API_KEY to your .env file")
            return

        # Brevo API endpoint
        url = "https://api.brevo.com/v3/smtp/email"
        
        # Headers
        headers = {
            "accept": "application/json",
            "api-key": brevo_api_key,
            "content-type": "application/json"
        }
        
        # Email payload
        payload = {
            "sender": {
                "name": from_name,
                "email": from_email
            },
            "to": [
                {
                    "email": to_email,
                    "name": "Support Team"
                }
            ],
            "replyTo": {
                "email": email,
                "name": "Customer"
            },
            "subject": subject,
            "htmlContent": html_content
        }
        
        print(f"📤 Sending email via Brevo...")
        
        # Send email using Brevo API
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Support email sent successfully via Brevo!")
            print(f"📧 Message ID: {result.get('messageId', 'N/A')}")
        else:
            print(f"❌ Brevo API error: {response.status_code}")
            print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"❌ Failed to send support email via Brevo: {str(e)}")
        print(f"💡 Error type: {type(e).__name__}")
        # Don't raise error to client, just log it
        
@router.post("/contact")
async def contact_support(request: ContactRequest, background_tasks: BackgroundTasks):
    """
    Handle contact support requests
    """
    try:
        # Send email in background to avoid blocking response
        background_tasks.add_task(send_support_email, request.email, request.message, request.username)
        
        return {
            "success": True, 
            "message": "Message received. We will get back to you shortly."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
