"""
Template generation and management endpoints
"""

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
import sys
from pathlib import Path

# Add paint_by_numbers to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent.parent.parent / "paint_by_numbers"))

from app.core.database import get_db
from app.models.user import User
from app.models.template import Template
from app.schemas.template import (
    TemplateCreate, TemplateResponse, TemplateList,
    GenerationStatus, PaletteInfo, DifficultyPreset
)
from app.core.config import settings
from app.api.deps import get_current_user

# Import paint by numbers generator
from paint_by_numbers.main import PaintByNumbersGenerator
from paint_by_numbers.palettes import PaletteManager
from paint_by_numbers.config import Config

router = APIRouter()


# Background task for generation
async def generate_template_background(
    template_id: int,
    input_path: str,
    output_dir: str,
    palette_name: str,
    num_colors: Optional[int],
    db: Session
):
    """Generate template in background"""
    try:
        # Create generator
        config = Config()
        config.USE_UNIFIED_PALETTE = True
        config.UNIFIED_PALETTE_NAME = palette_name
        config.GENERATE_SVG = True
        config.GENERATE_PDF = True

        generator = PaintByNumbersGenerator(config)

        # Generate template
        results = generator.generate(
            input_path=input_path,
            output_dir=output_dir,
            n_colors=num_colors,
            use_unified_palette=True,
            palette_name=palette_name
        )

        # Update template in database
        template = db.query(Template).filter(Template.id == template_id).first()
        if template:
            template.template_url = results.get('template')
            template.legend_url = results.get('legend')
            template.solution_url = results.get('solution')
            template.guide_url = results.get('guide')
            template.comparison_url = results.get('comparison')
            template.svg_template_url = results.get('svg_template')
            template.svg_legend_url = results.get('svg_legend')
            template.pdf_url = results.get('pdf')

            # Save analysis data
            if hasattr(generator, 'difficulty_analysis'):
                template.difficulty_analysis = generator.difficulty_analysis
                template.difficulty_level = generator.difficulty_analysis.get('difficulty_level')
                template.difficulty_score = generator.difficulty_analysis.get('overall_difficulty')
                template.estimated_time = generator.difficulty_analysis.get('time_estimate')

            if hasattr(generator, 'quality_analysis'):
                template.quality_analysis = generator.quality_analysis
                template.quality_score = generator.quality_analysis.get('overall_quality')

            if hasattr(generator, 'color_mixing_guide'):
                template.color_mixing_guide = generator.color_mixing_guide

            template.num_colors = len(generator.palette)
            db.commit()

    except Exception as e:
        print(f"Error generating template: {e}")
        # Update template with error
        template = db.query(Template).filter(Template.id == template_id).first()
        if template:
            template.difficulty_level = "error"
            db.commit()


@router.post("/generate", response_model=TemplateResponse)
async def generate_template(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    palette_name: str = "classic_18",
    num_colors: Optional[int] = None,
    title: Optional[str] = "Untitled",
    is_public: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a paint-by-numbers template from an uploaded image
    """
    # Check user limits
    if current_user.role == "free" and current_user.templates_used_this_month >= settings.FREE_TEMPLATES_PER_MONTH:
        raise HTTPException(
            status_code=403,
            detail="Free plan limit reached. Please upgrade to generate more templates."
        )

    # Save uploaded file
    upload_dir = Path(settings.UPLOAD_DIR) / str(current_user.id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create template record
    template = Template(
        user_id=current_user.id,
        title=title,
        palette_name=palette_name,
        num_colors=num_colors or 18,
        is_public=is_public,
        original_image_url=str(file_path)
    )
    db.add(template)
    db.commit()
    db.refresh(template)

    # Update user usage
    current_user.templates_used_this_month += 1
    db.commit()

    # Start background generation
    output_dir = upload_dir / f"template_{template.id}"
    output_dir.mkdir(exist_ok=True)

    background_tasks.add_task(
        generate_template_background,
        template.id,
        str(file_path),
        str(output_dir),
        palette_name,
        num_colors,
        db
    )

    return template


@router.get("/", response_model=TemplateList)
async def list_templates(
    skip: int = 0,
    limit: int = 20,
    public_only: bool = False,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """List templates"""
    query = db.query(Template)

    if public_only:
        query = query.filter(Template.is_public == True)
    elif current_user:
        query = query.filter(Template.user_id == current_user.id)

    total = query.count()
    templates = query.order_by(Template.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "templates": templates,
        "total": total,
        "page": skip // limit + 1,
        "per_page": limit,
        "total_pages": (total + limit - 1) // limit
    }


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get template by ID"""
    template = db.query(Template).filter(Template.id == template_id).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Check access
    if not template.is_public and (not current_user or template.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    # Increment views
    template.views += 1
    db.commit()

    return template


@router.delete("/{template_id}")
async def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete template"""
    template = db.query(Template).filter(Template.id == template_id).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    if template.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(template)
    db.commit()

    return {"message": "Template deleted successfully"}


@router.get("/palettes/list", response_model=List[PaletteInfo])
async def list_palettes():
    """Get list of available color palettes"""
    manager = PaletteManager()
    palettes = manager.list_palettes()

    result = []
    for palette_name in palettes:
        info = manager.get_palette_info(palette_name)
        result.append({
            "name": palette_name,
            "display_name": palette_name.replace("_", " ").title(),
            "num_colors": info['num_colors'],
            "colors": info['colors'],
            "color_names": info['color_names'],
            "description": f"{info['num_colors']} color palette"
        })

    return result


@router.get("/presets/list", response_model=List[DifficultyPreset])
async def list_presets():
    """Get list of difficulty presets"""
    presets = [
        {
            "name": "beginner",
            "display_name": "Beginner",
            "num_colors": 12,
            "min_region_size": 200,
            "description": "Large regions, fewer colors, perfect for first-timers"
        },
        {
            "name": "intermediate",
            "display_name": "Intermediate",
            "num_colors": 18,
            "min_region_size": 100,
            "description": "Balanced complexity for regular painters"
        },
        {
            "name": "advanced",
            "display_name": "Advanced",
            "num_colors": 24,
            "min_region_size": 75,
            "description": "More detail for experienced artists"
        },
        {
            "name": "professional",
            "display_name": "Professional",
            "num_colors": 24,
            "min_region_size": 50,
            "description": "Maximum detail and complexity"
        }
    ]
    return presets
