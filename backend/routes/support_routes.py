from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
import requests

router = APIRouter(tags=["Support"])

SUPABASE_URL="https://ldewwmfkymjmokopulys.supabase.co/functions/v1/submit-support"

class SupportRequest(BaseModel):
   product: str
   category: str
   message: str
   user_email: EmailStr
   metadata: Optional[dict] = None

@router.post("/support")
def submit_support(payload: SupportRequest):
   # Robust secret retrieval
   form_secret = os.getenv("FORM_SECRET") or os.getenv("NEXT_PUBLIC_ANON_KEY")
   
   if not form_secret:
       print("⚠️ Critical: FORM_SECRET is missing in backend environment variables.")

   # Call Supabase exactly as per docs
   response = requests.post(
       SUPABASE_URL,
       headers={
           "Content-Type": "application/json",
           "x-form-secret": form_secret or "",
           "Authorization": f"Bearer {form_secret or ''}" # Key addition for standard Supabase auth
       },
       json=payload.dict()
   )

   if response.status_code == 429:
       raise HTTPException(
           status_code=429,
           detail="Too many submissions. Try again later."
       )

   if not response.ok:
       print(f"❌ Supabase Error: {response.text}")
       raise HTTPException(
           status_code=response.status_code,
           detail=response.text
       )

   return response.json()
