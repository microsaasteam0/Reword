from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
from datetime import datetime
import requests

router = APIRouter(tags=["Support"])

SUPABASE_URL = "https://ldewwmfkymjmokopulys.supabase.co/functions/v1/submit-support"
NEXT_PUBLIC_ANON_KEY = os.getenv("NEXT_PUBLIC_ANON_KEY")

class SupportTicket(BaseModel):
    product: str
    category: str
    user_email: EmailStr
    message: str
    metadata: Optional[dict] = None

class ContactRequest(BaseModel):
    email: str
    message: str
    timestamp: Optional[str] = None
    username: Optional[str] = None

def send_support_email(email: str, message: str, username: Optional[str] = None, category: Optional[str] = None, product: Optional[str] = None, metadata: Optional[dict] = None):
    """
    Send support email using Brevo (Sendinblue) API
    """
    # Get configuration from environment variables
    brevo_api_key = os.getenv("BREVO_API_KEY", "")
    from_email = os.getenv("BREVO_FROM_EMAIL", "noreply@entrext.com")
    from_name = os.getenv("BREVO_FROM_NAME", f"{product or 'Reword'} Support")
    to_email = os.getenv("BREVO_TO_EMAIL", "business@entrext.in")
    
    # Email content
    display_info = f"{username} ({email})" if username else email
    subject = f"[{category or 'Support'}] {product or 'Reword'} Support Request from {display_info}"
    
    backend_url = os.getenv("BACKEND_URL", "https://snippetstream-api22-production.up.railway.app")
    
    # Format metadata as HTML if present
    metadata_html = ""
    if metadata:
        metadata_html = "<h3>Metadata:</h3><ul>"
        for key, value in metadata.items():
            metadata_html += f"<li><strong>{key}:</strong> {value}</li>"
        metadata_html += "</ul>"

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #3b82f6; padding: 30px; text-align: center;">
            <h2 style="color: white; margin: 0;">New Support Request</h2>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">{product or 'Reword'} Submissions</p>
        </div>
        
        <div style="padding: 20px;">
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0;"><strong>From:</strong> {email}</p>
                <p style="margin: 5px 0 0 0;"><strong>Category:</strong> {category or 'General'}</p>
                <p style="margin: 5px 0 0 0;"><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #1e293b;">Message:</h3>
                <div style="white-space: pre-wrap; color: #475569; background-color: #fff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px;">{message}</div>
            </div>
            
            {metadata_html}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="color: #64748b; font-size: 14px; margin: 0;">
                    Reply to this email to respond to <strong>{email}</strong>
                </p>
            </div>
        </div>
    </div>
    """
    
    try:
        if not brevo_api_key:
            print(f"⚠️ BREVO_API_KEY not found. Simulating email send for {email}")
            return

        # Brevo API endpoint
        url = "https://api.brevo.com/v3/smtp/email"
        
        headers = {
            "accept": "application/json",
            "api-key": brevo_api_key,
            "content-type": "application/json"
        }
        
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
                "name": "User"
            },
            "subject": subject,
            "htmlContent": html_content
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code in [200, 201]:
            print(f"✅ Support email sent successfully for {email}")
        else:
            print(f"❌ Brevo API error: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Failed to send support email: {str(e)}")
        
@router.post("/contact")
async def contact_support(request: ContactRequest, background_tasks: BackgroundTasks):
    """
    Handle contact support requests (legacy format)
    """
    try:
        background_tasks.add_task(send_support_email, request.email, request.message, request.username)
        return {"success": True, "message": "Message received"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/support")
async def submit_ticket(payload: SupportTicket):
    """
    Handle support tickets by forwarding to Supabase Edge Function
    The secret key is only stored in the backend to prevent spam.
    """
    try:
        if not NEXT_PUBLIC_ANON_KEY:
            # Fallback to local logging if secret is missing
            print("⚠️ NEXT_PUBLIC_ANON_KEY not found in environment variables")
            # You might want to still send it but Supabase might reject
            
        response = requests.post(
            SUPABASE_URL,
            headers={
                "Content-Type": "application/json",
                "x-form-secret": NEXT_PUBLIC_ANON_KEY or ""
            },
            json=payload.dict()
        )

        if response.status_code == 429:
            raise HTTPException(
                status_code=429,
                detail="Too many submissions. Try again later."
            )

        if not response.ok:
            raise HTTPException(
                status_code=response.status_code,
                detail=response.text
            )

        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Support submission error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit support ticket")
