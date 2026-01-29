"""
Feature gate system for tiered access control
"""
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from models import User, UsageStats, ContentGeneration


class FeatureGate:
    """Centralized feature access control"""
    
    def __init__(self, user: User):
        self.user = user
    
    def get_tier(self) -> str:
        """Get user's current tier"""
        if not self.user:
            return "unauthenticated"
        if self.user.is_premium:
            return "pro"
        return "free"
    
    def can_generate_content(self, db: Session) -> bool:
        """Check if user can generate content"""
        if not self.user:
            return False
        
        if self.user.is_premium:
            return True
        
        # Free users: 2 generations per 24 hours
        return self.get_remaining_generations(db) > 0
    
    def can_save_content(self) -> bool:
        """Check if user can save content"""
        return self.user and self.user.is_premium
    
    def can_process_urls(self) -> bool:
        """Check if user can process URLs"""
        return self.user and self.user.is_premium
    
    def can_export_content(self, format: str = "txt") -> bool:
        """Check if user can export content in given format"""
        if not self.user:
            return False
        
        # Free users can only copy to clipboard (no file exports)
        if format.lower() == "clipboard":
            return True
        
        # All file formats (txt, json, csv) require premium
        if format.lower() in ["txt", "json", "csv"]:
            return self.user.is_premium
        
        # Unknown format - default to premium required
        return self.user.is_premium
    
    def can_access_analytics(self) -> bool:
        """Check if user can access analytics"""
        return self.user and self.user.is_premium
    
    def can_create_templates(self) -> bool:
        """Check if user can create custom templates"""
        return self.user and self.user.is_premium

    def can_browse_community_templates(self) -> bool:
        """Check if user can browse public templates"""
        return self.user and self.user.is_premium

    def can_bulk_process(self, item_count: int = 1) -> bool:
        """Check if user can process multiple items"""
        if not self.user:
            return False
        
        if not self.user.is_premium:
            return item_count <= 1
        
        # Pro users can process up to 50 items
        return item_count <= 50
    
    def can_use_advanced_templates(self) -> bool:
        """Check if user can use advanced AI templates"""
        # "Advanced AI templates" in pricing refers to custom and community templates
        return self.user and self.user.is_premium
    
    def get_history_limit(self) -> int:
        """Get history item limit based on tier"""
        if not self.user:
            return 0
        if self.user.is_premium:
            return 1000 # Effectively unlimited
        return 5 # "Basic content history"
    
    def get_generation_limit(self) -> int:
        """Get daily generation limit"""
        if not self.user:
            return 2
        if self.user.is_premium:
            return 20  # Market standard for Pro tier
        return 2
    
    def get_remaining_generations(self, db: Session) -> int:
        """Get remaining generations for today (24h sliding window)"""
        if not self.user:
            return 0
        
        limit = self.get_generation_limit()
        
        # Count usage in last 24 hours
        twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)
        recent_usage = db.query(UsageStats).filter(
            UsageStats.user_id == self.user.id,
            UsageStats.action == "generate",
            UsageStats.created_at >= twenty_four_hours_ago
        ).count()
        
        return max(0, limit - recent_usage)
    
    def get_supported_platforms(self) -> List[str]:
        """Get list of supported social platforms"""
        return ["twitter", "linkedin", "instagram"]
    
    def get_export_formats(self) -> List[str]:
        """Get available export formats"""
        if not self.user:
            return ["clipboard"]
        
        if self.user.is_premium:
            return ["clipboard", "txt", "json", "csv"]
        
        # Free users: Copy to clipboard only
        return ["clipboard"]
    
    def get_feature_limits(self, db: Session) -> Dict:
        """Get comprehensive feature limits for user"""
        tier = self.get_tier()
        
        return {
            "tier": tier,
            "can_save_content": self.can_save_content(),
            "can_process_urls": self.can_process_urls(),
            "can_access_analytics": self.can_access_analytics(),
            "can_create_templates": self.can_create_templates(),
            "can_browse_templates": self.can_browse_community_templates(),
            "generation_limit": self.get_generation_limit(),
            "remaining_generations": self.get_remaining_generations(db),
            "history_limit": self.get_history_limit(),
            "supported_platforms": self.get_supported_platforms(),
            "export_formats": self.get_export_formats(),
            "max_bulk_items": 50 if self.user and self.user.is_premium else 1,
            "max_content_length": 50000 if self.user and self.user.is_premium else 10000
        }
    
    def get_upgrade_prompt(self, feature: str) -> Dict:
        """Get upgrade prompt for specific feature"""
        prompts = {
            "save_content": {
                "title": "Save Your Content",
                "message": "Upgrade to Pro to save unlimited content and access your history anytime.",
                "cta": "Upgrade to Pro"
            },
            "url_processing": {
                "title": "Process URLs",
                "message": "Transform content from any URL with Pro. Paste links to articles, blogs, and more.",
                "cta": "Unlock URL Processing"
            },
            "export": {
                "title": "Export Your Content",
                "message": "Export to TXT, JSON, CSV and more formats with Pro. Perfect for backups and sharing.",
                "cta": "Get Export Features"
            },
            "analytics": {
                "title": "Content Analytics",
                "message": "Track performance, engagement metrics, and optimize your content strategy with Pro.",
                "cta": "View Analytics"
            },
            "advanced_templates": {
                "title": "Advanced AI Templates",
                "message": "Access premium AI templates and custom styles to create unique content.",
                "cta": "Unlock Advanced AI"
            },
            "bulk_processing": {
                "title": "Bulk Processing",
                "message": "Process up to 50 items at once and save hours of work with Pro.",
                "cta": "Enable Bulk Processing"
            }
        }
        
        return prompts.get(feature, {
            "title": "Upgrade to Pro",
            "message": "Unlock this feature and many more with Pro.",
            "cta": "Upgrade Now"
        })


def get_feature_gate(user: User) -> FeatureGate:
    """Factory function to create feature gate for user"""
    return FeatureGate(user)