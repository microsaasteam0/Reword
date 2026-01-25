from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict
from sqlalchemy.orm import Session

import os
import re
import json
import time
import requests
import httpx

from dotenv import load_dotenv
from openai import OpenAI, AsyncOpenAI
import asyncio

from database import get_db
from auth import get_current_active_user
from models import User, ContentGeneration, UsageStats
from feature_gates import get_feature_gate

from utils import (
    clean_twitter_thread,
    clean_linkedin_post,
    clean_instagram_slides
)

# ----------------------------------------------------
# Router Setup
# ----------------------------------------------------
snippetstream_router = APIRouter()
load_dotenv()

# ----------------------------------------------------
# Request + Response Models
# ----------------------------------------------------
class ContentRequest(BaseModel):
    content: Optional[str] = None
    url: Optional[HttpUrl] = None
    content_type: str = "markdown"

    browser_info: Optional[Dict] = None
    session_id: Optional[str] = None
    timezone: Optional[str] = None
    screen_resolution: Optional[str] = None


class SocialMediaResponse(BaseModel):
    twitter_thread: List[str]
    linkedin_post: str
    instagram_carousel: List[str]
    original_content_preview: str


# ----------------------------------------------------
# Pollinations Client Setup
# ----------------------------------------------------
client = None


async_client = None


def initialize_client():
    global client, async_client

    if client is None:
        print("🔧 Initializing Pollinations Client...")
        api_key = os.getenv("POLLINATIONS_API_KEY")
        if not api_key:
            raise Exception("❌ POLLINATIONS_API_KEY missing in environment")

        http_client = httpx.Client(timeout=60, verify=False)
        client = OpenAI(
            api_key=api_key,
            base_url="https://gen.pollinations.ai/v1",
            http_client=http_client
        )
        
        # Async client for parallel requests
        async_http_client = httpx.AsyncClient(timeout=60, verify=False)
        async_client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://gen.pollinations.ai/v1",
            http_client=async_http_client
        )

        print("✅ Connected to Pollinations API (Sync + Async)")


# ----------------------------------------------------
# Async Safe Completion Wrapper
# ----------------------------------------------------
async def safe_completion_async(messages, max_tokens=2000):
    global async_client
    if async_client is None:
        initialize_client()

    # Prioritize Mistral for speed and reliability
    models_to_try = ["mistral", "openai", "searchgpt"]
    
    for model_name in models_to_try:
        for attempt in range(2): 
            try:
                response = await async_client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=0.7,
                )

                if not response.choices:
                    continue

                content = response.choices[0].message.content

                if not content:
                    print(f"⚠️ Model {model_name} (attempt {attempt+1}) returned EMPTY content.")
                    continue

                print(f"✅ Generated content using {model_name}")
                return content.strip()

            except Exception as e:
                print(f"❌ Pollinations {model_name} attempt {attempt+1} failed: {str(e)}")
                await asyncio.sleep(0.5)

    return None


# ----------------------------------------------------
# URL Content Fetcher (Advanced)
# ----------------------------------------------------
def fetch_content_from_url(url: str) -> str:
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, timeout=10, headers=headers)
        response.raise_for_status()

        from bs4 import BeautifulSoup
        soup = BeautifulSoup(response.text, "html.parser")

        # Remove junk
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        # Extract main content
        main = soup.find("article") or soup.find("main") or soup.find("div", class_="content")

        text = main.get_text(" ", strip=True) if main else soup.get_text(" ", strip=True)

        return text[:15000]

    except ImportError:
        # Fallback if bs4 is missing
        content = re.sub(r'<[^>]+>', ' ', response.text)
        content = re.sub(r'\s+', ' ', content).strip()
        return content[:15000]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch content: {str(e)}")


# ----------------------------------------------------
# Twitter Thread Generator (Async)
# ----------------------------------------------------
async def create_twitter_thread_async(content: str) -> List[str]:

    system_prompt = """
You are a social media expert.

Create EXACTLY 10 independent X posts.

Rules:
- Each under 200 characters
- Each ends with 2-3 hashtags
- Numbered 1/10 ... 10/10
- Standalone posts (no continuation)

Return only the 10 lines.
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": content}
    ]

    result = await safe_completion_async(messages, max_tokens=2000)

    if not result:
        return ["❌ Twitter generation failed"]

    posts = [line.strip() for line in result.split("\n") if line.strip()]

    # Ensure exactly 10 posts
    default_posts = [
        "💡 Small habits create big success. #Growth #Success",
        "🚀 Focus on what matters most daily. #Productivity #Mindset",
        "⚡ Progress beats perfection every time. #Learning #Goals",
        "🎯 Clarity makes execution easier. #Business #Focus",
        "🔥 Discipline builds unstoppable momentum. #Motivation #Habits",
        "📈 Track progress to improve faster. #SelfGrowth #Success",
        "🧠 Learning is your biggest advantage. #Skills #Development",
        "⭐ Consistency creates long-term results. #Consistency #Growth",
        "✨ Your mindset shapes your outcomes. #Mindset #Success",
        "👉 Take action today, not someday. #Action #Motivation"
    ]

    while len(posts) < 10:
        posts.append(f"{len(posts)+1}/10 {default_posts[len(posts)]}")

    return posts[:10]


# ----------------------------------------------------
# LinkedIn Post Generator (Async)
# ----------------------------------------------------
async def create_linkedin_post_async(content: str) -> str:

    system_prompt = """
You are a LinkedIn content strategist.

Structure:
1. Hook
2. Short paragraphs with double breaks
3. Bullet points
4. Call-to-action question
5. 3-5 hashtags

