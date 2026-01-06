"""
Talent Repository

Database access layer for talent-related operations.
"""
from typing import List, Optional

from app.repositories.base import BaseRepository
from app.models.talent import TalentProfile


class TalentRepository(BaseRepository[TalentProfile]):
    """Repository for talent database operations."""
    
    @property
    def table_name(self) -> str:
        return "talents"
    
    async def get_by_id(self, talent_id: str) -> Optional[TalentProfile]:
        """
        Get talent profile by ID.
        
        Args:
            talent_id: The talent's unique identifier
            
        Returns:
            TalentProfile if found, None otherwise
        """
        try:
            response = self.client.table("talents").select(
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
    
    async def get_all(self) -> List[TalentProfile]:
        """
        Get all talent profiles.
        
        Returns:
            List of TalentProfile objects
        """
        try:
            response = self.client.table("talents").select(
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
    
    async def get_by_profile_id(self, profile_id: str) -> Optional[TalentProfile]:
        """
        Get talent profile by user's profile ID.
        
        Args:
            profile_id: The user's profile ID
            
        Returns:
            TalentProfile if found, None otherwise
        """
        try:
            response = self.client.table("talents").select(
                "id, profile_id, title, location, years_of_experience, experience_level, "
                "remote_preference, hourly_rate_min, hourly_rate_max, "
                "profile:profiles(full_name), "
                "talent_skills(skill:skills(name))"
            ).eq("profile_id", profile_id).execute()
            
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
            print(f"Error fetching talent by profile_id: {e}")
            return None


# Singleton instance for convenience
talent_repository = TalentRepository()
