
import os
import requests
import logging
import json
from typing import List, Optional, Dict, Any

# Configure logger
logger = logging.getLogger("EmailService")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('[%(name)s] %(message)s'))
logger.addHandler(handler)

class BrevoEmailService:
    def __init__(self):
        self.api_url = "https://api.brevo.com/v3/smtp/email"
        self.api_key = os.getenv("BREVO_API_KEY")
        self.sender_email = os.getenv("BREVO_FROM_EMAIL", "mohit@entrext.in")
        self.sender_name = os.getenv("BREVO_FROM_NAME", "Reword")
        
        if not self.api_key:
            logger.warning("BREVO_API_KEY not found. Email service disabled.")
        elif self.api_key.startswith("xsmtpsib"):
            logger.warning("BREVO_API_KEY starts with 'xsmtpsib'. This looks like an SMTP key. The API requires an 'xkeysib' key. Emails might fail.")
        else:
            logger.info("Brevo service initialized successfully")

    def send_verification_email(self, to_email: str, username: str, verification_token: str) -> bool:
        """Send account verification email"""
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        verify_url = f"{frontend_url}/verify-email?token={verification_token}"
        
        subject = "Confirm your Reword account"
        
        backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="padding: 30px; text-align: center; background-color: transparent;">
                <img src="{backend_url.rstrip('/')}/static/logo.png" alt="Reword Logo" style="width: 80px; height: 80px; margin-bottom: 10px;">
                <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">Reword</h1>
            </div>
            
            <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <p>Hi {username},</p>
                <p>Thanks for joining Reword! We're excited to have you here. To get started, please confirm your email address by clicking the button below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verify_url}" style="background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Verify Email Address</a>
                </div>
                
                <p style="font-size: 14px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="font-size: 14px; color: #3b82f6; word-break: break-all;">{verify_url}</p>
                
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                
                <p style="font-size: 12px; color: #9ca3af;">This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
            </div>
        </div>
        """
        
        return self.send_email(to_email, subject, html_content)

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send an email using the Brevo (Sendinblue) API via HTTP.
        Equivalent to the Node.js sendMail function.
        """
        logger.info(f"sendMail called for: {to_email}")

        if not self.api_key:
            logger.error("Brevo not initialized (No API Key). Cannot send email.")
            return False

        headers = {
            "accept": "application/json",
            "api-key": self.api_key,
            "content-type": "application/json"
        }
        
        payload = {
            "sender": {
                "name": self.sender_name,
                "email": self.sender_email
            },
            "to": [
                {
                    "email": to_email
                }
            ],
            "subject": subject,
            "htmlContent": html_content
        }
        
        if text_content:
            payload["textContent"] = text_content

        try:
            logger.info(f"Sending email via Brevo API to {to_email}...")
            
            response = requests.post(self.api_url, headers=headers, json=payload)
            
            if response.status_code in [200, 201]:
                data = response.json()
                message_id = data.get("messageId", "unknown")
                logger.info(f"Email sent successfully via Brevo. Message ID: {message_id}")
                return True
            else:
                logger.error(f"Brevo Error while sending to {to_email}: Status {response.status_code}")
                logger.error(f"Brevo Error details: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Brevo Error while sending to {to_email}: {str(e)}")
            return False

# Singleton instance
email_service = BrevoEmailService()
