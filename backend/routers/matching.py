from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from models import MatchResult, MatchRequest
import database_simple as db
from matching_engine import matching_engine

router = APIRouter()

@router.get("/talents")
async def list_talents():
    """
    List all available talents with their IDs
    """
    try:
        talents = await db.get_all_talents()
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
        raise HTTPException(status_code=500, detail=f"Error fetching talents: {str(e)}")

@router.get("/jobs")
async def list_jobs():
    """
    List all available jobs with their IDs
    """
    try:
        jobs = await db.get_all_jobs()
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
        raise HTTPException(status_code=500, detail=f"Error fetching jobs: {str(e)}")

@router.post("/talent/{talent_id}/jobs", response_model=List[MatchResult])
async def match_talent_to_jobs(
    talent_id: str,
    limit: int = Query(default=10, ge=1, le=100)
):
    """
    Match a talent profile to available jobs
    Returns top matching jobs sorted by match score
    """
    try:
        # Get talent profile
        talent = await db.get_talent_by_id(talent_id)
        if not talent:
            raise HTTPException(
                status_code=404, 
                detail=f"Talent with ID '{talent_id}' not found. Use GET /api/matching/talents to see available talents."
            )
        
        # Get all jobs
        jobs = await db.get_all_jobs()
        if not jobs:
            return []
        
        # Perform matching
        results = matching_engine.match_talent_to_jobs(talent, jobs)
        
        # Return top N results
        return results[:limit]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching error: {str(e)}")

@router.post("/job/{job_id}/talents", response_model=List[MatchResult])
async def match_job_to_talents(
    job_id: str,
    limit: int = Query(default=10, ge=1, le=100)
):
    """
    Match a job posting to available talents
    Returns top matching talents sorted by match score
    """
    try:
        # Get job posting
        job = await db.get_job_by_id(job_id)
        if not job:
            raise HTTPException(
                status_code=404, 
                detail=f"Job with ID '{job_id}' not found. Use GET /api/matching/jobs to see available jobs."
            )
        
        # Get all talents
        talents = await db.get_all_talents()
        if not talents:
            return []
        
        # Perform matching
        results = matching_engine.match_job_to_talents(job, talents)
        
        # Return top N results
        return results[:limit]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching error: {str(e)}")

@router.get("/talent/{talent_id}/job/{job_id}", response_model=MatchResult)
async def match_talent_to_specific_job(
    talent_id: str,
    job_id: str
):
    """
    Calculate match score between a specific talent and job
    """
    try:
        # Get talent and job
        talent = await db.get_talent_by_id(talent_id)
        if not talent:
            raise HTTPException(status_code=404, detail=f"Talent with ID '{talent_id}' not found")
        
        job = await db.get_job_by_id(job_id)
        if not job:
            raise HTTPException(status_code=404, detail=f"Job with ID '{job_id}' not found")
        
        # Perform matching
        results = matching_engine.match_talent_to_jobs(talent, [job])
        
        if not results:
            raise HTTPException(status_code=500, detail="Matching failed")
        
        return results[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching error: {str(e)}")

@router.get("/stats")
async def get_matching_stats():
    """
    Get matching system statistics
    """
    talents = await db.get_all_talents()
    jobs = await db.get_all_jobs()
    
    return {
        "total_talents": len(talents),
        "total_jobs": len(jobs),
        "status": "operational"
    }
