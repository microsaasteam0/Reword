from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
from datetime import datetime
import requests

router = APIRouter(tags=["Support"])

SUPABASE_URL="https://ldewwmfkymjmokopulys.supabase.co/functions/v1/submit-support"
FORM_SECRET = os.getenv("FORM_SECRET") or os.getenv("NEXT_PUBLIC_ANON_KEY")

class SupportRequest(BaseModel):
   product: str
   category: str
   message: str
   user_email: EmailStr
   metadata: Optional[dict] = None

@router.post("/support")
def submit_support(payload: SupportRequest):
   response = requests.post(
       SUPABASE_URL,
       headers={
           "Content-Type": "application/json",
           "x-form-secret": FORM_SECRET
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
