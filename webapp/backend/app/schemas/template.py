"""
Template schemas for API requests/responses
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime


class TemplateCreate(BaseModel):
    title: Optional[str] = "Untitled"
    description: Optional[str] = None
    palette_name: str = "classic_18"
    num_colors: Optional[int] = None
    is_public: bool = False


class TemplateUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None


class TemplateResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    palette_name: str
    num_colors: int
    difficulty_level: Optional[str]
    difficulty_score: Optional[float]
    quality_score: Optional[float]
    estimated_time: Optional[str]

    # URLs
    original_image_url: Optional[str]
    template_url: Optional[str]
    legend_url: Optional[str]
    solution_url: Optional[str]
    guide_url: Optional[str]
    comparison_url: Optional[str]
    svg_template_url: Optional[str]
    svg_legend_url: Optional[str]
    pdf_url: Optional[str]

    # Analysis
    difficulty_analysis: Optional[Dict]
    quality_analysis: Optional[Dict]
    color_mixing_guide: Optional[Dict]

    # Stats
    is_public: bool
    is_featured: bool
    views: int
    likes: int
    downloads: int

    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class TemplateList(BaseModel):
    templates: List[TemplateResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class GenerationStatus(BaseModel):
    status: str  # pending, processing, completed, failed
    progress: int  # 0-100
    message: str
    template_id: Optional[int] = None
    error: Optional[str] = None


class PaletteInfo(BaseModel):
    name: str
    display_name: str
    num_colors: int
    colors: List[List[int]]
    color_names: List[str]
    description: str


class DifficultyPreset(BaseModel):
    name: str
    display_name: str
    num_colors: int
    min_region_size: int
    description: str
