# TalentBrains Backend API

AI-Powered Talent Matching Platform - FastAPI Backend

## 📁 Project Structure

```
backend/
├── main.py                    # Application entry point
├── requirements.txt           # Production dependencies
├── requirements-dev.txt       # Development/testing dependencies
├── .env                       # Environment variables (not in git)
├── .env.example              # Example environment file
│
├── app/                       # Main application package
│   ├── __init__.py
│   ├── main.py               # FastAPI app creation & configuration
│   │
│   ├── core/                 # Core configuration & utilities
│   │   ├── __init__.py
│   │   ├── config.py         # Settings & environment variables
│   │   ├── database.py       # Database connection (Supabase)
│   │   └── security.py       # Authentication & security utilities
│   │
│   ├── api/                  # API layer
│   │   ├── __init__.py
│   │   ├── deps.py           # Dependency injection
│   │   └── v1/               # API version 1
│   │       ├── __init__.py
│   │       ├── router.py     # Central API router
│   │       └── endpoints/    # API endpoints
│   │           ├── __init__.py
│   │           ├── matching.py
│   │           └── admin.py
│   │
│   ├── models/               # Pydantic models (schemas)
│   │   ├── __init__.py
│   │   ├── base.py           # Base models & enums
│   │   ├── talent.py         # Talent-related models
│   │   ├── job.py            # Job-related models
│   │   └── matching.py       # Matching-related models
│   │
│   ├── repositories/         # Data access layer
│   │   ├── __init__.py
│   │   ├── base.py           # Abstract base repository
│   │   ├── talent_repo.py    # Talent database operations
│   │   └── job_repo.py       # Job database operations
│   │
│   └── services/             # Business logic layer
│       ├── __init__.py
│       └── matching_service.py  # Matching algorithms
│
└── tests/                    # Test suite
    ├── __init__.py
    ├── conftest.py           # Pytest configuration & fixtures
    └── test_matching.py      # Matching service tests
```

## 🏗️ Architecture

This project follows a **clean architecture** pattern with clear separation of concerns:

| Layer | Purpose |
|-------|---------|
| **API (Endpoints)** | HTTP request/response handling, routing |
| **Services** | Business logic, algorithms |
| **Repositories** | Data access, database queries |
| **Models** | Data validation, schemas |
| **Core** | Configuration, database, security |

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Production dependencies
pip install -r requirements.txt

# Development dependencies (for testing)
pip install -r requirements-dev.txt
```

### 2. Configure Environment

Create a `.env` file based on `.env.example`:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### 3. Run the Server

```bash
# Development with auto-reload
uvicorn main:app --reload

# Or using Python directly
python main.py
```

### 4. Access the API

- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 📡 API Endpoints

### Base URL: `/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/matching/talents` | List all talents |
| GET | `/matching/jobs` | List all jobs |
| POST | `/matching/talent/{id}/jobs` | Match talent to jobs |
| POST | `/matching/job/{id}/talents` | Match job to talents |
| GET | `/matching/talent/{id}/job/{id}` | Get specific match score |
| GET | `/matching/stats` | Get matching statistics |
| POST | `/admin/create-talent` | Create talent (admin) |
| GET | `/admin/profiles` | List profiles (admin) |
| GET | `/admin/check-data` | Check database data |

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_matching.py -v
```

## 🔧 Adding New Features

### Adding a New Endpoint

1. Create model in `app/models/`
2. Create repository in `app/repositories/`
3. Create service in `app/services/` (if business logic needed)
4. Create endpoint in `app/api/v1/endpoints/`
5. Register route in `app/api/v1/router.py`

### Example: Adding Users Module

```python
# 1. app/models/user.py
class UserCreate(BaseModel):
    email: str
    password: str

# 2. app/repositories/user_repo.py
class UserRepository(BaseRepository[User]):
    ...

# 3. app/services/user_service.py
class UserService:
    ...

# 4. app/api/v1/endpoints/users.py
router = APIRouter()

@router.post("/")
async def create_user(...):
    ...

# 5. app/api/v1/router.py
api_router.include_router(users.router, prefix="/users", tags=["users"])
```

## 📝 Best Practices

1. **Dependency Injection**: Use `Depends()` for repositories and services
2. **Type Hints**: Always use type hints for function parameters and returns
3. **Validation**: Use Pydantic models for request/response validation
4. **Error Handling**: Use HTTPException for API errors
5. **Documentation**: Add docstrings to all functions and classes
6. **Testing**: Write tests for services and endpoints

## 🔐 Security Notes

- Store secrets in `.env` file (never commit to git)
- Use Supabase RLS for row-level security
- Implement authentication when needed using `app/core/security.py`

---

Built with ❤️ using FastAPI
