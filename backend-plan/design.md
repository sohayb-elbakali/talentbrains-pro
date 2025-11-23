# ML Matching Backend Design Document

## Overview

The ML Matching Backend is a Python-based microservice that provides intelligent job-talent matching capabilities for the TalentBrains platform. The system uses a hybrid approach combining pre-trained language models for semantic understanding with gradient boosting models for scoring, creating a lightweight yet powerful MVP that can be deployed quickly and improved iteratively.

### Design Philosophy

- **Start Simple, Scale Smart**: Use pre-trained models and simple architectures for MVP, with clear paths to sophistication
- **Explainability First**: Every match score comes with interpretable factors that users can understand
- **Fail Gracefully**: Fallback to rule-based matching when ML service is unavailable
- **Learn Continuously**: Capture user feedback to improve models over time

### Key Design Decisions

1. **Python FastAPI Service**: Fast, modern, async-capable framework with automatic API documentation
2. **Sentence Transformers**: Pre-trained models (all-MiniLM-L6-v2) for text embeddings - no training required
3. **LightGBM**: Fast gradient boosting for match scoring with built-in feature importance
4. **Supabase Edge Functions**: API gateway pattern for authentication and fallback logic
5. **Docker Deployment**: Single container deployment for MVP simplicity

## Architecture


### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     TalentBrains Frontend                        │
│                   (React + TypeScript)                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Platform                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Edge Function: ml-matching-gateway               │  │
│  │  - Authentication & Authorization                        │  │
│  │  - Request Validation                                    │  │
│  │  - Fallback to Rule-Based Matching                       │  │
│  │  - Response Caching                                      │  │
│  └────────────┬─────────────────────────────────────────────┘  │
│               │                                                  │
│  ┌────────────▼──────────────────────────────────────────────┐ │
│  │              PostgreSQL Database                          │ │
│  │  - Profiles, Talents, Companies, Jobs                    │ │
│  │  - Skills, Applications, Matches                         │ │
│  │  - Match Feedback, Activity Logs                         │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP (Internal)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              ML Matching Backend Service                         │
│                    (Python FastAPI)                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  API Layer                                │  │
│  │  /match/talent-to-jobs    /match/job-to-talents         │  │
│  │  /train/trigger           /health                        │  │
│  └────────────┬─────────────────────────────────────────────┘  │
│               │                                                  │
│  ┌────────────▼──────────────────────────────────────────────┐ │
│  │              Matching Engine                              │ │
│  │  ┌──────────────────┐  ┌──────────────────┐             │ │
│  │  │ Feature          │  │ Scoring          │             │ │
│  │  │ Extractor        │─▶│ Model            │             │ │
│  │  │                  │  │ (LightGBM)       │             │ │
│  │  └──────────────────┘  └──────────────────┘             │ │
│  │  ┌──────────────────┐  ┌──────────────────┐             │ │
│  │  │ Text             │  │ Explainer        │             │ │
│  │  │ Embedder         │─▶│ (SHAP)           │             │ │
│  │  │ (Transformers)   │  │                  │             │ │
│  │  └──────────────────┘  └──────────────────┘             │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Training Pipeline                            │  │
│  │  - Data Collection from Supabase                         │  │
│  │  - Feature Engineering                                   │  │
│  │  - Model Training & Validation                           │  │
│  │  - Model Versioning & Deployment                         │  │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Match Generation Flow:**
1. User requests matches via TalentBrains frontend
2. Request hits Supabase Edge Function with JWT token
3. Edge Function validates auth and fetches relevant data from PostgreSQL
4. Edge Function calls ML Backend Service with enriched data
5. ML Backend extracts features and generates embeddings
6. Scoring model predicts match scores with explanations
7. Results returned through Edge Function to frontend
8. User interactions (apply, dismiss) logged as feedback


## Components and Interfaces

### 1. Supabase Edge Function (ml-matching-gateway)

**Purpose**: Acts as the API gateway between the frontend and ML service, handling authentication, data enrichment, and fallback logic.

**Key Responsibilities:**
- Validate JWT tokens and extract user context
- Fetch talent/job data from PostgreSQL with necessary joins
- Call ML Backend Service with timeout handling
- Implement fallback to rule-based matching on ML service failure
- Cache frequent requests to reduce load
- Log all requests for monitoring

**API Endpoints:**

```typescript
// POST /functions/v1/ml-matching-gateway
interface MatchRequest {
  type: 'talent-to-jobs' | 'job-to-talents';
  talent_id?: string;  // For talent-to-jobs
  job_id?: string;     // For job-to-talents
  limit?: number;      // Max results to return (default: 20)
  min_score?: number;  // Minimum match score (default: 50)
}

interface MatchResponse {
  matches: MatchResult[];
  source: 'ml' | 'fallback';  // Indicates if ML or rule-based
  processing_time_ms: number;
}

interface MatchResult {
  talent_id: string;
  job_id: string;
  match_score: number;  // 0-100
  confidence: number;   // 0-1
  explanation: MatchExplanation;
}

interface MatchExplanation {
  top_factors: Array<{
    factor: string;
    score: number;
    description: string;
  }>;
  sub_scores: {
    skills_match: number;
    experience_match: number;
    location_match: number;
    salary_match: number;
    cultural_fit: number;
  };
}
```

