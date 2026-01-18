"""
Admin Endpoints

API endpoints for admin operations and testing.
All endpoints require admin authentication.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, constr, validator
from typing import List, Optional
from supabase import Client
import re

from app.api.deps import get_db_client, AdminUser, CurrentUser
from app.core.rate_limit import limiter, RateLimits


router = APIRouter()


# Input validation helpers
def sanitize_string(value: str) -> str:
    """Remove potentially dangerous characters from strings."""
    if not value:
        return value
    # Remove HTML tags and script content
    value = re.sub(r'<[^>]*>', '', value)
    # Remove common injection patterns
    value = re.sub(r'[<>"\';]', '', value)
    return value.strip()


class CreateTalentRequest(BaseModel):
    """Request schema for creating a talent profile with validation."""
    profile_id: str  # Must be an existing profile ID from auth
    title: constr(min_length=2, max_length=100)
    bio: Optional[constr(max_length=2000)] = None
    location: Optional[constr(max_length=100)] = None
    remote_preference: bool = True
    experience_level: str = "mid"  # entry, mid, senior, lead
    years_of_experience: int = 0
    hourly_rate_min: Optional[int] = None
    hourly_rate_max: Optional[int] = None
    skills: List[constr(min_length=1, max_length=50)] = []  # Skill names

    @validator('title', 'bio', 'location', pre=True, always=True)
    def sanitize_fields(cls, v):
        if isinstance(v, str):
            return sanitize_string(v)
        return v
    
    @validator('experience_level')
    def validate_experience_level(cls, v):
        allowed = ['entry', 'junior', 'mid', 'senior', 'lead', 'executive']
        if v not in allowed:
            raise ValueError(f'experience_level must be one of: {", ".join(allowed)}')
        return v
    
    @validator('years_of_experience')
    def validate_years(cls, v):
        if v < 0 or v > 50:
            raise ValueError('years_of_experience must be between 0 and 50')
        return v
    
    @validator('skills', each_item=True)
    def sanitize_skills(cls, v):
        return sanitize_string(v)


@router.post("/create-talent")
@limiter.limit(RateLimits.ADMIN)
async def create_talent(
    request: Request,
    data: CreateTalentRequest,
    current_user: AdminUser,  # Requires admin authentication
    client: Client = Depends(get_db_client)
):
    """
    Create a talent profile (admin only).
    
    Requires admin authentication.
    Note: profile_id must exist in profiles table.
    """
    try:
        # Create talent record
        talent_data = {
            "profile_id": data.profile_id,
            "title": data.title,
            "bio": data.bio,
            "location": data.location,
            "remote_preference": data.remote_preference,
            "experience_level": data.experience_level,
            "years_of_experience": data.years_of_experience,
            "hourly_rate_min": data.hourly_rate_min,
            "hourly_rate_max": data.hourly_rate_max,
        }
        
        talent_response = client.table("talents").insert(talent_data).execute()
        
        if not talent_response.data:
            raise HTTPException(
                status_code=500, 
                detail="Failed to create talent"
            )
        
        talent_id = talent_response.data[0]["id"]
        
        # Add skills if provided
        if data.skills:
            for skill_name in data.skills:
                # Find or create skill
                skill_response = client.table("skills").select("id").eq("name", skill_name).execute()
                
                if skill_response.data:
                    skill_id = skill_response.data[0]["id"]
                else:
                    # Create skill if it doesn't exist
                    new_skill = client.table("skills").insert({
                        "name": skill_name,
                        "category": "General"
                    }).execute()
                    skill_id = new_skill.data[0]["id"]
                
                # Link skill to talent
                client.table("talent_skills").insert({
                    "talent_id": talent_id,
                    "skill_id": skill_id,
                    "proficiency_level": 3
                }).execute()
        
        return {
            "success": True,
            "talent_id": talent_id,
            "message": "Talent profile created successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail="Failed to create talent profile"
        )


@router.get("/profiles")
@limiter.limit(RateLimits.ADMIN)
async def list_profiles(
    request: Request,
    current_user: AdminUser,  # Requires admin authentication
    client: Client = Depends(get_db_client)
):
    """
    List all profiles to get profile_ids for creating talents.
    Requires admin authentication.
    """
    try:
        response = client.table("profiles").select("id, email, full_name, role").execute()
        
        return {
            "count": len(response.data),
            "profiles": response.data
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail="Failed to fetch profiles"
        )


@router.get("/check-data")
@limiter.limit(RateLimits.ADMIN)
async def check_database_data(
    request: Request,
    current_user: AdminUser,  # Requires admin authentication
    client: Client = Depends(get_db_client)
):
    """
    Check what data exists in the database.
    Requires admin authentication.
    """
    try:
        # Try different queries to diagnose the issue
        profiles = client.table("profiles").select("id, role").execute()
        
        # Try simple talent query
        talents_simple = client.table("talents").select("id").execute()
        
        # Try with profile join
        talents_with_profile = client.table("talents").select(
            "id, profile:profiles(full_name)"
        ).execute()
        
        # Try full query like frontend
        talents_full = client.table("talents").select(
            "*, profile:profiles(id, full_name), talent_skills(skill:skills(name))"
        ).execute()
        
        companies = client.table("companies").select("id").execute()
        jobs = client.table("jobs").select("id").execute()
        skills = client.table("skills").select("id").execute()
        
        return {
            "profiles": {
                "total": len(profiles.data),
                "by_role": {
                    "talent": len([p for p in profiles.data if p.get("role") == "talent"]),
                    "company": len([p for p in profiles.data if p.get("role") == "company"]),
                    "admin": len([p for p in profiles.data if p.get("role") == "admin"])
                }
            },
            "talents_queries": {
                "simple_select": len(talents_simple.data),
                "with_profile_join": len(talents_with_profile.data),
                "full_query": len(talents_full.data),
            },
            "companies": len(companies.data),
            "jobs": len(jobs.data),
            "skills": len(skills.data),
        }
    except Exception as e:
        # Don't expose internal error details
        raise HTTPException(
            status_code=500,
            detail="Failed to check database data"
        )


@router.get("/health")
@limiter.limit(RateLimits.PUBLIC)
async def admin_health(request: Request):
    """
    Admin health check endpoint (public).
    """
    return {
        "status": "healthy",
        "service": "admin"
    }
