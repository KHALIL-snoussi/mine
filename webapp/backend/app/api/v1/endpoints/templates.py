"""
Template generation and management endpoints
"""

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import sys
import logging
from pathlib import Path
from uuid import uuid4

logger = logging.getLogger(__name__)

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


# Helper functions
def convert_file_path_to_url(file_path: Optional[str]) -> Optional[str]:
    """Convert absolute file path to HTTP URL for frontend access"""
    if not file_path:
        return None

    # If it's already a URL, return as is
    if file_path.startswith('http://') or file_path.startswith('https://'):
        return file_path

    # Convert /app/uploads/... to absolute backend URL
    if file_path.startswith('/app/uploads/'):
        relative_path = file_path.replace('/app/uploads/', '/uploads/')
        return f"{settings.BACKEND_URL}{relative_path}"

    # If it's relative to uploads, ensure it starts with backend URL
    if file_path.startswith('/uploads/'):
        return f"{settings.BACKEND_URL}{file_path}"

    # If path contains uploads/ (relative path like "uploads/guest/..."), add leading slash
    if 'uploads/' in file_path:
        # Remove any existing "uploads/" prefix and add it back with leading slash
        path_after_uploads = file_path.split('uploads/', 1)[1]
        return f"{settings.BACKEND_URL}/uploads/{path_after_uploads}"

    # Otherwise add backend URL with /uploads/ prefix
    return f"{settings.BACKEND_URL}/uploads/{file_path.lstrip('/')}"


def prepare_template_response(template: Template) -> dict:
    """Convert template model to response dict with proper URLs"""
    template_dict = {
        'id': template.id,
        'user_id': template.user_id,
        'title': template.title,
        'description': template.description,
        'palette_name': template.palette_name,
        'num_colors': template.num_colors,
        'model': template.model,
        'paper_format': template.paper_format,
        'difficulty_level': template.difficulty_level,
        'difficulty_score': template.difficulty_score,
        'quality_score': template.quality_score,
        'estimated_time': template.estimated_time,
        'is_public': template.is_public,
        'is_featured': template.is_featured,
        'created_at': template.created_at,
        'updated_at': template.updated_at,

        # Convert file paths to HTTP URLs
        'original_image_url': convert_file_path_to_url(template.original_image_url),
        'template_url': convert_file_path_to_url(template.template_url),
        'legend_url': convert_file_path_to_url(template.legend_url),
        'solution_url': convert_file_path_to_url(template.solution_url),
        'guide_url': convert_file_path_to_url(template.guide_url),
        'comparison_url': convert_file_path_to_url(template.comparison_url),
        'svg_template_url': convert_file_path_to_url(template.svg_template_url),
        'svg_legend_url': convert_file_path_to_url(template.svg_legend_url),
        'pdf_url': convert_file_path_to_url(template.pdf_url),

        # Additional fields required by response model
        'difficulty_analysis': template.difficulty_analysis,
        'quality_analysis': template.quality_analysis,
        'color_mixing_guide': template.color_mixing_guide,
        'views': template.views,
        'likes': template.likes,
        'downloads': template.downloads,
    }

    return template_dict


# Background task for generation
async def generate_template_background(
    template_id: int,
    input_path: str,
    output_dir: str,
    palette_name: str,
    num_colors: Optional[int],
    model: str,
    paper_format: str,
    use_region_emphasis: bool = False,
    emphasized_region: Optional[dict] = None,
):
    """Generate template in background with optional region emphasis"""
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
            paper_format=paper_format,  # Apply paper format
            use_region_emphasis=use_region_emphasis,  # Multi-region processing
            emphasized_region=emphasized_region  # User-selected region
        )

        # Update template in database using context manager
        with SessionLocal() as db:
            template = db.query(Template).filter(Template.id == template_id).first()
            if not template:
                logger.error(f"Template {template_id} not found in database")
                return

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
                difficulty_score = generator.difficulty_analysis.get('overall_difficulty')
                template.difficulty_score = float(difficulty_score) if difficulty_score is not None else None
                template.estimated_time = generator.difficulty_analysis.get('time_estimate')

            if hasattr(generator, 'quality_analysis'):
                template.quality_analysis = generator.quality_analysis
                quality_score = generator.quality_analysis.get('overall_quality')
                template.quality_score = float(quality_score) if quality_score is not None else None

            if hasattr(generator, 'color_mixing_guide'):
                template.color_mixing_guide = generator.color_mixing_guide

            template.num_colors = len(generator.palette)
            db.commit()
            logger.info(f"Successfully generated template {template_id}")

    except Exception as e:
        logger.error(f"Error generating template {template_id}: {e}", exc_info=True)
        # Update error status in a separate session
        try:
            with SessionLocal() as error_session:
                template = error_session.query(Template).filter(Template.id == template_id).first()
                if template:
                    template.difficulty_level = "error"
                    template.error_message = str(e)[:500]  # Truncate long error messages
                    error_session.commit()
        except Exception as db_error:
            logger.error(f"Failed to update template error status: {db_error}", exc_info=True)


