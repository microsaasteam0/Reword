"""
Export Routes - Premium Feature Only
Handles content export functionality with proper feature gating
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime
import json
import csv
import io

from database import get_db
from auth import get_current_active_user
from models import User, SavedContent, ContentGeneration
from feature_gates import get_feature_gate

export_router = APIRouter(prefix="/api/v1/export", tags=["Export"])

class ExportRequest(BaseModel):
    content_ids: List[int]
    format: Literal["txt", "json", "csv"]
    include_metadata: bool = True

class ExportHistoryRequest(BaseModel):
    generation_ids: List[int]
    format: Literal["txt", "json", "csv"]
    include_metadata: bool = True

@export_router.post("/saved-content")
async def export_saved_content(
    request: ExportRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export saved content - Premium feature only"""
    
    # Check if user can export content
    feature_gate = get_feature_gate(current_user)
    if not feature_gate.can_export_content(request.format):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "export_restricted",
                "message": f"Export to {request.format.upper()} format is only available for Pro users",
                "upgrade_required": True,
                "feature": "content_export",
                "available_formats": feature_gate.get_export_formats()
            }
        )
    
    # Get the requested content
    content_items = db.query(SavedContent).filter(
        SavedContent.id.in_(request.content_ids),
        SavedContent.user_id == current_user.id
    ).all()
    
    if not content_items:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No content found with the provided IDs"
        )
    
    # Generate export data
    export_data = []
    for item in content_items:
        data = {
            "id": item.id,
            "title": item.title,
            "content_type": item.content_type,
            "content": item.content,
            "tags": item.tags,
            "is_favorite": item.is_favorite,
        }
        
        if request.include_metadata:
            data.update({
                "created_at": item.created_at.isoformat(),
                "updated_at": item.updated_at.isoformat() if item.updated_at else None,
                "user_id": item.user_id
            })
        
        export_data.append(data)
    
    # Generate file content based on format
    if request.format == "json":
        content = json.dumps(export_data, indent=2, ensure_ascii=False)
        media_type = "application/json"
        filename = f"snippetstream_content_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
    elif request.format == "csv":
        output = io.StringIO()
        if export_data:
            fieldnames = export_data[0].keys()
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(export_data)
        content = output.getvalue()
        media_type = "text/csv"
        filename = f"snippetstream_content_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
    elif request.format == "txt":
        content_lines = []
        for item in export_data:
            content_lines.append(f"Title: {item['title']}")
            content_lines.append(f"Type: {item['content_type']}")
            content_lines.append(f"Content: {item['content']}")
            if item.get('tags'):
                content_lines.append(f"Tags: {item['tags']}")
            if request.include_metadata:
                content_lines.append(f"Created: {item['created_at']}")
            content_lines.append("-" * 50)
            content_lines.append("")
        
        content = "\n".join(content_lines)
        media_type = "text/plain"
        filename = f"snippetstream_content_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    
    # Return file response
    return Response(
        content=content.encode('utf-8'),
        media_type=media_type,
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": f"{media_type}; charset=utf-8"
        }
    )

@export_router.post("/generation-history")
async def export_generation_history(
    request: ExportHistoryRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export content generation history - Premium feature only"""
    
    # Check if user can export content
    feature_gate = get_feature_gate(current_user)
    if not feature_gate.can_export_content(request.format):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "export_restricted",
                "message": f"Export to {request.format.upper()} format is only available for Pro users",
                "upgrade_required": True,
                "feature": "content_export",
                "available_formats": feature_gate.get_export_formats()
            }
        )
    
    # Get the requested generations
    generations = db.query(ContentGeneration).filter(
        ContentGeneration.id.in_(request.generation_ids),
        ContentGeneration.user_id == current_user.id
    ).all()
    
    if not generations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No content generations found with the provided IDs"
        )
    
    # Generate export data
    export_data = []
    for gen in generations:
        data = {
            "id": gen.id,
            "original_content": gen.original_content,
            "content_source": gen.content_source,
            "twitter_thread": gen.twitter_thread,
            "linkedin_post": gen.linkedin_post,
            "instagram_carousel": gen.instagram_carousel,
            "processing_time": gen.processing_time,
        }
        
        if request.include_metadata:
            data.update({
                "created_at": gen.created_at.isoformat(),
                "user_id": gen.user_id
            })
        
        export_data.append(data)
    
    # Generate file content based on format
    if request.format == "json":
        content = json.dumps(export_data, indent=2, ensure_ascii=False)
        media_type = "application/json"
        filename = f"snippetstream_history_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
    elif request.format == "csv":
        output = io.StringIO()
        if export_data:
            fieldnames = export_data[0].keys()
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(export_data)
        content = output.getvalue()
        media_type = "text/csv"
        filename = f"snippetstream_history_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
    elif request.format == "txt":
        content_lines = []
        for item in export_data:
            content_lines.append(f"Generation ID: {item['id']}")
            content_lines.append(f"Original Content: {item['original_content'][:200]}...")
            content_lines.append(f"Source: {item['content_source'] or 'Direct input'}")
            
            if item['twitter_thread']:
                content_lines.append(f"\nTwitter Thread:\n{item['twitter_thread']}")
            if item['linkedin_post']:
                content_lines.append(f"\nLinkedIn Post:\n{item['linkedin_post']}")
            if item['instagram_carousel']:
                content_lines.append(f"\nInstagram Carousel:\n{item['instagram_carousel']}")
            
            if request.include_metadata:
                content_lines.append(f"\nCreated: {item['created_at']}")
                content_lines.append(f"Processing Time: {item['processing_time']}s")
            
            content_lines.append("=" * 80)
            content_lines.append("")
        
        content = "\n".join(content_lines)
        media_type = "text/plain"
        filename = f"snippetstream_history_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    
    # Return file response
    return Response(
        content=content.encode('utf-8'),
        media_type=media_type,
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": f"{media_type}; charset=utf-8"
        }
    )

@export_router.get("/formats")
async def get_available_export_formats(
    current_user: User = Depends(get_current_active_user)
):
    """Get available export formats for the current user"""
    
    feature_gate = get_feature_gate(current_user)
    
    return {
        "available_formats": feature_gate.get_export_formats(),
        "is_premium": current_user.is_premium,
        "restrictions": {
            "free_users": ["clipboard"],
            "pro_users": ["clipboard", "txt", "json", "csv"]
        },
        "upgrade_message": "Upgrade to Pro to unlock TXT, JSON, and CSV export formats"
    }

@export_router.post("/single-content/{content_id}")
async def export_single_content(
    content_id: int,
    format: Literal["txt", "json", "csv"],
    include_metadata: bool = True,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export a single piece of saved content - Premium feature only"""
    
    # Check if user can export content
    feature_gate = get_feature_gate(current_user)
    if not feature_gate.can_export_content(format):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "export_restricted",
                "message": f"Export to {format.upper()} format is only available for Pro users",
                "upgrade_required": True,
                "feature": "content_export"
            }
        )
    
    # Use the existing export endpoint with a single content ID
    request = ExportRequest(
        content_ids=[content_id],
        format=format,
        include_metadata=include_metadata
    )
    
    return await export_saved_content(request, current_user, db)