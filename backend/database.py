from supabase import create_client, Client
from config import settings
from typing import List, Optional
from models import TalentProfile, JobPosting, ExperienceLevel

class Database:
    _instance = None
    _client = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
        return cls._instance
    
    @property
    def client(self) -> Client:
        if self._client is None:
            self._client = create_client(settings.supabase_url, settings.supabase_key)
        return self._client
    
    async def get_talent_by_id(self, talent_id: str) -> Optional[TalentProfile]:
        """Get talent profile by ID"""
        response = self.client.table("talents").select(
            "id, profile_id, title, location, years_of_experience, experience_level, "
            "remote_preference, hourly_rate_min, hourly_rate_max, "
            "profile:profiles(full_name), "
            "talent_skills(skill:skills(name))"
        ).eq("id", talent_id).single().execute()
        
        if response.data:
            data = response.data
            skills = [ts["skill"]["name"] for ts in data.get("talent_skills", [])]
            return TalentProfile(
                id=data["id"],
                full_name=data["profile"]["full_name"],
                title=data["title"],
                location=data.get("location", ""),
                skills=skills,
                years_of_experience=data["years_of_experience"],
                experience_level=data["experience_level"],
                remote_preference=data.get("remote_preference", False),
                hourly_rate_min=data.get("hourly_rate_min"),
                hourly_rate_max=data.get("hourly_rate_max")
            )
        return None
    
    async def get_all_talents(self) -> List[TalentProfile]:
        """Get all talent profiles"""
        response = self.client.table("talents").select(
            "id, profile_id, title, location, years_of_experience, experience_level, "
            "remote_preference, hourly_rate_min, hourly_rate_max, "
            "profile:profiles(full_name), "
            "talent_skills(skill:skills(name))"
        ).execute()
        
        talents = []
        for data in response.data:
            skills = [ts["skill"]["name"] for ts in data.get("talent_skills", [])]
            talents.append(TalentProfile(
                id=data["id"],
                full_name=data["profile"]["full_name"],
                title=data["title"],
                location=data.get("location", ""),
                skills=skills,
                years_of_experience=data["years_of_experience"],
                experience_level=data["experience_level"],
                remote_preference=data.get("remote_preference", False),
                hourly_rate_min=data.get("hourly_rate_min"),
                hourly_rate_max=data.get("hourly_rate_max")
            ))
        return talents
    
    async def get_job_by_id(self, job_id: str) -> Optional[JobPosting]:
        """Get job posting by ID"""
        response = self.client.table("jobs").select(
            "id, title, company, location, min_years_experience, max_years_experience, "
            "experience_level, remote_allowed, salary_min, salary_max, "
            "job_skills(skill:skills(name), demand_level)"
        ).eq("id", job_id).single().execute()
        
        if response.data:
            data = response.data
            required_skills = [
                js["skill"]["name"] for js in data.get("job_skills", [])
                if js.get("demand_level") == "required"
            ]
            preferred_skills = [
                js["skill"]["name"] for js in data.get("job_skills", [])
                if js.get("demand_level") in ["preferred", "nice_to_have"]
            ]
            
            return JobPosting(
                id=data["id"],
                title=data["title"],
                company=data["company"],
                location=data.get("location", ""),
                required_skills=required_skills,
                preferred_skills=preferred_skills,
                min_years_experience=data.get("min_years_experience", 0),
                max_years_experience=data.get("max_years_experience"),
                experience_level=data.get("experience_level", "mid"),
                remote_allowed=data.get("remote_allowed", False),
                salary_min=data.get("salary_min"),
                salary_max=data.get("salary_max")
            )
        return None
    
    async def get_all_jobs(self) -> List[JobPosting]:
        """Get all job postings"""
        response = self.client.table("jobs").select(
            "id, title, company, location, min_years_experience, max_years_experience, "
            "experience_level, remote_allowed, salary_min, salary_max, "
            "job_skills(skill:skills(name), demand_level)"
        ).execute()
        
        jobs = []
        for data in response.data:
            required_skills = [
                js["skill"]["name"] for js in data.get("job_skills", [])
                if js.get("demand_level") == "required"
            ]
            preferred_skills = [
                js["skill"]["name"] for js in data.get("job_skills", [])
                if js.get("demand_level") in ["preferred", "nice_to_have"]
            ]
            
            jobs.append(JobPosting(
                id=data["id"],
                title=data["title"],
                company=data["company"],
                location=data.get("location", ""),
                required_skills=required_skills,
                preferred_skills=preferred_skills,
                min_years_experience=data.get("min_years_experience", 0),
                max_years_experience=data.get("max_years_experience"),
                experience_level=data.get("experience_level", "mid"),
                remote_allowed=data.get("remote_allowed", False),
                salary_min=data.get("salary_min"),
                salary_max=data.get("salary_max")
            ))
        return jobs

def get_db():
    return Database()

db = get_db()