@router.post("/generate", response_model=TemplateResponse)
async def generate_template(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    palette_name: str = "realistic_natural",
    num_colors: Optional[int] = None,
    model: str = "original",
    paper_format: str = "a4",
    title: Optional[str] = "Untitled",
    is_public: bool = False,
    use_region_emphasis: bool = False,
    region_x: Optional[float] = None,
    region_y: Optional[float] = None,
    region_width: Optional[float] = None,
    region_height: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Generate a paint-by-numbers template from an uploaded image

    New parameters:
        use_region_emphasis: Enable multi-region processing for better quality
        region_x, region_y, region_width, region_height: Emphasized region coordinates (0-1 ratios)

    Args:
        file: Image file to convert
        palette_name: Color palette to use (realistic_natural, vintage_warm, pop_art_bold, full_color_hd_38, etc.)
        num_colors: Number of colors (optional, model determines default)
        model: Processing model (original, vintage, pop_art, portrait, portrait_pro, full_color_hd)
        paper_format: Paper format (a4, a3, square_medium, etc.)
        title: Template title
        is_public: Make template visible in gallery
    """
    # Validate file type
    allowed_content_types = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/bmp"]
    if file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_content_types)}"
        )

    # Validate file extension
    allowed_extensions = [".jpg", ".jpeg", ".png", ".webp", ".bmp"]
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension. Allowed extensions: {', '.join(allowed_extensions)}"
        )

    # Validate num_colors range (38 max for Full Color HD model)
    if num_colors is not None and not (5 <= num_colors <= 38):
        raise HTTPException(
            status_code=400,
            detail="num_colors must be between 5 and 38 (38 for Full Color HD model)"
        )

    # Validate palette exists
    palette_manager = PaletteManager()
    available_palettes = palette_manager.list_palettes()
    if palette_name not in available_palettes:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid palette_name. Available palettes: {', '.join(available_palettes)}"
        )

    # Validate model exists
    available_models = [m['id'] for m in ModelRegistry.get_models_list()]
    if model not in available_models:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model. Available models: {', '.join(available_models)}"
        )

    # INTELLIGENT MODEL SELECTION: Auto-detect portraits and suggest portrait model
    # This prevents the terrible over-segmentation issue seen with portraits using "original" model
    original_model = model  # Store user's choice
    should_use_portrait_model = False

    # Validate paper format (common formats)
    valid_paper_formats = ["a4", "a3", "a5", "letter", "square_small", "square_medium", "square_large"]
    if paper_format not in valid_paper_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid paper_format. Valid formats: {', '.join(valid_paper_formats)}"
        )

    # Validate title length
    if title and len(title) > 200:
        raise HTTPException(
            status_code=400,
            detail="Title must be 200 characters or less"
        )

    # Validate file size (max 50MB)
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB in bytes
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE // (1024 * 1024)}MB"
        )

    if file_size == 0:
        raise HTTPException(
            status_code=400,
            detail="File is empty"
        )

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

    # INTELLIGENT PORTRAIT DETECTION: Auto-select portrait model for face images
    # This prevents over-segmentation issues
    try:
        from paint_by_numbers.intelligence.subject_detector import SubjectDetector
        import cv2

        # Load image and detect faces
        img = cv2.imread(str(file_path))
        if img is not None:
            detector = SubjectDetector()
            subject_region = detector.detect_best_subject(img, expand_faces=True)

            # If we detected a face and user used a non-portrait model, suggest portrait
            if subject_region.subject_type == 'face' and model not in ['portrait', 'portrait_pro']:
                logger.info(f"🎯 PORTRAIT DETECTED! Auto-selecting portrait_pro model (user selected: {model})")
                logger.info(f"   Face region: ({subject_region.x}, {subject_region.y}, {subject_region.width}, {subject_region.height})")
                model = 'portrait_pro'  # Use best portrait model
                should_use_portrait_model = True

                # Also force portrait palette if using generic palette
                if palette_name == 'realistic_natural':
                    palette_name = 'portrait_realistic'
                    logger.info(f"   Also switching to portrait_realistic palette")
    except Exception as e:
        logger.warning(f"Portrait detection failed, using user-selected model: {e}")
        # Continue with user's original choice

    # Build emphasized_region dict if coordinates provided
    emphasized_region = None
    if use_region_emphasis and all(v is not None for v in [region_x, region_y, region_width, region_height]):
        emphasized_region = {
            'x': region_x,
            'y': region_y,
            'width': region_width,
            'height': region_height,
        }
        logger.info(f"Region emphasis enabled: {emphasized_region}")

    background_tasks.add_task(
        generate_template_background,
        template.id,
        str(file_path),
        str(output_dir),
        palette_name,
        num_colors,
        model,  # Pass model (potentially auto-corrected to portrait)
        paper_format,  # Pass paper format to background task
        use_region_emphasis,  # Pass emphasis flag
        emphasized_region  # Pass region coordinates
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
        "templates": [prepare_template_response(t) for t in templates],
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

    return prepare_template_response(template)


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
        except OSError as e:
            logger.warning(f"Failed to cleanup temporary directory {temp_dir}: {e}")


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
    """Get list of style presets (maps to our 4 premium models)"""
    presets = [
        {
            "name": "original",
            "display_name": "Original 40×50 cm",
            "num_colors": 20,
            "min_region_size": 80,
            "description": "Natural photorealistic colors for portraits & photos"
        },
        {
            "name": "vintage",
            "display_name": "Vintage 40×50 cm",
            "num_colors": 18,
            "min_region_size": 95,
            "description": "Warm nostalgic tones with retro aesthetic"
        },
        {
            "name": "pop_art",
            "display_name": "Pop-Art 40×50 cm",
            "num_colors": 16,
            "min_region_size": 110,
            "description": "Bold vibrant colors for statement pieces"
        },
        {
            "name": "full_color_hd",
            "display_name": "Full Color HD 40×50 cm",
            "num_colors": 38,
            "min_region_size": 50,
            "description": "QBRIX-quality maximum realism with 38 colors"
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
