"""
API v1 Router

Central router that aggregates all v1 endpoint routers.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import matching, admin


# Create main API router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    matching.router,
    prefix="/matching",
    tags=["matching"]
)

api_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["admin"]
)

# Future routers can be added here:
# api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
# api_router.include_router(talents.router, prefix="/talents", tags=["talents"])
# api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