Use emojis (2-3 total).
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": content}
    ]

    result = await safe_completion_async(messages, max_tokens=1500)

    if not result:
        return "❌ LinkedIn generation failed"

    return result


# ----------------------------------------------------
# Instagram Carousel Generator (Async)
# ----------------------------------------------------
async def create_instagram_carousel_async(content: str) -> List[str]:

    system_prompt = """
Create exactly 6-8 Instagram carousel slides.

Each slide must be exactly 2 lines:

Emoji + TITLE (uppercase)
Short description (max 6 words)

Return slides only.
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": content}
    ]

    result = await safe_completion_async(messages, max_tokens=1500)

    if not result:
        return ["❌ Carousel generation failed"]

    raw_slides = result.split("\n\n")

    slides = []
    for slide in raw_slides:
        lines = slide.strip().split("\n")
        if len(lines) == 2:
            slides.append(slide.strip())

    # Default backup slides
    default_slides = [
        "💡 KEY INSIGHT\nFocus drives success",
        "🚀 TAKE ACTION\nStart implementing today",
        "⚡ STAY CONSISTENT\nDaily habits matter",
        "🎯 SET GOALS\nClear targets win",
        "📈 TRACK RESULTS\nMeasure progress always",
        "✨ KEEP GROWING\nNever stop learning",
        "🔥 STAY MOTIVATED\nYour future matters",
        "👉 FOLLOW FOR MORE\nDaily content tips"
    ]

    while len(slides) < 6:
        slides.append(default_slides[len(slides)])

    return slides[:8]


# ----------------------------------------------------
# Main Repurpose Endpoint (Full)
# ----------------------------------------------------
@snippetstream_router.post("/repurpose", response_model=SocialMediaResponse)
async def repurpose_content(
    request: ContentRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):

    try:
        feature_gate = get_feature_gate(current_user)

        # Generation limit check
        if not feature_gate.can_generate_content(db):
            raise HTTPException(status_code=429, detail="Daily generation limit reached")

        # URL is Pro-only
        if request.url and not feature_gate.can_process_urls():
            raise HTTPException(status_code=403, detail="URL processing is Pro feature")

        # Content input
        if request.url:
            content = fetch_content_from_url(str(request.url))
            source = "url"
        elif request.content:
            content = request.content
            source = "text"
        else:
            raise HTTPException(status_code=400, detail="Content or URL required")

        if not content or len(content.strip()) < 10:
            raise HTTPException(status_code=400, detail="Content is too short or empty")

        # Content length limit
        max_length = feature_gate.get_feature_limits(db)["max_content_length"]
        if len(content) > max_length:
            print(f"✂️ Truncating content from {len(content)} to {max_length}")
            content = content[:max_length] + "..."

        preview = content[:200] + "..." if len(content) > 200 else content

        print(f"🚀 Processing repurpose request for user {current_user.id} (Source: {source}, Length: {len(content)})")
        start_time = time.time()

        # Generate all outputs in parallel for maximum speed
        print("⚡ Triggering parallel generation for all platforms...")
        
        twitter_task = create_twitter_thread_async(content)
        linkedin_task = create_linkedin_post_async(content)
        instagram_task = create_instagram_carousel_async(content)
        
        results = await asyncio.gather(
            twitter_task,
            linkedin_task,
            instagram_task,
            return_exceptions=True
        )
        
        # Unpack results and handle potential errors
        raw_twitter = results[0] if not isinstance(results[0], Exception) else ["❌ Twitter error"]
        raw_linkedin = results[1] if not isinstance(results[1], Exception) else "❌ LinkedIn error"
        raw_instagram = results[2] if not isinstance(results[2], Exception) else ["❌ Instagram error"]
        
        # Clean results
        twitter_thread = clean_twitter_thread(raw_twitter)
        linkedin_post = clean_linkedin_post(raw_linkedin)
        instagram_carousel = clean_instagram_slides(raw_instagram)

        processing_time = time.time() - start_time

        # Save generation
        try:
            generation = ContentGeneration(
                user_id=current_user.id,
                original_content=content[:1000],
                content_source=source,
                twitter_thread=json.dumps(twitter_thread),
                linkedin_post=linkedin_post,
                instagram_carousel=json.dumps(instagram_carousel),
                processing_time=processing_time,
            )
            db.add(generation)

            usage = UsageStats(
                user_id=current_user.id,
                action="generate",
                extra_data=json.dumps(
                    {"source": source, "processing_time": processing_time}
                ),
            )
            db.add(usage)

            db.commit()

        except Exception as db_error:
            print("⚠️ Database save failed:", db_error)
            db.rollback()

        return SocialMediaResponse(
            twitter_thread=twitter_thread,
            linkedin_post=linkedin_post,
            instagram_carousel=instagram_carousel,
            original_content_preview=preview,
        )

    except HTTPException:
        # Re-raise HTTP exceptions (429, 403, etc)
        raise
    except Exception as e:
        import traceback
        print(f"❌ Error in repurpose_content: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e) or type(e).__name__}")


# ----------------------------------------------------
# Analytics Endpoint
# ----------------------------------------------------
@snippetstream_router.post("/analytics/track")
async def track_usage(
    data: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Track user interactions for analytics"""
    try:
        usage_stat = UsageStats(
            user_id=current_user.id,
            action=data.get("action", "unknown"),
            platform=data.get("platform"),
            extra_data=json.dumps(data)
        )
        db.add(usage_stat)
        db.commit()

        return {"status": "tracked"}
    except Exception as e:
        print(f"⚠️ Analytics tracking failed: {e}")
        return {"status": "error", "message": str(e)}


# ----------------------------------------------------
# Health Endpoint
# ----------------------------------------------------
@snippetstream_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "SnippetStream"}
