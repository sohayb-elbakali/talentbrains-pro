"""
Talent Models

Pydantic models for talent-related data.
"""
from pydantic import BaseModel, Field
from typing import List, Optional

from app.models.base import ExperienceLevel, BaseSchema


class TalentBase(BaseSchema):
    """Base talent schema with common fields."""
    title: str
    location: Optional[str] = None
    skills: List[str] = []
    years_of_experience: int = 0
    experience_level: ExperienceLevel = ExperienceLevel.mid
    remote_preference: bool = False
    hourly_rate_min: Optional[float] = None
    hourly_rate_max: Optional[float] = None


class TalentCreate(TalentBase):
    """Schema for creating a new talent."""
    profile_id: str
    bio: Optional[str] = None


class TalentUpdate(BaseModel):
    """Schema for updating a talent (all fields optional)."""
    title: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[List[str]] = None
    years_of_experience: Optional[int] = None
    experience_level: Optional[ExperienceLevel] = None
    remote_preference: Optional[bool] = None
    hourly_rate_min: Optional[float] = None
    hourly_rate_max: Optional[float] = None


class TalentProfile(TalentBase):
    """Full talent profile response schema."""
    id: str
    full_name: str
    location: str = ""


class TalentListItem(BaseSchema):
    """Simplified talent for list views."""
    id: str
    name: str
    title: str
    location: str
    skills: List[str]
    years_of_experience: int
