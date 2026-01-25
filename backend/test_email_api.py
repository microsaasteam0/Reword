
import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
SENDER_EMAIL = os.getenv("SMTP_EMAIL", "mohit@entrext.in")
TO_EMAIL = os.getenv("SMTP_RECEIVER") # This will read the variable from .env

def test_email_api():
    url = "https://api.brevo.com/v3/smtp/email"
    
    if not BREVO_API_KEY:
        print("❌ Error: BREVO_API_KEY not found in .env")
        return
        
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }
    
    payload = {
        "sender": {
            "name": "SnippetStream Test",
            "email": SENDER_EMAIL
        },
        "to": [
            {
                "email": TO_EMAIL,
                "name": "SnippetStream User"
            }
        ],
        "subject": "SnippetStream API Test (New Account)",
        "htmlContent": "<html><body><h1>It Works!</h1><p>Your new Brevo account is correctly configured.</p></body></html>"
    }
    
    print(f"Attempting to send email via Brevo API...")
    print(f"API Key: {BREVO_API_KEY[:10]}... (hidden)")
    print(f"From: {SENDER_EMAIL}")
    print(f"To: {TO_EMAIL}")
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code in [200, 201]:
            print("\nSUCCESS! Email sent via API.")
            print(f"Response: {response.text}")
        else:
            print("\nFAILED. Check the error message below:")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"\nERROR: {str(e)}")

if __name__ == "__main__":
    test_email_api()
