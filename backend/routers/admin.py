from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import database_simple as db

router = APIRouter()

class CreateTalentRequest(BaseModel):
    profile_id: str  # Must be an existing profile ID from auth
    title: str
    bio: Optional[str] = None
    location: Optional[str] = None
    remote_preference: bool = True
    experience_level: str = "mid"  # entry, mid, senior, lead
    years_of_experience: int = 0
    hourly_rate_min: Optional[int] = None
    hourly_rate_max: Optional[int] = None
    skills: List[str] = []  # Skill names

@router.post("/create-talent")
async def create_talent(request: CreateTalentRequest):
    """
    Create a talent profile (for testing/admin purposes)
    Note: profile_id must exist in profiles table
    """
    try:
        client = db.get_supabase_client()
        
        # Create talent record
        talent_data = {
            "profile_id": request.profile_id,
            "title": request.title,
            "bio": request.bio,
            "location": request.location,
            "remote_preference": request.remote_preference,
            "experience_level": request.experience_level,
            "years_of_experience": request.years_of_experience,
            "hourly_rate_min": request.hourly_rate_min,
            "hourly_rate_max": request.hourly_rate_max,
        }
        
        talent_response = client.table("talents").insert(talent_data).execute()
        
        if not talent_response.data:
            raise HTTPException(status_code=500, detail="Failed to create talent")
        
        talent_id = talent_response.data[0]["id"]
        
        # Add skills if provided
        if request.skills:
            for skill_name in request.skills:
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
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating talent: {str(e)}")

@router.get("/profiles")
async def list_profiles():
    """
    List all profiles to get profile_ids for creating talents
    """
    try:
        client = db.get_supabase_client()
        response = client.table("profiles").select("id, email, full_name, role").execute()
        
        return {
            "count": len(response.data),
            "profiles": response.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching profiles: {str(e)}")

@router.get("/check-data")
async def check_database_data():
    """
    Check what data exists in the database
    """
    try:
        client = db.get_supabase_client()
        
        # Try different queries to diagnose the issue
        profiles = client.table("profiles").select("id, role").execute()
        
        # Try simple talent query
        talents_simple = client.table("talents").select("id").execute()
        
        # Try with profile join
        talents_with_profile = client.table("talents").select("id, profile:profiles(full_name)").execute()
        
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
                "sample_data": talents_full.data[:1] if talents_full.data else None
            },
            "companies": len(companies.data),
            "jobs": len(jobs.data),
            "skills": len(skills.data),
            "diagnosis": "Check if talents_queries shows different counts - this indicates RLS or join issues"
        }
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }
