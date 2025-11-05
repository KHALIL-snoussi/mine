"""
Template model
"""

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Template info
    title = Column(String, default="Untitled")
    description = Column(String)

    # Generation settings
    palette_name = Column(String, default="classic_18")
    num_colors = Column(Integer, default=18)
    model = Column(String, default="classic")  # Processing model used
    paper_format = Column(String, default="a4")  # Paper format (a4, a3, etc.)
    difficulty_level = Column(String)  # easy, medium, hard, expert
    difficulty_score = Column(Float)
    quality_score = Column(Float)
    estimated_time = Column(String)

    # File paths (S3 or local)
    original_image_url = Column(String)
    template_url = Column(String)
    legend_url = Column(String)
    solution_url = Column(String)
    guide_url = Column(String)
    comparison_url = Column(String)
    svg_template_url = Column(String)
    svg_legend_url = Column(String)
    pdf_url = Column(String)

    # Analysis data
    difficulty_analysis = Column(JSON)
    quality_analysis = Column(JSON)
    color_mixing_guide = Column(JSON)

    # Status
    is_public = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)
    views = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    downloads = Column(Integer, default=0)
    error_message = Column(String, nullable=True)  # Store error details if generation fails

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="templates")