**Fallback Logic:**
- If ML service timeout (>5s) or error: use rule-based scoring
- Rule-based: weighted sum of exact skill matches, experience level alignment, location compatibility
- Log fallback events for monitoring


### 2. ML Backend Service (Python FastAPI)

**Purpose**: Core ML service that performs feature extraction, embedding generation, and match scoring.

**Technology Stack:**
- FastAPI for async API framework
- Sentence-Transformers for text embeddings
- LightGBM for gradient boosting
- SHAP for model explainability
- Pydantic for data validation
- SQLAlchemy for database access (read-only)

**API Endpoints:**

```python
# POST /api/v1/match/talent-to-jobs
class TalentToJobsRequest(BaseModel):
    talent: TalentProfile
    jobs: List[JobPosting]
    limit: int = 20
    min_score: float = 0.5

class TalentProfile(BaseModel):
    id: str
    title: str
    bio: Optional[str]
    skills: List[SkillData]
    experience_level: str
    years_of_experience: int
    location: Optional[str]
    remote_preference: bool
    salary_min: Optional[int]
    salary_max: Optional[int]

class JobPosting(BaseModel):
    id: str
    title: str
    description: str
    skills: List[SkillData]
    experience_level: str
    location: Optional[str]
    remote_allowed: bool
    salary_min: Optional[int]
    salary_max: Optional[int]
    company_culture: Optional[str]

class SkillData(BaseModel):
    name: str
    proficiency_level: int  # 1-5
    years_of_experience: float
    is_primary: bool = False  # For talent skills - marks primary/core skills
    is_required: bool = False  # For job skills - marks required vs optional skills

# POST /api/v1/match/job-to-talents
# Similar structure, reversed perspective

# POST /api/v1/train/trigger
class TrainingRequest(BaseModel):
    force: bool = False  # Force retrain even if recent
    
# GET /api/v1/health
class HealthResponse(BaseModel):
    status: str
    model_version: str
    model_last_trained: datetime
    uptime_seconds: float
```


### 3. Feature Extractor

**Purpose**: Transform raw talent and job data into numerical features for ML models.

**Feature Categories:**

**A. Skill Features (40% weight)**
- Skill overlap score: Jaccard similarity of skill sets
- Proficiency alignment: Average difference in proficiency levels for matching skills
- Required skills coverage: Percentage of required job skills the talent has
- Primary skills match: Bonus weight for matching primary/core skills marked by talent
- Skill embedding similarity: Cosine similarity of skill text embeddings
- Years of experience per skill: Weighted by skill importance

**B. Experience Features (25% weight)**
- Experience level match: Binary (exact match) + ordinal distance
- Years of experience ratio: talent_years / job_required_years
- Seniority alignment: Encoded experience level compatibility
- Career progression indicator: Derived from title and experience

**C. Location Features (20% weight)**
- Geographic distance: Haversine distance if both have locations
- Remote compatibility: Boolean match of remote preference/allowed
- Timezone overlap: Hours of overlap for remote work
- Location preference match: Exact location match bonus

**D. Compensation Features (15% weight)**
- Salary overlap: Intersection over union of salary ranges
- Salary expectation ratio: talent_expected / job_offered
- Compensation alignment: Binary indicator if ranges overlap

**E. Text Semantic Features**
- Title similarity: Embedding cosine similarity
- Description similarity: Embedding cosine similarity
- Bio-to-culture fit: Talent bio vs company culture values

**Feature Engineering Pipeline:**
```python
class FeatureExtractor:
    def extract_features(
        self, 
        talent: TalentProfile, 
        job: JobPosting
    ) -> np.ndarray:
        """
        Returns feature vector of shape (n_features,)
        """
        features = []
        
        # Skill features
        features.extend(self._extract_skill_features(talent, job))
        
        # Experience features
        features.extend(self._extract_experience_features(talent, job))
        
        # Location features
        features.extend(self._extract_location_features(talent, job))
        
        # Compensation features
        features.extend(self._extract_compensation_features(talent, job))
        
        # Text embeddings (handled separately)
        # These are high-dimensional and processed differently
        
        return np.array(features)
```


### 4. Text Embedder

**Purpose**: Convert text data into dense vector representations for semantic similarity.

**Model Selection:**
- **Model**: `sentence-transformers/all-MiniLM-L6-v2`
- **Dimensions**: 384
- **Speed**: ~3000 sentences/second on CPU
- **Quality**: Good balance for MVP

**Text Fields to Embed:**
- Talent title + bio (concatenated)
- Job title + description (concatenated)
- Skill names (for semantic skill matching)
- Company culture values (if available)

