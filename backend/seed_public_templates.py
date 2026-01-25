#!/usr/bin/env python3
"""
Script to seed the database with sample public templates
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
from models import CustomTemplate, User
from sqlalchemy.orm import Session

def seed_public_templates():
    """Add sample public templates to the database"""
    
    # Get database session
    db = next(get_db())
    
    try:
        # Check if we have any users to assign templates to
        admin_user = db.query(User).filter(User.email == "admin@snippetstream.com").first()
        if not admin_user:
            # Create a system user for public templates
            from auth import get_password_hash
            admin_user = User(
                email="admin@snippetstream.com",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                full_name="System Admin",
                is_active=True,
                is_verified=True,
                is_premium=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print("✅ Created admin user for public templates")
        
        # Sample public templates
        sample_templates = [
            {
                "name": "Tech Blog Post Template",
                "description": "Perfect for technology blog posts and tutorials",
                "category": "blog",
                "content": """# [Your Tech Topic Here]

## Introduction
Start with a compelling hook that explains why this topic matters to your audience.

## The Problem
Describe the specific problem or challenge you're addressing.

## The Solution
Walk through your solution step by step:

1. **Step One**: Explain the first step
2. **Step Two**: Detail the second step  
3. **Step Three**: Cover the final step

## Code Example
```javascript
// Your code example here
function example() {
    return "This is a sample";
}
```

## Key Takeaways
- Main point 1
- Main point 2
- Main point 3

## Conclusion
Wrap up with actionable next steps for your readers.""",
                "tags": "tech,blog,tutorial,programming",
                "is_public": True,
                "usage_count": 25
            },
            {
                "name": "Newsletter Template",
                "description": "Engaging newsletter format for regular updates",
                "category": "newsletter",
                "content": """# Weekly Insights Newsletter

## 👋 Hello [Subscriber Name]!

Welcome to this week's edition of [Newsletter Name]. Here's what we're covering:

## 🔥 This Week's Highlights

### 1. [Main Topic]
Brief description of your main story or update.

### 2. [Secondary Topic]  
Another interesting development or insight.

### 3. [Third Topic]
Additional valuable content for your readers.

## 💡 Quick Tips
- **Tip 1**: Actionable advice
- **Tip 2**: Useful insight
- **Tip 3**: Practical suggestion

## 📚 Recommended Reading
- [Article Title](link) - Brief description
- [Resource Name](link) - Why it's valuable

## 🎯 What's Next?
Preview of next week's content or upcoming events.

---
Thanks for reading! Reply with your thoughts or questions.

Best regards,
[Your Name]""",
                "tags": "newsletter,email,marketing,updates",
                "is_public": True,
                "usage_count": 18
            },
            {
                "name": "Product Launch Announcement",
                "description": "Template for announcing new products or features",
                "category": "marketing",
                "content": """# 🚀 Introducing [Product Name]

We're thrilled to announce the launch of [Product Name] - [brief description of what it does].

## What Makes It Special?

### ✨ Key Features
- **Feature 1**: Benefit explanation
- **Feature 2**: How it helps users
- **Feature 3**: Why it matters

### 🎯 Who It's For
This is perfect for [target audience] who want to [main benefit/outcome].

## See It In Action
[Include demo link, screenshots, or video]

## Get Started Today
Ready to try [Product Name]? Here's how:

1. **Sign up** at [link]
2. **Complete setup** in under 5 minutes
3. **Start using** your new [product type]

## Special Launch Offer
For the first 100 users: [special offer details]

## Questions?
Our team is here to help! Reach out at [contact info].

---
Excited to see what you build with [Product Name]!

The [Company Name] Team""",
                "tags": "marketing,product,launch,announcement",
                "is_public": True,
                "usage_count": 12
            },
            {
                "name": "Social Media Thread Template",
                "description": "Structure for engaging social media threads",
                "category": "social",
                "content": """🧵 THREAD: [Your Main Topic] (1/X)

Let me share [number] insights about [topic] that [benefit/outcome]:

2/ First, let's address the elephant in the room:
[Common misconception or problem]

Most people think [wrong assumption], but here's what actually works...

3/ The key insight:
[Your main point with supporting evidence]

This changes everything because [explanation].

4/ Here's how to apply this:

Step 1: [Actionable advice]
Step 2: [Next step]  
Step 3: [Final step]

5/ Real example:
[Case study or specific example that illustrates your point]

The results? [Specific outcomes]

6/ Common mistakes to avoid:
❌ [Mistake 1]
❌ [Mistake 2]
❌ [Mistake 3]

✅ Do this instead: [Better approach]

7/ Key takeaways:
• [Point 1]
• [Point 2]  
• [Point 3]

8/ What's your experience with [topic]? 

Drop a comment below - I read and reply to every one!

If this was helpful, please retweet the first tweet to share with others 🙏""",
                "tags": "social,twitter,thread,engagement",
                "is_public": True,
                "usage_count": 31
            }
        ]
        
        # Check if templates already exist
        existing_count = db.query(CustomTemplate).filter(CustomTemplate.is_public == True).count()
        if existing_count > 0:
            print(f"📊 Found {existing_count} existing public templates - skipping seeding")
            return
        
        # Add sample templates
        for template_data in sample_templates:
            template = CustomTemplate(
                user_id=admin_user.id,
                name=template_data["name"],
                description=template_data["description"],
                category=template_data["category"],
                content=template_data["content"],
                tags=template_data["tags"],
                is_public=template_data["is_public"],
                usage_count=template_data["usage_count"],
                is_favorite=False
            )
            db.add(template)
        
        db.commit()
        print(f"✅ Added {len(sample_templates)} public templates to the database")
        
        # Verify templates were added
        total_public = db.query(CustomTemplate).filter(CustomTemplate.is_public == True).count()
        print(f"📊 Total public templates in database: {total_public}")
        
    except Exception as e:
        print(f"❌ Error seeding public templates: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_public_templates()