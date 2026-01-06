"""
Job Repository

Database access layer for job-related operations.
"""
from typing import List, Optional

from app.repositories.base import BaseRepository
from app.models.job import JobPosting


class JobRepository(BaseRepository[JobPosting]):
    """Repository for job database operations."""
    
    @property
    def table_name(self) -> str:
        return "jobs"
    
    async def get_by_id(self, job_id: str) -> Optional[JobPosting]:
        """
        Get job posting by ID.
        
        Args:
            job_id: The job's unique identifier
            
        Returns:
            JobPosting if found, None otherwise
        """
        try:
            response = self.client.table("jobs").select(
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
                min_years_experience=0,
                max_years_experience=None,
                experience_level=data.get("experience_level", "mid"),
                remote_allowed=data.get("remote_allowed", False),
                salary_min=data.get("salary_min"),
                salary_max=data.get("salary_max")
            )
        except Exception as e:
            print(f"Error fetching job: {e}")
            return None
    
    async def get_all(self) -> List[JobPosting]:
        """
        Get all job postings.
        
        Returns:
            List of JobPosting objects
        """
        try:
            response = self.client.table("jobs").select(
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
    
    async def get_by_company_id(self, company_id: str) -> List[JobPosting]:
        """
        Get all job postings for a specific company.
        
        Args:
            company_id: The company's unique identifier
            
        Returns:
            List of JobPosting objects for the company
        """
        try:
            response = self.client.table("jobs").select(
                "id, title, location, experience_level, remote_allowed, salary_min, salary_max, "
                "company_id, companies(name), "
                "job_skills(skill:skills(name), is_required)"
            ).eq("company_id", company_id).execute()
            
            jobs = []
            for data in response.data:
                company_name = "Unknown Company"
                if data.get("companies"):
                    company_name = data["companies"].get("name", "Unknown Company")
                
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
            print(f"Error fetching jobs by company: {e}")
            return []


# Singleton instance for convenience
job_repository = JobRepository()