**Embedding Strategy:**
```python
from sentence_transformers import SentenceTransformer

class TextEmbedder:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.cache = {}  # Simple in-memory cache
    
    def embed_talent(self, talent: TalentProfile) -> np.ndarray:
        text = f"{talent.title}. {talent.bio or ''}"
        return self._embed_with_cache(text)
    
    def embed_job(self, job: JobPosting) -> np.ndarray:
        text = f"{job.title}. {job.description}"
        return self._embed_with_cache(text)
    
    def compute_similarity(
        self, 
        embedding1: np.ndarray, 
        embedding2: np.ndarray
    ) -> float:
        return cosine_similarity(embedding1, embedding2)
```

**Optimization:**
- Batch embedding for multiple jobs/talents
- Cache embeddings for frequently accessed profiles
- Pre-compute embeddings for all active jobs (updated nightly)


### 5. Scoring Model (LightGBM)

**Purpose**: Predict match scores based on extracted features and embeddings.

**Model Architecture:**
- Algorithm: LightGBM Regressor
- Target: Match score (0-100)
- Features: ~50 engineered features + embedding similarities
- Hyperparameters (initial):
  - num_leaves: 31
  - learning_rate: 0.05
  - n_estimators: 100
  - max_depth: 6

**Training Data:**
- Positive samples: Applications, interested matches, contacted talents
- Negative samples: Dismissed recommendations, rejected applications
- Implicit feedback: View duration, profile completeness at match time

**Model Training Pipeline:**
```python
class MatchingModel:
    def __init__(self):
        self.model = lgb.LGBMRegressor(
            num_leaves=31,
            learning_rate=0.05,
            n_estimators=100,
            objective='regression',
            metric='rmse'
        )
        self.feature_names = []
        self.version = "1.0.0"
    
    def train(self, X: np.ndarray, y: np.ndarray):
        """
        X: Feature matrix (n_samples, n_features)
        y: Match scores (n_samples,)
        """
        # Split for validation
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Train with early stopping
        self.model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            early_stopping_rounds=10,
            verbose=False
        )
        
        # Save model version
        self.version = f"1.0.{datetime.now().strftime('%Y%m%d')}"
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Returns match scores (0-100)"""
        raw_scores = self.model.predict(X)
        return np.clip(raw_scores, 0, 100)
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Returns feature importance for explainability"""
        return dict(zip(
            self.feature_names,
            self.model.feature_importances_
        ))
```

**Initial Training:**
- For MVP: Use synthetic data + rule-based scores as labels
- Generate 1000+ synthetic talent-job pairs with realistic distributions
- Bootstrap with rule-based matching scores until real feedback accumulates


### 6. Explainer (SHAP)

**Purpose**: Provide interpretable explanations for match scores.

**Approach:**
- Use SHAP (SHapley Additive exPlanations) for feature attribution
- Calculate contribution of each feature to the final score
- Group features into human-readable categories

**Implementation:**
```python
import shap

class MatchExplainer:
    def __init__(self, model: MatchingModel):
        self.model = model
        self.explainer = shap.TreeExplainer(model.model)
    
    def explain_match(
        self, 
        features: np.ndarray,
        feature_names: List[str]
    ) -> MatchExplanation:
        """
        Generate human-readable explanation for a match score
        """
        # Get SHAP values
        shap_values = self.explainer.shap_values(features)
        
        # Group by category
        grouped_scores = self._group_feature_contributions(
            shap_values, feature_names
        )
        
        # Get top contributing factors
        top_factors = self._get_top_factors(
            shap_values, feature_names, top_k=3
        )
        
        return MatchExplanation(
            top_factors=top_factors,
            sub_scores=grouped_scores
        )
    
    def _group_feature_contributions(
        self, 
        shap_values: np.ndarray,
        feature_names: List[str]
    ) -> Dict[str, float]:
        """Group SHAP values by feature category"""
        categories = {
            'skills_match': [],
            'experience_match': [],
            'location_match': [],
            'salary_match': [],
            'cultural_fit': []
        }
        
        for name, value in zip(feature_names, shap_values):
            category = self._categorize_feature(name)
            categories[category].append(value)
        
        # Normalize to 0-100 scale
        return {
            cat: self._normalize_score(sum(vals))
            for cat, vals in categories.items()
        }
```

**Explanation Format:**
```json
{
  "top_factors": [
    {
      "factor": "Python expertise match",
      "score": 95,
      "description": "Strong alignment in Python skills (5 years experience)"
    },
    {
      "factor": "Remote work preference",
      "score": 100,
      "description": "Both prefer remote work"
    },
    {
      "factor": "Experience level",
      "score": 85,
      "description": "Senior level matches job requirements"
    }
  ],
  "sub_scores": {
    "skills_match": 92,
    "experience_match": 88,
    "location_match": 95,
    "salary_match": 75,
    "cultural_fit": 80
  }
}
```


### 7. Training Pipeline

**Purpose**: Automated pipeline for collecting feedback data and retraining models.

