"""
TalentBrains API - Entry Point

Run with: uvicorn main:app --reload
Or: python main.py
"""
import uvicorn

# Import the app from the app package
from app.main import app


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
