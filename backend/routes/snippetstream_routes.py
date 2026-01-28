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
    context: Optional[Dict] = None


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
async def create_twitter_thread_async(content: str, context: Optional[Dict] = None) -> List[str]:

    system_prompt = """
You are an expert X (Twitter) thread writer.

Create EXACTLY 10 tweets that form ONE connected thread.

Thread Structure:
1/10 Hook (big attention grabber)
2/10 The problem or pain point
3/10 Why it matters (personal/professional)
4/10 What you built or achieved
5/10 Key highlight #1
6/10 Key highlight #2
7/10 Your role/contribution
8/10 Lesson learned
9/10 Bigger takeaway for others
10/10 Call-to-action + engagement question

Rules:
- Each tweet must be under 240 characters
- Each tweet must start with "1/10", "2/10"... "10/10"
- Tweets should feel connected (not standalone)
- Use max 1 emoji per tweet
- Hashtags ONLY in the final tweet (2–3 hashtags)
- Return ONLY the 10 tweets, one per line

If any context field is missing, skip it gracefully.
Do NOT invent fake details.
"""


    if context:
        system_prompt += f"\n\nPersonalization Context:\n"
        if context.get('audience'): system_prompt += f"- Audience: {context['audience']}\n"
        if context.get('tone'): system_prompt += f"- Tone: {context['tone']}\n"
        if context.get('mood'): system_prompt += f"- Mood: {context['mood']}\n"
        if context.get('xThreadType'): system_prompt += f"- Thread Strategy: {context['xThreadType']}\n"
        
        # Add deep story context if present
        if context.get('event'): system_prompt += f"- Specific Event: {context['event']}\n"
        if context.get('importance'): system_prompt += f"- Why it matters: {context['importance']}\n"
        if context.get('highlights'): system_prompt += f"- Highlights/Wins: {context['highlights']}\n"
        if context.get('lessons'): system_prompt += f"- Key Lessons: {context['lessons']}\n"
        if context.get('goal'): system_prompt += f"- Main Goal: {context['goal']}\n"
        if context.get('cta'): system_prompt += f"- Call to Action: {context['cta']}\n"

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
async def create_linkedin_post_async(content: str, context: Optional[Dict] = None) -> str:

    system_prompt = """
You are a LinkedIn content strategist.

Write ONE high-performing LinkedIn post using this structure:

1. Hook (1 short scroll-stopping line)
2. Context (what happened + when/where)
3. Key highlights (2–4 bullet points)
4. Personal role/contribution
5. Skills or lessons learned
6. Gratitude/shoutouts (optional)
7. Closing reflection (bigger takeaway)
8. Engagement question (end with a question)
9. 3–5 relevant hashtags

Formatting Rules:
- Use short paragraphs with double line breaks
- Use only 2–3 emojis total
- Keep it under 180 words
- Must naturally include all provided context story points

Return ONLY the post text.
If any context field is missing, skip it gracefully.
Do NOT invent fake details.
"""



    if context:
        system_prompt += f"\n\nPersonalization Context:\n"
        if context.get('audience'): system_prompt += f"- Audience: {context['audience']}\n"
        if context.get('tone'): system_prompt += f"- Tone: {context['tone']}\n"
        if context.get('mood'): system_prompt += f"- Mood: {context['mood']}\n"
        
        # Deep storytelling for LinkedIn
        story_pts = []
        if context.get('event'): story_pts.append(f"Event: {context['event']}")
        if context.get('importance'): story_pts.append(f"Importance: {context['importance']}")
        if context.get('highlights'): story_pts.append(f"Highlights: {context['highlights']}")
        if context.get('role'): story_pts.append(f"My Role: {context['role']}")
        if context.get('lessons'): story_pts.append(f"Lessons: {context['lessons']}")
        if context.get('shoutouts'): story_pts.append(f"Shoutouts/Takeaways: {context['shoutouts']}")
        if context.get('goal'): story_pts.append(f"Main Goal: {context['goal']}")
        if context.get('cta'): story_pts.append(f"Call to Action: {context['cta']}")
        
        if story_pts:
            system_prompt += "\nSpecific Story Points to incorporate:\n" + "\n".join(f"- {p}" for p in story_pts)

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
async def create_instagram_carousel_async(content: str, context: Optional[Dict] = None) -> List[str]:

    system_prompt = """
You are an Instagram carousel content strategist.

Create EXACTLY 8 slides for an Instagram carousel.

Carousel Story Structure:
Slide 1: Hook (big bold attention grabber)
Slide 2: Problem or pain point
Slide 3: Why it matters personally/professionally
Slide 4: The achievement or solution
Slide 5: Key highlight #1
Slide 6: Key highlight #2
Slide 7: Lesson or takeaway
Slide 8: Call-to-action + engagement prompt

Formatting Rules:
- Each slide MUST have EXACTLY 2 lines:
  Line 1: Emoji + TITLE (uppercase, max 3 words)
  Line 2: Short description (max 6 words)

Strict Output Rules:
- No extra lines
- No numbering
- No hashtags
- Slides must be separated by ONE blank line
- Return ONLY the slides, nothing else

If any context field is missing, skip it gracefully.
Do NOT invent fake details.
"""

    if context:
        system_prompt += f"\n\nPersonalization Context:\n"
        if context.get('audience'): system_prompt += f"- Audience: {context['audience']}\n"
        if context.get('tone'): system_prompt += f"- Tone: {context['tone']}\n"
        if context.get('mood'): system_prompt += f"- Mood: {context['mood']}\n"
        if context.get('instaVibe'): system_prompt += f"- Visual Aesthetic: {context['instaVibe']}\n"
        
        # Add highlight for slides
        if context.get('highlights'): system_prompt += f"- Key wins to feature on slides: {context['highlights']}\n"
        if context.get('goal'): system_prompt += f"- Content Goal: {context['goal']}\n"

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
        
        twitter_task = create_twitter_thread_async(content, request.context)
        linkedin_task = create_linkedin_post_async(content, request.context)
        instagram_task = create_instagram_carousel_async(content, request.context)
        
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
                context=json.dumps(request.context) if request.context else None,
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