**Data Collection:**
```sql
-- Positive feedback signals
SELECT 
    t.id as talent_id,
    j.id as job_id,
    100 as match_score,  -- Strong positive signal
    a.created_at as timestamp
FROM applications a
JOIN talents t ON a.talent_id = t.id
JOIN jobs j ON a.job_id = j.id
WHERE a.status NOT IN ('withdrawn', 'rejected')

UNION ALL

-- Interested matches
SELECT 
    m.talent_id,
    m.job_id,
    85 as match_score,  -- Moderate positive signal
    m.interested_at as timestamp
FROM matches m
WHERE m.status = 'interested'

UNION ALL

-- Negative feedback signals
SELECT 
    m.talent_id,
    m.job_id,
    20 as match_score,  -- Negative signal
    m.updated_at as timestamp
FROM matches m
WHERE m.status = 'not_interested'
```

**Training Schedule:**
- **Weekly**: Automated retraining with accumulated feedback
- **Manual**: Triggered via API for immediate updates
- **Validation**: Hold-out test set to prevent overfitting

**Training Process:**
```python
class TrainingPipeline:
    def __init__(self, db_connection: str):
        self.db = create_engine(db_connection)
        self.feature_extractor = FeatureExtractor()
        self.embedder = TextEmbedder()
        self.model = MatchingModel()
    
    async def run_training(self, force: bool = False):
        """Execute full training pipeline"""
        
        # 1. Check if training is needed
        if not force and not self._should_train():
            return {"status": "skipped", "reason": "recent_training"}
        
        # 2. Collect feedback data
        feedback_data = await self._collect_feedback_data()
        
        if len(feedback_data) < 100:
            return {"status": "skipped", "reason": "insufficient_data"}
        
        # 3. Fetch full profiles for feature extraction
        enriched_data = await self._enrich_feedback_data(feedback_data)
        
        # 4. Extract features
        X, y = self._prepare_training_data(enriched_data)
        
        # 5. Train model
        self.model.train(X, y)
        
        # 6. Validate performance
        metrics = self._validate_model(X, y)
        
        # 7. Save model if performance is acceptable
        if metrics['rmse'] < self.performance_threshold:
            self._save_model()
            return {"status": "success", "metrics": metrics}
        else:
            return {"status": "failed", "metrics": metrics}
    
    def _should_train(self) -> bool:
        """Check if enough time has passed since last training"""
        last_trained = self._get_last_training_time()
        return (datetime.now() - last_trained).days >= 7
```


## Data Models

### Database Schema Extensions

**New Table: match_feedback**
```sql
CREATE TABLE match_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    talent_id UUID REFERENCES talents(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) NOT NULL, -- 'application', 'interested', 'dismissed', 'contacted'
    implicit_score INTEGER, -- Derived score (0-100)
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(talent_id, job_id, feedback_type)
);

CREATE INDEX idx_match_feedback_talent ON match_feedback(talent_id);
CREATE INDEX idx_match_feedback_job ON match_feedback(job_id);
CREATE INDEX idx_match_feedback_created ON match_feedback(created_at);
```

**New Table: ml_model_versions**
```sql
CREATE TABLE ml_model_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version VARCHAR(50) NOT NULL UNIQUE,
    model_path TEXT NOT NULL,
    metrics JSONB, -- Training metrics
    feature_importance JSONB,
    trained_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ml_model_active ON ml_model_versions(is_active);
```

**Update to matches table:**
```sql
ALTER TABLE matches 
ADD COLUMN ml_score DECIMAL(5,2), -- 0-100 score from ML model
ADD COLUMN ml_version VARCHAR(50), -- Model version used
ADD COLUMN explanation JSONB, -- Match explanation
ADD COLUMN source VARCHAR(20) DEFAULT 'ml'; -- 'ml' or 'fallback'
```

### Internal Data Models

**Feature Vector Schema:**
```python
@dataclass
class FeatureVector:
    # Skill features (10 features)
    skill_overlap_jaccard: float
    skill_proficiency_alignment: float
    required_skills_coverage: float
    skill_embedding_similarity: float
    avg_skill_years_ratio: float
    primary_skills_match: float
    skill_category_overlap: float
    rare_skills_bonus: float
    skill_count_ratio: float
    weighted_skill_score: float
    
    # Experience features (8 features)
    experience_level_match: float
    years_experience_ratio: float
    seniority_distance: float
    career_progression_score: float
    title_similarity: float
    overqualified_penalty: float
    underqualified_penalty: float
    experience_variance: float
    
    # Location features (6 features)
    geographic_distance_km: float
    remote_compatibility: float
    timezone_overlap_hours: float
    location_exact_match: float
    relocation_willingness: float
    hybrid_compatibility: float
    
    # Compensation features (5 features)
    salary_overlap_iou: float
    salary_expectation_ratio: float
    compensation_alignment: float
    salary_competitiveness: float
    benefits_match: float
    
    # Text semantic features (3 features)
    title_embedding_similarity: float
    description_embedding_similarity: float
    culture_fit_score: float
    
    # Metadata (not used in model)
    talent_id: str
    job_id: str
    computed_at: datetime
```


