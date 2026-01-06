"""
Job Models

Pydantic models for job-related data.
"""
from pydantic import BaseModel, Field
from typing import List, Optional

from app.models.base import ExperienceLevel, BaseSchema


class JobBase(BaseSchema):
    """Base job schema with common fields."""
    title: str
    location: Optional[str] = None
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    min_years_experience: int = 0
    max_years_experience: Optional[int] = None
    experience_level: ExperienceLevel = ExperienceLevel.mid
    remote_allowed: bool = False
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None


class JobCreate(JobBase):
    """Schema for creating a new job."""
    company_id: str
    description: Optional[str] = None


class JobUpdate(BaseModel):
    """Schema for updating a job (all fields optional)."""
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    min_years_experience: Optional[int] = None
    max_years_experience: Optional[int] = None
    experience_level: Optional[ExperienceLevel] = None
    remote_allowed: Optional[bool] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None


class JobPosting(JobBase):
    """Full job posting response schema."""
    id: str
    company: str
    location: str = ""


class JobListItem(BaseSchema):
    """Simplified job for list views."""
    id: str
    title: str
    company: str
    location: str
    required_skills: List[str]
    min_years_experience: int
