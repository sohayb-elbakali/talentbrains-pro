"""
Matching Endpoints

API endpoints for talent-job matching operations.
Includes authentication and rate limiting for security.
"""
from fastapi import APIRouter, HTTPException, Query, Depends, Request
from typing import List

from app.models.matching import MatchResult, MatchingStats
from app.models.talent import TalentListItem
from app.models.job import JobListItem
from app.repositories.talent_repo import TalentRepository
from app.repositories.job_repo import JobRepository
from app.services.matching_service import MatchingService
from app.api.deps import (
    get_talent_repository, 
    get_job_repository, 
    get_matching_service,
    CurrentUser,
    OptionalUser
)
from app.core.rate_limit import limiter, RateLimits


router = APIRouter()


@router.get("/talents")
@limiter.limit(RateLimits.READ)
async def list_talents(
    request: Request,
    current_user: CurrentUser,  # Requires authentication
    talent_repo: TalentRepository = Depends(get_talent_repository)
):
    """
    List all available talents with their IDs.
    Requires authentication.
    
    Returns a list of talents with basic information for matching.
    """
    try:
        talents = await talent_repo.get_all()
        return {
            "count": len(talents),
            "talents": [
                {
                    "id": t.id,
                    "name": t.full_name,
                    "title": t.title,
                    "location": t.location,
                    "skills": t.skills,
                    "years_of_experience": t.years_of_experience
                }
                for t in talents
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail="Error fetching talents"
        )


@router.get("/jobs")
@limiter.limit(RateLimits.READ)
async def list_jobs(
    request: Request,
    current_user: CurrentUser,  # Requires authentication
    job_repo: JobRepository = Depends(get_job_repository)
):
    """
    List all available jobs with their IDs.
    Requires authentication.
    
    Returns a list of jobs with basic information for matching.
    """
    try:
        jobs = await job_repo.get_all()
        return {
            "count": len(jobs),
            "jobs": [
                {
                    "id": j.id,
                    "title": j.title,
                    "company": j.company,
                    "location": j.location,
                    "required_skills": j.required_skills,
                    "min_years_experience": j.min_years_experience
                }
                for j in jobs
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail="Error fetching jobs"
        )


@router.post("/talent/{talent_id}/jobs", response_model=List[MatchResult])
@limiter.limit(RateLimits.COMPUTE)
async def match_talent_to_jobs(
    request: Request,
    talent_id: str,
    current_user: CurrentUser,  # Requires authentication
    limit: int = Query(default=10, ge=1, le=100),
    talent_repo: TalentRepository = Depends(get_talent_repository),
    job_repo: JobRepository = Depends(get_job_repository),
    matching_svc: MatchingService = Depends(get_matching_service)
):
    """
    Match a talent profile to available jobs.
    Requires authentication.
    
    Returns top matching jobs sorted by match score.
    
    Args:
        talent_id: ID of the talent to match
        limit: Maximum number of results to return (1-100)
    """
    # Validate talent_id format (UUID)
    if not talent_id or len(talent_id) < 20:
        raise HTTPException(
            status_code=400,
            detail="Invalid talent_id format"
        )
    
    try:
        # Get talent profile
        talent = await talent_repo.get_by_id(talent_id)
        if not talent:
            raise HTTPException(
                status_code=404, 
                detail=f"Talent not found"
            )
        
        # Get all jobs
        jobs = await job_repo.get_all()
        if not jobs:
            return []
        
        # Perform matching
        results = matching_svc.match_talent_to_jobs(talent, jobs)
        
        # Return top N results
        return results[:limit]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail="Error performing match"
        )


@router.post("/job/{job_id}/talents", response_model=List[MatchResult])
@limiter.limit(RateLimits.COMPUTE)
async def match_job_to_talents(
    request: Request,
    job_id: str,
    current_user: CurrentUser,  # Requires authentication
    limit: int = Query(default=10, ge=1, le=100),
    talent_repo: TalentRepository = Depends(get_talent_repository),
    job_repo: JobRepository = Depends(get_job_repository),
    matching_svc: MatchingService = Depends(get_matching_service)
):
    """
    Match a job posting to available talents.
    Requires authentication.
    
    Returns top matching talents sorted by match score.
    
    Args:
        job_id: ID of the job to match
        limit: Maximum number of results to return (1-100)
    """
    # Validate job_id format
    if not job_id or len(job_id) < 20:
        raise HTTPException(
            status_code=400,
            detail="Invalid job_id format"
        )
    
    try:
        # Get job posting
        job = await job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(
                status_code=404, 
                detail=f"Job not found"
            )
        
        # Get all talents
        talents = await talent_repo.get_all()
        if not talents:
            return []
        
        # Perform matching
        results = matching_svc.match_job_to_talents(job, talents)
        
        # Return top N results
        return results[:limit]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail="Error performing match"
        )


@router.get("/talent/{talent_id}/job/{job_id}", response_model=MatchResult)
@limiter.limit(RateLimits.COMPUTE)
async def match_talent_to_specific_job(
    request: Request,
    talent_id: str,
    job_id: str,
    current_user: CurrentUser,  # Requires authentication
    talent_repo: TalentRepository = Depends(get_talent_repository),
    job_repo: JobRepository = Depends(get_job_repository),
    matching_svc: MatchingService = Depends(get_matching_service)
):
    """
    Calculate match score between a specific talent and job.
    Requires authentication.
    
    Args:
        talent_id: ID of the talent
        job_id: ID of the job
    """
    # Validate IDs
    if not talent_id or len(talent_id) < 20:
        raise HTTPException(status_code=400, detail="Invalid talent_id format")
    if not job_id or len(job_id) < 20:
        raise HTTPException(status_code=400, detail="Invalid job_id format")
    
    try:
        # Get talent and job
        talent = await talent_repo.get_by_id(talent_id)
        if not talent:
            raise HTTPException(
                status_code=404, 
                detail=f"Talent not found"
            )
        
        job = await job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(
                status_code=404, 
                detail=f"Job not found"
            )
        
        # Perform matching
        results = matching_svc.match_talent_to_jobs(talent, [job])
        
        if not results:
            raise HTTPException(
                status_code=500, 
                detail="Matching failed"
            )
        
        return results[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail="Error performing match"
        )


@router.get("/stats", response_model=MatchingStats)
@limiter.limit(RateLimits.READ)
async def get_matching_stats(
    request: Request,
    current_user: OptionalUser,  # Optional authentication (public stats)
    talent_repo: TalentRepository = Depends(get_talent_repository),
    job_repo: JobRepository = Depends(get_job_repository)
):
    """
    Get matching system statistics.
    
    Returns counts of talents and jobs in the system.
    """
    talents = await talent_repo.get_all()
    jobs = await job_repo.get_all()
    
    return MatchingStats(
        total_talents=len(talents),
        total_jobs=len(jobs),
        status="operational"
    )
