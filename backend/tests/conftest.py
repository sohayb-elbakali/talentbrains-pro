"""
Test Configuration

Pytest fixtures and test utilities.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def mock_talent():
    """Mock talent data for testing."""
    return {
        "id": "test-talent-id",
        "full_name": "Test User",
        "title": "Software Engineer",
        "location": "New York",
        "skills": ["Python", "FastAPI", "PostgreSQL"],
        "years_of_experience": 5,
        "experience_level": "mid",
        "remote_preference": True,
        "hourly_rate_min": 50,
        "hourly_rate_max": 100
    }


@pytest.fixture
def mock_job():
    """Mock job data for testing."""
    return {
        "id": "test-job-id",
        "title": "Backend Developer",
        "company": "Tech Corp",
        "location": "New York",
        "required_skills": ["Python", "FastAPI"],
        "preferred_skills": ["PostgreSQL"],
        "min_years_experience": 3,
        "max_years_experience": 7,
        "experience_level": "mid",
        "remote_allowed": True,
        "salary_min": 80000,
        "salary_max": 120000
    }
