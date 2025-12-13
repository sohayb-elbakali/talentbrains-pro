from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class ExperienceLevel(str, Enum):
    entry = "entry"
    mid = "mid"
    senior = "senior"
    lead = "lead"

class SkillDemandLevel(str, Enum):
    required = "required"
    preferred = "preferred"
    nice_to_have = "nice_to_have"

class TalentProfile(BaseModel):
    id: str
    full_name: str
    title: str
    location: str
    skills: List[str]
    years_of_experience: int
    experience_level: ExperienceLevel
    remote_preference: bool = False
    hourly_rate_min: Optional[float] = None
    hourly_rate_max: Optional[float] = None

class JobPosting(BaseModel):
    id: str
    title: str
    company: str
    location: str
    required_skills: List[str]
    preferred_skills: Optional[List[str]] = []
    min_years_experience: int
    max_years_experience: Optional[int] = None
    experience_level: ExperienceLevel
    remote_allowed: bool = False
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None

class MatchResult(BaseModel):
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

class MatchRequest(BaseModel):
    talent_id: Optional[str] = None
    job_id: Optional[str] = None
    limit: int = Field(default=10, ge=1, le=100)
