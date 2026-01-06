"""
Matching Service

Business logic for talent-job matching operations.
"""
from typing import List, Tuple

from app.models.talent import TalentProfile
from app.models.job import JobPosting
from app.models.matching import MatchResult
from app.models.base import ExperienceLevel


class MatchingService:
    """
    Service for matching talents with jobs.
    
    Implements matching algorithms based on:
    - Skills (required and preferred)
    - Experience level and years
    - Location compatibility
    - Salary/rate expectations
    """
    
    EXPERIENCE_LEVELS = {
        "entry": 1,
        "mid": 2,
        "senior": 3,
        "lead": 4
    }
    
    WEIGHTS = {
        "skills": 0.40,
        "experience": 0.30,
        "location": 0.20,
        "salary": 0.10
    }
    
    def calculate_skill_match(
        self, 
        talent_skills: List[str], 
        required_skills: List[str], 
        preferred_skills: List[str]
    ) -> Tuple[float, List[str], List[str]]:
        """
        Calculate skill match score (0-100).
        
        Args:
            talent_skills: List of talent's skills
            required_skills: List of required skills for the job
            preferred_skills: List of preferred skills for the job
            
        Returns:
            Tuple of (score, matched_skills, missing_skills)
        """
        talent_skills_lower = [s.lower() for s in talent_skills]
        
        # Match required skills (70% weight)
        matched_required = [s for s in required_skills if s.lower() in talent_skills_lower]
        missing_required = [s for s in required_skills if s.lower() not in talent_skills_lower]
        
        if required_skills:
            required_score = (len(matched_required) / len(required_skills)) * 70
        else:
            required_score = 70  # No required skills means full score
        
        # Match preferred skills (30% weight)
        matched_preferred = [s for s in preferred_skills if s.lower() in talent_skills_lower]
        
        if preferred_skills:
            preferred_score = (len(matched_preferred) / len(preferred_skills)) * 30
        else:
            preferred_score = 30  # No preferred skills means full score
        
        total_score = required_score + preferred_score
        matched_skills = matched_required + matched_preferred
        
        return total_score, matched_skills, missing_required
    
    def calculate_experience_match(
        self,
        talent_years: int,
        talent_level: ExperienceLevel,
        job_min_years: int,
        job_max_years: int,
        job_level: ExperienceLevel
    ) -> float:
        """
        Calculate experience match score (0-100).
        
        Args:
            talent_years: Talent's years of experience
            talent_level: Talent's experience level
            job_min_years: Minimum years required for job
            job_max_years: Maximum years for job
            job_level: Job's required experience level
            
        Returns:
            Experience match score
        """
        # Level match (60% weight)
        talent_level_num = self.EXPERIENCE_LEVELS.get(talent_level, 2)
        job_level_num = self.EXPERIENCE_LEVELS.get(job_level, 2)
        level_diff = abs(talent_level_num - job_level_num)
        
        if level_diff == 0:
            level_score = 60
        elif level_diff == 1:
            level_score = 40
        else:
            level_score = 20
        
        # Years match (40% weight)
        if talent_years >= job_min_years:
            if job_max_years and talent_years > job_max_years:
                # Overqualified
                years_over = talent_years - job_max_years
                years_score = max(20, 40 - (years_over * 5))
            else:
                years_score = 40
        else:
            # Underqualified
            years_under = job_min_years - talent_years
            years_score = max(0, 40 - (years_under * 10))
        
        return level_score + years_score
    
    def calculate_location_match(
        self,
        talent_location: str,
        talent_remote: bool,
        job_location: str,
        job_remote: bool
    ) -> float:
        """
        Calculate location match score (0-100).
        
        Args:
            talent_location: Talent's location
            talent_remote: Whether talent prefers remote
            job_location: Job's location
            job_remote: Whether job allows remote
            
        Returns:
            Location match score
        """
        # Remote work compatibility
        if job_remote and talent_remote:
            return 100
        
        if job_remote and not talent_remote:
            return 80  # Job is remote but talent prefers on-site
        
        if not job_remote and talent_remote:
            return 60  # Job is on-site but talent prefers remote
        
        # Location match
        talent_city = talent_location.lower().strip()
        job_city = job_location.lower().strip()
        
        if talent_city == job_city:
            return 100
        
        # Check if same city mentioned
        if talent_city in job_city or job_city in talent_city:
            return 80
        
        return 30  # Different locations, no remote
    
    def calculate_salary_match(
        self,
        talent_rate_min: float,
        talent_rate_max: float,
        job_salary_min: float,
        job_salary_max: float
    ) -> float:
        """
        Calculate salary match score (0-100).
        
        Args:
            talent_rate_min: Talent's minimum rate expectation
            talent_rate_max: Talent's maximum rate expectation
            job_salary_min: Job's minimum salary
            job_salary_max: Job's maximum salary
            
        Returns:
            Salary match score
        """
        if not talent_rate_min or not job_salary_min:
            return 50  # Neutral if no salary info
        
        # Check overlap
        if talent_rate_min <= job_salary_max and talent_rate_max >= job_salary_min:
            # Calculate overlap percentage
            overlap_min = max(talent_rate_min, job_salary_min)
            overlap_max = min(talent_rate_max, job_salary_max)
            overlap = overlap_max - overlap_min
            
            talent_range = talent_rate_max - talent_rate_min
            if talent_range > 0:
                overlap_pct = (overlap / talent_range) * 100
                return min(100, 50 + overlap_pct / 2)
            return 100
        
        # No overlap
        if talent_rate_min > job_salary_max:
            # Talent expects more
            diff_pct = ((talent_rate_min - job_salary_max) / job_salary_max) * 100
            return max(0, 50 - diff_pct)
        else:
            # Job offers more
            return 70
    
    def match_talent_to_jobs(
        self,
        talent: TalentProfile,
        jobs: List[JobPosting]
    ) -> List[MatchResult]:
        """
        Match a talent to multiple jobs.
        
        Args:
            talent: The talent profile to match
            jobs: List of job postings to match against
            
        Returns:
            List of match results sorted by score
        """
        results = []
        
        for job in jobs:
            # Calculate individual scores
            skill_score, matched_skills, missing_skills = self.calculate_skill_match(
                talent.skills,
                job.required_skills,
                job.preferred_skills
            )
            
            experience_score = self.calculate_experience_match(
                talent.years_of_experience,
                talent.experience_level,
                job.min_years_experience,
                job.max_years_experience or 100,
                job.experience_level
            )
            
            location_score = self.calculate_location_match(
                talent.location,
                talent.remote_preference,
                job.location,
                job.remote_allowed
            )
            
            salary_score = None
            if talent.hourly_rate_min and job.salary_min:
                salary_score = self.calculate_salary_match(
                    talent.hourly_rate_min,
                    talent.hourly_rate_max or talent.hourly_rate_min * 1.5,
                    job.salary_min,
                    job.salary_max or job.salary_min * 1.5
                )
            
            # Calculate overall match score
            overall_score = (
                skill_score * self.WEIGHTS["skills"] +
                experience_score * self.WEIGHTS["experience"] +
                location_score * self.WEIGHTS["location"] +
                (salary_score or 50) * self.WEIGHTS["salary"]
            )
            
            # Generate reason
            reason = self._generate_match_reason(
                skill_score, experience_score, location_score, 
                matched_skills, missing_skills
            )
            
            results.append(MatchResult(
                job_id=job.id,
                match_score=round(overall_score, 2),
                skill_match_score=round(skill_score, 2),
                experience_match_score=round(experience_score, 2),
                location_match_score=round(location_score, 2),
                salary_match_score=round(salary_score, 2) if salary_score else None,
                matched_skills=matched_skills,
                missing_skills=missing_skills,
                reason=reason
            ))
        
        # Sort by match score
        results.sort(key=lambda x: x.match_score, reverse=True)
        return results
    
    def match_job_to_talents(
        self,
        job: JobPosting,
        talents: List[TalentProfile]
    ) -> List[MatchResult]:
        """
        Match a job to multiple talents.
        
        Args:
            job: The job posting to match
            talents: List of talent profiles to match against
            
        Returns:
            List of match results sorted by score
        """
        results = []
        
        for talent in talents:
            # Calculate individual scores
            skill_score, matched_skills, missing_skills = self.calculate_skill_match(
                talent.skills,
                job.required_skills,
                job.preferred_skills
            )
            
            experience_score = self.calculate_experience_match(
                talent.years_of_experience,
                talent.experience_level,
                job.min_years_experience,
                job.max_years_experience or 100,
                job.experience_level
            )
            
            location_score = self.calculate_location_match(
                talent.location,
                talent.remote_preference,
                job.location,
                job.remote_allowed
            )
            
            salary_score = None
            if talent.hourly_rate_min and job.salary_min:
                salary_score = self.calculate_salary_match(
                    talent.hourly_rate_min,
                    talent.hourly_rate_max or talent.hourly_rate_min * 1.5,
                    job.salary_min,
                    job.salary_max or job.salary_min * 1.5
                )
            
            # Calculate overall match score
            overall_score = (
                skill_score * self.WEIGHTS["skills"] +
                experience_score * self.WEIGHTS["experience"] +
                location_score * self.WEIGHTS["location"] +
                (salary_score or 50) * self.WEIGHTS["salary"]
            )
            
            # Generate reason
            reason = self._generate_match_reason(
                skill_score, experience_score, location_score,
                matched_skills, missing_skills
            )
            
            results.append(MatchResult(
                talent_id=talent.id,
                match_score=round(overall_score, 2),
                skill_match_score=round(skill_score, 2),
                experience_match_score=round(experience_score, 2),
                location_match_score=round(location_score, 2),
                salary_match_score=round(salary_score, 2) if salary_score else None,
                matched_skills=matched_skills,
                missing_skills=missing_skills,
                reason=reason
            ))
        
        # Sort by match score
        results.sort(key=lambda x: x.match_score, reverse=True)
        return results
    
    def _generate_match_reason(
        self,
        skill_score: float,
        experience_score: float,
        location_score: float,
        matched_skills: List[str],
        missing_skills: List[str]
    ) -> str:
        """Generate human-readable match reason."""
        reasons = []
        
        if skill_score >= 80:
            reasons.append(f"Strong skill match ({len(matched_skills)} skills)")
        elif skill_score >= 60:
            reasons.append(f"Good skill match ({len(matched_skills)} skills)")
        elif missing_skills:
            reasons.append(f"Missing {len(missing_skills)} required skills")
        
        if experience_score >= 80:
            reasons.append("Experience level matches well")
        elif experience_score < 50:
            reasons.append("Experience level mismatch")
        
        if location_score >= 80:
            reasons.append("Location compatible")
        elif location_score < 50:
            reasons.append("Location may be a challenge")
        
        return " • ".join(reasons) if reasons else "Partial match"


# Singleton instance for convenience
matching_service = MatchingService()
