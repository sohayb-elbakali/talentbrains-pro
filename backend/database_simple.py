from supabase import create_client
from typing import List, Optional
from models import TalentProfile, JobPosting

def get_supabase_client():
    """Get Supabase client - call this when needed"""
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")
    
    return create_client(supabase_url, supabase_key)

async def get_talent_by_id(talent_id: str) -> Optional[TalentProfile]:
    """Get talent profile by ID"""
    client = get_supabase_client()
    
    try:
        response = client.table("talents").select(
            "id, profile_id, title, location, years_of_experience, experience_level, "
            "remote_preference, hourly_rate_min, hourly_rate_max, "
            "profile:profiles(full_name), "
            "talent_skills(skill:skills(name))"
        ).eq("id", talent_id).execute()
        
        if not response.data or len(response.data) == 0:
            return None
        
        data = response.data[0]
        
        skills = [ts["skill"]["name"] for ts in data.get("talent_skills", [])]
        return TalentProfile(
            id=str(data["id"]),
            full_name=data["profile"]["full_name"],
            title=data["title"],
            location=data.get("location", ""),
            skills=skills,
            years_of_experience=data.get("years_of_experience", 0),
            experience_level=data.get("experience_level", "mid"),
            remote_preference=data.get("remote_preference", False),
            hourly_rate_min=data.get("hourly_rate_min"),
            hourly_rate_max=data.get("hourly_rate_max")
        )
    except Exception as e:
        print(f"Error fetching talent: {e}")
        return None

async def get_all_talents() -> List[TalentProfile]:
    """Get all talent profiles"""
    client = get_supabase_client()
    
    try:
        response = client.table("talents").select(
            "*, "
            "profile:profiles(id, full_name, email, avatar_url, created_at), "
            "talent_skills(skill:skills(id, name, category))"
        ).execute()
        
        talents = []
        for data in response.data:
            skills = [ts["skill"]["name"] for ts in data.get("talent_skills", [])]
            talents.append(TalentProfile(
                id=str(data["id"]),
                full_name=data["profile"]["full_name"],
                title=data["title"],
                location=data.get("location", ""),
                skills=skills,
                years_of_experience=data.get("years_of_experience", 0),
                experience_level=data.get("experience_level", "mid"),
                remote_preference=data.get("remote_preference", False),
                hourly_rate_min=data.get("hourly_rate_min"),
                hourly_rate_max=data.get("hourly_rate_max")
            ))
        return talents
    except Exception as e:
        print(f"Error fetching talents: {e}")
        return []

async def get_job_by_id(job_id: str) -> Optional[JobPosting]:
    """Get job posting by ID"""
    client = get_supabase_client()
    
    try:
        # Try UUID-based schema first
        response = client.table("jobs").select(
            "id, title, location, experience_level, remote_allowed, salary_min, salary_max, "
            "company_id, companies(name), "
            "job_skills(skill:skills(name), is_required)"
        ).eq("id", job_id).execute()
        
        if not response.data or len(response.data) == 0:
            return None
        
        data = response.data[0]
        
        # Extract company name
        company_name = "Unknown Company"
        if data.get("companies"):
            company_name = data["companies"].get("name", "Unknown Company")
        
        # Extract skills
        required_skills = [
            js["skill"]["name"] for js in data.get("job_skills", [])
            if js.get("is_required", True)
        ]
        preferred_skills = [
            js["skill"]["name"] for js in data.get("job_skills", [])
            if not js.get("is_required", True)
        ]
        
        return JobPosting(
            id=str(data["id"]),
            title=data["title"],
            company=company_name,
            location=data.get("location", ""),
            required_skills=required_skills,
            preferred_skills=preferred_skills,
            min_years_experience=0,  # Not in schema
            max_years_experience=None,
            experience_level=data.get("experience_level", "mid"),
            remote_allowed=data.get("remote_allowed", False),
            salary_min=data.get("salary_min"),
            salary_max=data.get("salary_max")
        )
    except Exception as e:
        print(f"Error fetching job: {e}")
        return None

async def get_all_jobs() -> List[JobPosting]:
    """Get all job postings"""
    client = get_supabase_client()
    
    try:
        response = client.table("jobs").select(
            "id, title, location, experience_level, remote_allowed, salary_min, salary_max, "
            "company_id, companies(name), "
            "job_skills(skill:skills(name), is_required)"
        ).execute()
        
        jobs = []
        for data in response.data:
            # Extract company name
            company_name = "Unknown Company"
            if data.get("companies"):
                company_name = data["companies"].get("name", "Unknown Company")
            
            # Extract skills
            required_skills = [
                js["skill"]["name"] for js in data.get("job_skills", [])
                if js.get("is_required", True)
            ]
            preferred_skills = [
                js["skill"]["name"] for js in data.get("job_skills", [])
                if not js.get("is_required", True)
            ]
            
            jobs.append(JobPosting(
                id=str(data["id"]),
                title=data["title"],
                company=company_name,
                location=data.get("location", ""),
                required_skills=required_skills,
                preferred_skills=preferred_skills,
                min_years_experience=0,
                max_years_experience=None,
                experience_level=data.get("experience_level", "mid"),
                remote_allowed=data.get("remote_allowed", False),
                salary_min=data.get("salary_min"),
                salary_max=data.get("salary_max")
            ))
        return jobs
    except Exception as e:
        print(f"Error fetching jobs: {e}")
        return []