## Error Handling

### Error Categories and Responses

**1. ML Service Unavailable**
- Trigger: Service timeout (>5s) or connection error
- Response: Fallback to rule-based matching
- Logging: Log error with context to Supabase
- User Impact: Transparent - users see matches without knowing the source

**2. Invalid Input Data**
- Trigger: Missing required fields, invalid data types
- Response: Return 400 Bad Request with validation errors
- Logging: Log validation errors
- User Impact: Error message displayed in UI

**3. Model Loading Failure**
- Trigger: Model file corrupted or missing
- Response: Use previous model version or fallback
- Logging: Critical alert to monitoring system
- User Impact: Degraded match quality until resolved

**4. Database Connection Issues**
- Trigger: Cannot connect to Supabase
- Response: Return 503 Service Unavailable
- Logging: Log connection errors with retry attempts
- User Impact: Error message with retry option

**5. Rate Limiting**
- Trigger: Too many requests from single user/IP
- Response: Return 429 Too Many Requests
- Logging: Log rate limit violations
- User Impact: Temporary cooldown message

### Error Handling Implementation

```python
from fastapi import HTTPException, status
from functools import wraps
import logging

logger = logging.getLogger(__name__)

class MLServiceError(Exception):
    """Base exception for ML service errors"""
    pass

class ModelLoadError(MLServiceError):
    """Model loading failed"""
    pass

class FeatureExtractionError(MLServiceError):
    """Feature extraction failed"""
    pass

def handle_ml_errors(func):
    """Decorator for consistent error handling"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except ModelLoadError as e:
            logger.error(f"Model load error: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="ML model unavailable, using fallback"
            )
        except FeatureExtractionError as e:
            logger.error(f"Feature extraction error: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid input data: {str(e)}"
            )
        except Exception as e:
            logger.exception(f"Unexpected error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
    return wrapper
```

### Fallback Matching Algorithm

```python
class FallbackMatcher:
    """Rule-based matching when ML service is unavailable"""
    
    def calculate_match_score(
        self, 
        talent: TalentProfile, 
        job: JobPosting
    ) -> float:
        """Simple weighted scoring"""
        
        # Skill match (40%)
        skill_score = self._calculate_skill_match(talent, job) * 0.4
        
        # Experience match (25%)
        exp_score = self._calculate_experience_match(talent, job) * 0.25
        
        # Location match (20%)
        loc_score = self._calculate_location_match(talent, job) * 0.2
        
        # Salary match (15%)
        sal_score = self._calculate_salary_match(talent, job) * 0.15
        
        return (skill_score + exp_score + loc_score + sal_score) * 100
    
    def _calculate_skill_match(
        self, 
        talent: TalentProfile, 
        job: JobPosting
    ) -> float:
        """Jaccard similarity of skill sets"""
        talent_skills = set(s.name.lower() for s in talent.skills)
        job_skills = set(s.name.lower() for s in job.skills)
        
        if not job_skills:
            return 0.5  # Neutral if no skills specified
        
        intersection = len(talent_skills & job_skills)
        union = len(talent_skills | job_skills)
        
        return intersection / union if union > 0 else 0
```


## Testing Strategy

### Unit Tests

**Feature Extraction Tests:**
```python
def test_skill_overlap_calculation():
    """Test skill overlap feature extraction"""
    talent = create_mock_talent(skills=["Python", "React", "SQL"])
    job = create_mock_job(skills=["Python", "JavaScript", "SQL"])
    
    extractor = FeatureExtractor()
    features = extractor.extract_features(talent, job)
    
    # Should have 2/4 overlap (Python, SQL)
    assert features.skill_overlap_jaccard == pytest.approx(0.5, rel=0.01)

def test_experience_level_matching():
    """Test experience level feature extraction"""
    talent = create_mock_talent(experience_level="senior")
    job = create_mock_job(experience_level="senior")
    
    extractor = FeatureExtractor()
    features = extractor.extract_features(talent, job)
    
    assert features.experience_level_match == 1.0
```

**Model Prediction Tests:**
```python
def test_model_prediction_range():
    """Ensure predictions are in valid range"""
    model = MatchingModel()
    model.load("test_model.pkl")
    
    X = generate_random_features(n_samples=100)
    predictions = model.predict(X)
    
    assert np.all(predictions >= 0)
    assert np.all(predictions <= 100)

def test_model_feature_importance():
    """Verify feature importance is available"""
    model = MatchingModel()
    model.load("test_model.pkl")
    
    importance = model.get_feature_importance()
    
    assert len(importance) > 0
    assert sum(importance.values()) > 0
```

### Integration Tests

