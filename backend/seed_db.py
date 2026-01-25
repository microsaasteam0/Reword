from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, CustomTemplate, User
import sys

def seed_db():
    print("🌱 Seeding database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Create a dummy user
    user = db.query(User).filter(User.email == "demo@snippetstream.com").first()
    if not user:
        user = User(
            email="demo@snippetstream.com",
            username="demouser",
            full_name="Demo User",
            is_active=True,
            is_premium=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"👤 Created demo user: {user.email}")
    
    # Check for existing templates
    count = db.query(CustomTemplate).count()
    if count > 0:
        print(f"✅ Found {count} existing templates. Skipping seed.")
        return

    templates = [
        {
            "name": "Viral Thread Starter",
            "description": "Start your Twitter thread with a bang! This template provides high-converting hooks.",
            "category": "social",
            "content": "🧵 [Topic] is changing everything.\n\nBut most people are ignoring it.\n\nHere are 10 things you need to know about [Topic] right now:\n\n1. The visible change...",
            "tags": "twitter, hooks, viral",
            "is_public": True,
            "usage_count": 1205
        },
        {
            "name": "LinkedIn Storytelling",
            "description": "A framework for sharing personal professional stories that resonate.",
            "category": "marketing",
            "content": "I used to think [Misconception].\n\nUntil I realized [Realization].\n\nIt changed how I approach [Topic].\n\nHere's the breakdown:\n\n👇",
            "tags": "linkedin, storytelling, personal-branding",
            "is_public": True,
            "usage_count": 850
        },
        {
            "name": "Product Launch Announcement",
            "description": "Perfect for announcing new features or products to your audience.",
            "category": "marketing",
            "content": "🚀 It's finally here.\n\nIntroducing [Product Name]: The easiest way to [Value Proposition].\n\nWe've been working on this for [Time Period] and we're so excited to share it.\n\nKey features:\n✅ [Feature 1]\n✅ [Feature 2]\n✅ [Feature 3]\n\nTry it now: [Link]",
            "tags": "launch, product, announcement",
            "is_public": True,
            "usage_count": 540
        },
        {
            "name": "Weekly Newsletter Intro",
            "description": "Engaging introduction format for your weekly digest.",
            "category": "newsletter",
            "content": "Hey [Name],\n\nWelcome back to another edition of [Newsletter Name].\n\nThis week, we're diving deep into:\n- [Topic 1]\n- [Topic 2]\n- [Topic 3]\n\nLet's get into it...",
            "tags": "email, newsletter, intro",
            "is_public": True,
            "usage_count": 320
        },
        {
            "name": "Instagram Carousel Text",
            "description": "Structured text perfect for 5-slide educational carousels.",
            "category": "social",
            "content": "SLIDE 1 (Cover): How to master [Skill] in 5 steps\n\nSLIDE 2: Step 1 - The Foundation. Start by [Action].\n\nSLIDE 3: Step 2 - The Build. Then you need to [Action].\n\nSLIDE 4: Step 3 - The Polish. Finally, [Action].\n\nSLIDE 5: Save this for later! 📌",
            "tags": "instagram, carousel, educational",
            "is_public": True,
            "usage_count": 410
        }
    ]

    for t_data in templates:
        template = CustomTemplate(
            user_id=user.id,
            **t_data
        )
        db.add(template)
    
    db.commit()
    print(f"✅ Created {len(templates)} seed templates.")
    db.close()

if __name__ == "__main__":
    seed_db()
