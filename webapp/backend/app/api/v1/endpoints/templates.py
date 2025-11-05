"""
Template generation and management endpoints
"""

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import sys
from pathlib import Path
from uuid import uuid4

# Add paint_by_numbers to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent.parent.parent / "paint_by_numbers"))

from app.core.database import get_db, SessionLocal
from app.models.user import User
from app.models.template import Template
from app.schemas.template import (
    TemplateCreate, TemplateResponse, TemplateList,
    GenerationStatus, PaletteInfo, DifficultyPreset
)
from app.core.config import settings
from app.api.deps import get_current_user, get_optional_user

# Import paint by numbers generator
from paint_by_numbers.main import PaintByNumbersGenerator
from paint_by_numbers.palettes import PaletteManager
from paint_by_numbers.models import ModelRegistry
from paint_by_numbers.intelligence.kit_recommender import KitRecommender

router = APIRouter()


# Background task for generation
async def generate_template_background(
    template_id: int,
    input_path: str,
    output_dir: str,
    palette_name: str,
    num_colors: Optional[int],
    model: str,
    paper_format: str,
):
    """Generate template in background"""
    db: Optional[Session] = None
    try:
        # Create generator with model configuration
        generator = PaintByNumbersGenerator()

        # Generate template with selected model and format
        results = generator.generate(
            input_path=input_path,
            output_dir=output_dir,
            n_colors=num_colors,
            use_unified_palette=True,
            palette_name=palette_name,
            model=model,  # Apply model configuration
            paper_format=paper_format  # Apply paper format
        )

        # Update template in database
        db = SessionLocal()
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
        error_session = SessionLocal()
        try:
            template = error_session.query(Template).filter(Template.id == template_id).first()
            if template:
                template.difficulty_level = "error"
                error_session.commit()
        finally:
            error_session.close()
    finally:
        if db:
            db.close()