**End-to-End Matching Flow:**
```python
@pytest.mark.asyncio
async def test_talent_to_jobs_matching():
    """Test complete matching pipeline"""
    # Setup
    talent = create_test_talent()
    jobs = create_test_jobs(count=10)
    
    # Execute
    request = TalentToJobsRequest(
        talent=talent,
        jobs=jobs,
        limit=5
    )
    
    response = await match_talent_to_jobs(request)
    
    # Verify
    assert len(response.matches) <= 5
    assert all(0 <= m.match_score <= 100 for m in response.matches)
    assert response.matches == sorted(
        response.matches, 
        key=lambda x: x.match_score, 
        reverse=True
    )
```

**Fallback Logic Tests:**
```python
@pytest.mark.asyncio
async def test_fallback_on_ml_failure(monkeypatch):
    """Test fallback to rule-based matching"""
    # Mock ML service failure
    async def mock_ml_predict(*args, **kwargs):
        raise TimeoutError("ML service timeout")
    
    monkeypatch.setattr("ml_service.predict", mock_ml_predict)
    
    # Execute
    response = await match_talent_to_jobs(request)
    
    # Verify fallback was used
    assert response.source == "fallback"
    assert len(response.matches) > 0
```

### Performance Tests

**Latency Requirements:**
```python
@pytest.mark.benchmark
def test_matching_latency():
    """Ensure matching completes within 3 seconds"""
    talent = create_test_talent()
    jobs = create_test_jobs(count=100)
    
    start = time.time()
    response = match_talent_to_jobs(talent, jobs)
    duration = time.time() - start
    
    assert duration < 3.0, f"Matching took {duration}s, expected <3s"

@pytest.mark.benchmark
def test_embedding_throughput():
    """Verify embedding generation speed"""
    embedder = TextEmbedder()
    texts = [f"Sample job description {i}" for i in range(1000)]
    
    start = time.time()
    embeddings = embedder.embed_batch(texts)
    duration = time.time() - start
    
    throughput = len(texts) / duration
    assert throughput > 500, f"Only {throughput} embeddings/sec"
```

### Model Quality Tests

**Baseline Performance:**
```python
def test_model_beats_random():
    """Ensure model performs better than random"""
    X_test, y_test = load_test_data()
    
    model = MatchingModel()
    model.load("current_model.pkl")
    
    predictions = model.predict(X_test)
    model_rmse = np.sqrt(mean_squared_error(y_test, predictions))
    
    random_predictions = np.random.uniform(0, 100, len(y_test))
    random_rmse = np.sqrt(mean_squared_error(y_test, random_predictions))
    
    assert model_rmse < random_rmse * 0.7  # At least 30% better

def test_model_consistency():
    """Ensure model gives consistent predictions"""
    model = MatchingModel()
    X = generate_random_features(n_samples=10)
    
    pred1 = model.predict(X)
    pred2 = model.predict(X)
    
    assert np.allclose(pred1, pred2)
```


## Deployment Architecture

### MVP Deployment (Single Container)

**Infrastructure:**
- Single Docker container on cloud VM (AWS EC2, GCP Compute, or DigitalOcean)
- 4GB RAM, 2 vCPU minimum
- 20GB storage for models and logs
- Ubuntu 22.04 LTS

**Docker Configuration:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download pre-trained model
RUN python -c "from sentence_transformers import SentenceTransformer; \
    SentenceTransformer('all-MiniLM-L6-v2')"

# Copy application code
COPY . .

# Create directories
RUN mkdir -p /app/models /app/logs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

**Environment Variables:**
```bash
# .env file
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
MODEL_PATH=/app/models/current_model.pkl
LOG_LEVEL=INFO
WORKERS=2
MAX_BATCH_SIZE=50
CACHE_TTL_SECONDS=3600
```

### Supabase Edge Function Deployment

