"""
Base Models

Common enums, base classes, and shared model components.
"""
from enum import Enum
from pydantic import BaseModel


class ExperienceLevel(str, Enum):
    """Experience level for talents and jobs."""
    entry = "entry"
    mid = "mid"
    senior = "senior"
    lead = "lead"


class SkillDemandLevel(str, Enum):
    """Skill demand level for job requirements."""
    required = "required"
    preferred = "preferred"
    nice_to_have = "nice_to_have"


class BaseSchema(BaseModel):
    """Base schema with common configuration."""
    
    class Config:
        from_attributes = True  # Allows ORM mode (formerly orm_mode)
        str_strip_whitespace = True