@router.post("/generate", response_model=TemplateResponse)
async def generate_template(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    palette_name: str = "classic_18",
    num_colors: Optional[int] = None,
    model: str = "classic",
    paper_format: str = "a4",
    title: Optional[str] = "Untitled",
    is_public: bool = False,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Generate a paint-by-numbers template from an uploaded image

    Args:
        file: Image file to convert
        palette_name: Color palette to use
        num_colors: Number of colors (optional, model determines default)
        model: Processing model (classic, simple, detailed, artistic, vibrant, pastel)
        paper_format: Paper format (a4, a3, square_medium, etc.)
        title: Template title
        is_public: Make template visible in gallery
    """
    # Check user limits when authenticated
    if current_user and current_user.role == "free" and current_user.templates_used_this_month >= settings.FREE_TEMPLATES_PER_MONTH:
        raise HTTPException(
            status_code=403,
            detail="Free plan limit reached. Please upgrade to generate more templates.",
        )

    # Save uploaded file
    owner_folder = str(current_user.id) if current_user else "guest"
    upload_dir = Path(settings.UPLOAD_DIR) / owner_folder
    if not current_user:
        upload_dir = upload_dir / uuid4().hex
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create template record
    template = Template(
        user_id=current_user.id if current_user else None,
        title=title,
        palette_name=palette_name,
        num_colors=num_colors or 18,
        model=model,
        paper_format=paper_format,
        is_public=is_public if current_user else True,
        original_image_url=str(file_path)
    )
    db.add(template)
    db.commit()
    db.refresh(template)

    # Update user usage counter
    if current_user:
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
        model,  # Pass model to background task
        paper_format  # Pass paper format to background task
    )

    return template


@router.get("/", response_model=TemplateList)
async def list_templates(
    skip: int = 0,
    limit: int = 20,
    public_only: Optional[bool] = Query(None, alias="public_only"),
    is_public: Optional[bool] = Query(None, alias="is_public"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """List templates"""
    query = db.query(Template)

    public_filter = is_public if is_public is not None else public_only

    if public_filter is True:
        query = query.filter((Template.is_public == True) | (Template.user_id.is_(None)))
    elif current_user:
        if public_filter is False:
            query = query.filter(Template.user_id == current_user.id)
        else:
            query = query.filter(
                (Template.user_id == current_user.id) |
                (Template.user_id.is_(None))
            )
    else:
        query = query.filter(
            (Template.is_public == True) |
            (Template.user_id.is_(None))
        )

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
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Get template by ID"""
    template = db.query(Template).filter(Template.id == template_id).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Check access permissions
    if template.user_id is None:
        pass
    elif template.is_public:
        pass
    elif not current_user or (template.user_id != current_user.id and current_user.role != "admin"):
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


@router.post("/recommend-kit")
async def recommend_kit_for_image(
    file: UploadFile = File(...)
):
    """
    Analyze uploaded image and recommend the best paint kit

    Args:
        file: Image file to analyze

    Returns:
        Kit recommendation with reasoning and all kits ranked
    """
    # Save uploaded file temporarily
    temp_dir = Path(settings.UPLOAD_DIR) / "temp" / uuid4().hex
    temp_dir.mkdir(parents=True, exist_ok=True)

    file_path = temp_dir / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Run kit recommender
        recommender = KitRecommender()
        recommendation = recommender.analyze_image_for_kit(str(file_path))

        # Format response
        result = {
            "recommended_kit": {
                "id": recommendation['recommended_kit'].id,
                "name": recommendation['recommended_kit'].name,
                "display_name": recommendation['recommended_kit'].display_name,
                "description": recommendation['recommended_kit'].description,
                "palette_name": recommendation['recommended_kit'].palette_name,
                "num_colors": recommendation['recommended_kit'].num_colors,
                "price_usd": recommendation['recommended_kit'].price_usd,
                "sku": recommendation['recommended_kit'].sku,
                "target_audience": recommendation['recommended_kit'].target_audience,
                "difficulty_level": recommendation['recommended_kit'].difficulty_level,
                "best_for": recommendation['recommended_kit'].best_for,
                "includes": recommendation['recommended_kit'].includes,
                "estimated_projects": recommendation['recommended_kit'].estimated_projects,
            },
            "confidence": recommendation['confidence'],
            "reasoning": recommendation['reasoning'],
            "all_kits_ranked": [
                {
                    "kit": {
                        "id": kit_data['kit'].id,
                        "name": kit_data['kit'].name,
                        "display_name": kit_data['kit'].display_name,
                        "palette_name": kit_data['kit'].palette_name,
                        "num_colors": kit_data['kit'].num_colors,
                        "price_usd": kit_data['kit'].price_usd,
                        "sku": kit_data['kit'].sku,
                        "target_audience": kit_data['kit'].target_audience,
                        "difficulty_level": kit_data['kit'].difficulty_level,
                    },
                    "score": kit_data['score'],
                    "reasons": kit_data['reasons']
                }
                for kit_data in recommendation['all_kits_ranked']
            ],
            "analysis": {
                "subject_type": recommendation['subject_analysis'].get('type', 'general'),
                "complexity_level": recommendation['complexity_analysis'].get('complexity_level', 'moderate'),
                "is_portrait": recommendation['subject_analysis'].get('is_portrait', False),
                "is_pet": recommendation['subject_analysis'].get('is_pet', False),
                "is_landscape": recommendation['subject_analysis'].get('is_landscape', False),
                "colors_detected": recommendation['color_analysis'].get('n_colors', 0),
                "is_vibrant": recommendation['color_analysis'].get('is_vibrant', False),
                "is_pastel": recommendation['color_analysis'].get('is_pastel', False),
            }
        }

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing image: {str(e)}"
        )
    finally:
        # Cleanup temporary file
        try:
            shutil.rmtree(temp_dir)
        except:
            pass


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


@router.get("/models/list")
async def list_models():
    """
    Get all available processing models

    Returns list of AI models customers can choose from
    """
    return ModelRegistry.get_models_list()


@router.get("/models/{model_id}")
async def get_model_details(model_id: str):
    """
    Get detailed information about a specific model
    """
    model = ModelRegistry.get_model(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model.to_dict()
