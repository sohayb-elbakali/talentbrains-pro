"""
Matching Models

Pydantic models for matching-related data and responses.
"""
from pydantic import BaseModel, Field
from typing import List, Optional

from app.models.base import BaseSchema


class MatchRequest(BaseSchema):
    """Request schema for matching operations."""
    talent_id: Optional[str] = None
    job_id: Optional[str] = None
    limit: int = Field(default=10, ge=1, le=100)


class MatchResult(BaseSchema):
    """Result schema for a single match."""
    talent_id: Optional[str] = None
    job_id: Optional[str] = None
    match_score: float = Field(..., ge=0, le=100)
    skill_match_score: float
    experience_match_score: float
    location_match_score: float
    salary_match_score: Optional[float] = None
    matched_skills: List[str]
    missing_skills: List[str]
    reason: str


class MatchingStats(BaseSchema):
    """Statistics for matching system."""
    total_talents: int
    total_jobs: int
    status: str
