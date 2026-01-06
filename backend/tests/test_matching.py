"""
Matching Service Tests

Unit tests for the matching service.
"""
import pytest

from app.services.matching_service import MatchingService
from app.models.talent import TalentProfile
from app.models.job import JobPosting


class TestMatchingService:
    """Tests for MatchingService."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.service = MatchingService()
    
    def test_calculate_skill_match_full_match(self):
        """Test skill matching with all skills present."""
        talent_skills = ["Python", "FastAPI", "PostgreSQL"]
        required_skills = ["Python", "FastAPI"]
        preferred_skills = ["PostgreSQL"]
        
        score, matched, missing = self.service.calculate_skill_match(
            talent_skills, required_skills, preferred_skills
        )
        
        assert score == 100
        assert len(matched) == 3
        assert len(missing) == 0
    
    def test_calculate_skill_match_partial_match(self):
        """Test skill matching with partial skills."""
        talent_skills = ["Python"]
        required_skills = ["Python", "FastAPI"]
        preferred_skills = []
        
        score, matched, missing = self.service.calculate_skill_match(
            talent_skills, required_skills, preferred_skills
        )
        
        assert score == 65  # 50% of required (35) + full preferred (30)
        assert "Python" in matched
        assert "FastAPI" in missing
    
    def test_calculate_experience_match_exact(self):
        """Test experience matching with exact match."""
        score = self.service.calculate_experience_match(
            talent_years=5,
            talent_level="mid",
            job_min_years=3,
            job_max_years=7,
            job_level="mid"
        )
        
        assert score == 100  # Perfect match
    
    def test_calculate_location_match_remote(self):
        """Test location matching with remote compatibility."""
        score = self.service.calculate_location_match(
            talent_location="Casablanca",
            talent_remote=True,
            job_location="New York",
            job_remote=True
        )
        
        assert score == 100  # Both prefer remote
    
    def test_calculate_location_match_same_city(self):
        """Test location matching with same city."""
        score = self.service.calculate_location_match(
            talent_location="New York",
            talent_remote=False,
            job_location="New York",
            job_remote=False
        )
        
        assert score == 100
    
    def test_calculate_salary_match_overlap(self):
        """Test salary matching with overlapping ranges."""
        score = self.service.calculate_salary_match(
            talent_rate_min=50,
            talent_rate_max=100,
            job_salary_min=60,
            job_salary_max=120
        )
        
        assert score >= 50  # Should have good overlap