**Function Structure:**
```typescript
// supabase/functions/ml-matching-gateway/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ML_SERVICE_URL = Deno.env.get('ML_SERVICE_URL')!
const ML_SERVICE_TIMEOUT = 5000 // 5 seconds

serve(async (req) => {
  try {
    // 1. Authenticate request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 })
    }

    // 2. Parse request
    const { type, talent_id, job_id, limit, min_score } = await req.json()

    // 3. Fetch data from Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const data = await fetchMatchingData(supabase, type, talent_id, job_id)

    // 4. Call ML service with timeout
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), ML_SERVICE_TIMEOUT)

      const mlResponse = await fetch(`${ML_SERVICE_URL}/api/v1/match/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (mlResponse.ok) {
        const matches = await mlResponse.json()
        return new Response(JSON.stringify({
          ...matches,
          source: 'ml'
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }
    } catch (error) {
      console.error('ML service error:', error)
      // Fall through to fallback
    }

    // 5. Fallback to rule-based matching
    const fallbackMatches = await ruleBased Matching(data)
    return new Response(JSON.stringify({
      matches: fallbackMatches,
      source: 'fallback'
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Gateway error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

**Deployment Command:**
```bash
supabase functions deploy ml-matching-gateway \
  --project-ref your-project-ref \
  --no-verify-jwt
```


### Monitoring and Observability

**Metrics to Track:**

1. **Performance Metrics:**
   - Request latency (p50, p95, p99)
   - Throughput (requests/second)
   - Model inference time
   - Feature extraction time
   - Embedding generation time

2. **Quality Metrics:**
   - Match score distribution
   - User engagement rate (clicks on matches)
   - Application conversion rate
   - Fallback usage percentage
   - Model prediction confidence

3. **System Health:**
   - CPU and memory usage
   - Error rate by type
   - Cache hit rate
   - Database query time
   - Model version in use

**Logging Strategy:**
```python
import structlog
from datetime import datetime

logger = structlog.get_logger()

class MatchingLogger:
    @staticmethod
    def log_match_request(
        request_id: str,
        type: str,
        talent_id: str = None,
        job_id: str = None
    ):
        logger.info(
            "match_request_received",
            request_id=request_id,
            type=type,
            talent_id=talent_id,
            job_id=job_id,
            timestamp=datetime.utcnow().isoformat()
        )
    
    @staticmethod
    def log_match_response(
        request_id: str,
        num_matches: int,
        processing_time_ms: float,
        source: str
    ):
        logger.info(
            "match_response_sent",
            request_id=request_id,
            num_matches=num_matches,
            processing_time_ms=processing_time_ms,
            source=source,
            timestamp=datetime.utcnow().isoformat()
        )
    
    @staticmethod
    def log_error(
        request_id: str,
        error_type: str,
        error_message: str,
        stack_trace: str = None
    ):
        logger.error(
            "match_error",
            request_id=request_id,
            error_type=error_type,
            error_message=error_message,
            stack_trace=stack_trace,
            timestamp=datetime.utcnow().isoformat()
        )
```

**Prometheus Metrics Endpoint:**
```python
from prometheus_client import Counter, Histogram, Gauge, generate_latest

# Define metrics
match_requests_total = Counter(
    'match_requests_total',
    'Total number of match requests',
    ['type', 'source']
)

match_latency_seconds = Histogram(
    'match_latency_seconds',
    'Match request latency in seconds',
    ['type']
)

active_model_version = Gauge(
    'active_model_version',
    'Currently active model version'
)

@app.get("/metrics")
async def metrics():
    return Response(
        generate_latest(),
        media_type="text/plain"
    )
```

### Scaling Considerations (Future)

**When to Scale:**
- Request latency consistently >3 seconds
- CPU usage >80% sustained
- More than 1000 requests/minute
- Fallback usage >20%

**Scaling Options:**

1. **Vertical Scaling:**
   - Increase VM resources (4GB → 8GB RAM)
   - Add more CPU cores for parallel processing
   - Quick win for moderate growth

2. **Horizontal Scaling:**
   - Deploy multiple ML service instances
   - Add load balancer (nginx or cloud LB)
   - Shared model storage (S3/GCS)
   - Distributed caching (Redis)

3. **Optimization:**
   - Pre-compute embeddings for all profiles
   - Implement request batching
   - Use GPU for embedding generation
   - Cache frequent match requests

**Future Architecture (Scaled):**
```
                    Load Balancer
                         |
        +----------------+----------------+
        |                |                |
   ML Service 1    ML Service 2    ML Service 3
        |                |                |
        +----------------+----------------+
                         |
                   Redis Cache
                         |
                  Supabase DB
```


## Security Considerations

### Authentication and Authorization

**JWT Token Validation:**
```python
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials

security = HTTPBearer()

async def verify_token(
    credentials: HTTPAuthCredentials = Depends(security)
) -> dict:
    """Verify Supabase JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

@app.post("/api/v1/match/talent-to-jobs")
async def match_talent_to_jobs(
    request: TalentToJobsRequest,
    user: dict = Depends(verify_token)
):
    # Verify user has permission to access this talent
    if request.talent.id != user.get('sub'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this talent profile"
        )
    
    # Process request...
```

### Data Privacy

**PII Handling:**
- Never log full names, emails, or contact information
- Anonymize data in training datasets
- Use talent_id/job_id instead of personal identifiers
- Implement data retention policies

**GDPR Compliance:**
```python
class PrivacyManager:
    @staticmethod
    def anonymize_for_training(data: Dict) -> Dict:
        """Remove PII before using in training"""
        sensitive_fields = [
            'email', 'full_name', 'phone', 'address',
            'resume_url', 'portfolio_url'
        ]
        
        anonymized = data.copy()
        for field in sensitive_fields:
            if field in anonymized:
                anonymized[field] = None
        
        return anonymized
    
    @staticmethod
    def handle_deletion_request(user_id: str):
        """Remove all user data from ML systems"""
        # Delete from training data
        # Remove cached embeddings
        # Purge from logs
        pass
```

### Rate Limiting

**Implementation:**
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/v1/match/talent-to-jobs")
@limiter.limit("100/minute")  # 100 requests per minute per IP
async def match_talent_to_jobs(
    request: Request,
    match_request: TalentToJobsRequest
):
    # Process request...
```

### Input Validation

**Sanitization:**
```python
from pydantic import BaseModel, validator, Field
import bleach

class TalentProfile(BaseModel):
    id: str = Field(..., regex=r'^[a-f0-9-]{36}$')
    title: str = Field(..., max_length=200)
    bio: Optional[str] = Field(None, max_length=5000)
    
    @validator('title', 'bio')
    def sanitize_text(cls, v):
        """Remove HTML and dangerous characters"""
        if v is None:
            return v
        return bleach.clean(v, tags=[], strip=True)
    
    @validator('skills')
    def validate_skills(cls, v):
        """Ensure reasonable skill list"""
        if len(v) > 50:
            raise ValueError('Too many skills (max 50)')
        return v
```

### Secrets Management

**Environment Variables:**
```python
from pydantic import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    jwt_secret: str
    model_encryption_key: str
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

# Never log secrets
logger.info("Starting service", supabase_url=settings.supabase_url)
# NOT: logger.info("Key", key=settings.supabase_service_key)
```

## Performance Optimization

### Caching Strategy

**Multi-Level Cache:**
```python
from functools import lru_cache
import redis
import pickle

class CacheManager:
    def __init__(self):
        self.redis_client = redis.Redis(
            host='localhost',
            port=6379,
            decode_responses=False
        )
        self.ttl = 3600  # 1 hour
    
    def get_embedding(self, text: str) -> Optional[np.ndarray]:
        """Get cached embedding"""
        key = f"embedding:{hash(text)}"
        cached = self.redis_client.get(key)
        if cached:
            return pickle.loads(cached)
        return None
    
    def set_embedding(self, text: str, embedding: np.ndarray):
        """Cache embedding"""
        key = f"embedding:{hash(text)}"
        self.redis_client.setex(
            key,
            self.ttl,
            pickle.dumps(embedding)
        )
    
    @lru_cache(maxsize=1000)
    def get_talent_features(self, talent_id: str) -> Optional[np.ndarray]:
        """In-memory cache for frequently accessed talents"""
        # This is automatically cached by lru_cache
        return self._fetch_talent_features(talent_id)
```

### Batch Processing

**Efficient Embedding Generation:**
```python
class BatchEmbedder:
    def __init__(self, batch_size: int = 32):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.batch_size = batch_size
    
    def embed_multiple(
        self, 
        texts: List[str]
    ) -> List[np.ndarray]:
        """Process multiple texts in batches"""
        embeddings = []
        
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i:i + self.batch_size]
            batch_embeddings = self.model.encode(
                batch,
                batch_size=self.batch_size,
                show_progress_bar=False
            )
            embeddings.extend(batch_embeddings)
        
        return embeddings
```

### Database Query Optimization

**Efficient Data Fetching:**
```python
async def fetch_matching_data(
    talent_id: str,
    limit: int = 100
) -> Tuple[TalentProfile, List[JobPosting]]:
    """Fetch all required data in minimal queries"""
    
    # Single query with joins
    query = """
        SELECT 
            t.*,
            ts.skill_id, ts.proficiency_level, ts.years_of_experience,
            s.name as skill_name, s.category as skill_category
        FROM talents t
        LEFT JOIN talent_skills ts ON t.id = ts.talent_id
        LEFT JOIN skills s ON ts.skill_id = s.id
        WHERE t.id = $1
    """
    
    talent_data = await db.fetch_one(query, talent_id)
    
    # Fetch active jobs with skills in one query
    jobs_query = """
        SELECT 
            j.*,
            js.skill_id, js.proficiency_level, js.is_required,
            s.name as skill_name
        FROM jobs j
        LEFT JOIN job_skills js ON j.id = js.job_id
        LEFT JOIN skills s ON js.skill_id = s.id
        WHERE j.status = 'active'
        LIMIT $1
    """
    
    jobs_data = await db.fetch_all(jobs_query, limit)
    
    return parse_talent(talent_data), parse_jobs(jobs_data)
```

## Migration and Rollout Plan

### Phase 1: Infrastructure Setup (Week 1)
- Set up Docker container on cloud VM
- Deploy Supabase Edge Function
- Configure environment variables and secrets
- Set up monitoring and logging

### Phase 2: Initial Model Training (Week 1-2)
- Generate synthetic training data
- Train initial model with rule-based labels
- Validate model performance
- Deploy model to production

### Phase 3: Soft Launch (Week 2-3)
- Enable ML matching for 10% of users (A/B test)
- Monitor performance and user engagement
- Collect feedback data
- Compare ML vs rule-based performance

### Phase 4: Full Rollout (Week 3-4)
- Gradually increase to 50%, then 100% of users
- Continue monitoring and optimization
- First model retrain with real feedback data
- Document learnings and improvements

### Rollback Plan
- Keep rule-based matching as permanent fallback
- Feature flag to disable ML matching instantly
- Ability to revert to previous model version
- Automated alerts for performance degradation

