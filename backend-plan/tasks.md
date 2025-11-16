# ML Backend Implementation Plan - REVISED

## Overview
This revised plan focuses on a pragmatic, incremental approach that delivers value quickly while maintaining flexibility for future improvements. The plan is organized into 3 phases: Foundation (Weeks 1-2), Core ML (Weeks 3-4), and Enhancement (Weeks 5-6).

## Phase 1: Foundation & Infrastructure (Weeks 1-2)

### 1. Set up ML Backend Service project structure
  - Create Python project with FastAPI, initialize virtual environment
  - Set up directory structure: `/app`, `/models`, `/tests`, `/scripts`
  - Create `requirements.txt` with core dependencies: fastapi, uvicorn, sentence-transformers, lightgbm, shap, pydantic, sqlalchemy, python-jose
  - Create Dockerfile for containerized deployment
  - Set up `.env.example` with required environment variables
  - _Requirements: 5.1, 5.3_

- [ ] 2. Implement data models and validation
  - [ ] 2.1 Create Pydantic models for API requests and responses
    - Define `TalentProfile`, `JobPosting`, `SkillData` models matching Supabase schema
    - Define `TalentToJobsRequest`, `JobToTalentsRequest` with validation
    - Define `MatchResponse`, `MatchResult`, `MatchExplanation` response models
    - Add input sanitization validators for text fields
    - _Requirements: 1.1, 2.1, 4.4_

  - [ ] 2.2 Create database models for Supabase integration
    - Define SQLAlchemy models for read-only access to talents, jobs, skills tables
    - Create models for new tables: `match_feedback`, `ml_model_versions`
    - Write database connection utility with connection pooling
    - _Requirements: 3.1, 4.2_

- [ ] 3. Build Feature Extractor component
  - [ ] 3.1 Implement skill-based feature extraction
    - Calculate skill overlap (Jaccard similarity)
    - Calculate proficiency alignment for matching skills
    - Calculate required skills coverage percentage
    - Calculate weighted skill score based on years of experience
    - _Requirements: 1.2, 1.5, 6.5_

  - [ ] 3.2 Implement experience-based feature extraction
    - Calculate experience level match (binary and ordinal distance)
    - Calculate years of experience ratio
    - Calculate seniority alignment score
    - Add overqualified/underqualified penalty features
    - _Requirements: 1.2, 2.2_

  - [ ] 3.3 Implement location and compensation features
    - Calculate geographic distance using Haversine formula
    - Calculate remote work compatibility score
    - Calculate timezone overlap hours
    - Calculate salary overlap (intersection over union)
    - Calculate salary expectation ratio
    - _Requirements: 1.2, 2.2_

  - [ ] 3.4 Create FeatureExtractor class with batch processing
    - Implement `extract_features(talent, job)` method returning feature vector
    - Add batch processing for multiple talent-job pairs
    - Add feature normalization and scaling
    - Document all features with names and descriptions
    - _Requirements: 1.5, 2.4_


- [ ] 4. Implement Text Embedder component
  - [ ] 4.1 Create TextEmbedder class with sentence-transformers
    - Initialize `all-MiniLM-L6-v2` model
    - Implement `embed_talent(talent)` method for talent profile text
    - Implement `embed_job(job)` method for job posting text
    - Implement `compute_similarity(embedding1, embedding2)` for cosine similarity
    - _Requirements: 1.5, 5.1_

  - [ ] 4.2 Add caching and batch processing
    - Implement in-memory LRU cache for frequently accessed embeddings
    - Add batch embedding method for processing multiple texts efficiently
    - Add cache warming for active jobs on service startup
    - _Requirements: 2.4_

- [ ] 5. Build initial ML model with synthetic data
  - [ ] 5.1 Create synthetic data generator
    - Generate 1000+ synthetic talent profiles with realistic distributions
    - Generate 200+ synthetic job postings across various roles
    - Create talent-job pairs with rule-based match scores as labels
    - Split data into training (80%) and validation (20%) sets
    - _Requirements: 5.2, 5.5_

  - [ ] 5.2 Implement MatchingModel class with LightGBM
    - Create `MatchingModel` class wrapping LightGBM regressor
    - Implement `train(X, y)` method with validation and early stopping
    - Implement `predict(X)` method returning scores 0-100
    - Implement `get_feature_importance()` for explainability
    - Add model serialization (save/load) functionality
    - _Requirements: 5.2, 6.2_

  - [ ] 5.3 Train and validate initial model
    - Extract features from synthetic data using FeatureExtractor
    - Train LightGBM model with hyperparameters from design
    - Validate model performance (RMSE, MAE) on validation set
    - Save trained model to `/models/initial_model.pkl`
    - _Requirements: 5.2, 5.5_

- [ ] 6. Implement Match Explainer with SHAP
  - [ ] 6.1 Create MatchExplainer class
    - Initialize SHAP TreeExplainer with trained model
    - Implement `explain_match(features, feature_names)` method
    - Calculate SHAP values for feature attribution
    - Group features into categories (skills, experience, location, salary, culture)
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [ ] 6.2 Generate human-readable explanations
    - Map feature contributions to human-readable descriptions
    - Extract top 3 contributing factors with scores
    - Calculate sub-scores for each category (0-100 scale)
    - Format explanation as `MatchExplanation` Pydantic model
    - _Requirements: 6.1, 6.3, 6.4_

- [ ] 7. Create core matching API endpoints
  - [ ] 7.1 Implement talent-to-jobs matching endpoint
    - Create POST `/api/v1/match/talent-to-jobs` endpoint
    - Extract features for all talent-job pairs
    - Generate embeddings and calculate similarities
    - Predict match scores using trained model
    - Generate explanations for each match
    - Sort results by score and apply limit/min_score filters
    - Return `MatchResponse` with matches and processing time
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1_

  - [ ] 7.2 Implement job-to-talents matching endpoint
    - Create POST `/api/v1/match/job-to-talents` endpoint
    - Implement same logic as talent-to-jobs but reversed perspective
    - Ensure bidirectional compatibility as specified in requirements
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 7.3 Add health check and metrics endpoints
    - Create GET `/api/v1/health` endpoint returning service status
    - Include model version, last trained timestamp, uptime
    - Create GET `/metrics` endpoint with Prometheus format
    - Track request counts, latency histograms, error rates
    - _Requirements: 7.1, 7.5_


- [ ] 8. Implement authentication and security
  - [ ] 8.1 Add JWT token validation
    - Create `verify_token()` dependency using python-jose
    - Validate Supabase JWT tokens with proper secret
    - Extract user context from token payload
    - Add authentication to all protected endpoints
    - _Requirements: 4.2_

  - [ ] 8.2 Implement authorization checks
    - Verify user has permission to access requested talent/job data
    - Add role-based access control for admin endpoints
    - Return 403 Forbidden for unauthorized access attempts
    - _Requirements: 4.2_

  - [ ] 8.3 Add rate limiting and input validation
    - Implement rate limiting using slowapi (100 requests/minute per IP)
    - Add input sanitization in Pydantic validators
    - Validate UUID formats, text length limits, array sizes
    - _Requirements: 7.4_

- [ ] 9. Build Training Pipeline
  - [ ] 9.1 Implement feedback data collection
    - Create SQL queries to fetch positive feedback (applications, interested matches)
    - Create SQL queries to fetch negative feedback (dismissed, rejected)
    - Implement data enrichment to fetch full talent and job profiles
    - Convert feedback to training labels (0-100 scores)
    - _Requirements: 3.1, 3.2_

  - [ ] 9.2 Create TrainingPipeline class
    - Implement `run_training(force)` method for full pipeline
    - Check if training is needed (weekly schedule or forced)
    - Collect and validate feedback data (minimum 100 samples)
    - Extract features from enriched feedback data
    - Train new model and validate performance
    - Save model with version metadata if performance is acceptable
    - _Requirements: 3.3, 3.4, 3.5, 5.5_

  - [ ] 9.3 Add training trigger endpoint
    - Create POST `/api/v1/train/trigger` endpoint (admin only)
    - Accept `force` parameter to override schedule check
    - Run training pipeline asynchronously
    - Return training status and metrics
    - Log training events to Supabase
    - _Requirements: 3.3, 5.5_

- [ ] 10. Implement error handling and fallback logic
  - [ ] 10.1 Create error handling decorators and middleware
    - Define custom exception classes (ModelLoadError, FeatureExtractionError)
    - Create `handle_ml_errors` decorator for consistent error handling
    - Add global exception handler for FastAPI
    - Log all errors with context to structured logs
    - _Requirements: 7.3_

  - [ ] 10.2 Implement FallbackMatcher for rule-based matching
    - Create `FallbackMatcher` class with simple weighted scoring
    - Implement skill match calculation (Jaccard similarity)
    - Implement experience, location, and salary match calculations
    - Return matches in same format as ML matcher
    - _Requirements: 4.3_

  - [ ] 10.3 Add graceful degradation
    - Handle model loading failures by using previous version
    - Return appropriate HTTP status codes for different error types
    - Ensure service remains available even with ML failures
    - _Requirements: 4.3, 7.3_


- [ ] 11. Add monitoring and logging
  - [ ] 11.1 Set up structured logging
    - Configure structlog for JSON-formatted logs
    - Create `MatchingLogger` class with standard log methods
    - Log all match requests with request_id, type, and parameters
    - Log all match responses with processing time and result count
    - Log all errors with stack traces and context
    - _Requirements: 4.5, 7.2, 7.3_

  - [ ] 11.2 Implement Prometheus metrics
    - Add prometheus_client dependency
    - Create metrics: request counter, latency histogram, active model gauge
    - Instrument all endpoints with metrics collection
    - Expose metrics at GET `/metrics` endpoint
    - _Requirements: 7.5_

  - [ ] 11.3 Add performance tracking
    - Track feature extraction time, embedding time, prediction time separately
    - Log slow requests (>3 seconds) with detailed breakdown
    - Track cache hit rates for embeddings
    - Monitor fallback usage percentage
    - _Requirements: 1.1, 2.1, 7.2_

- [ ] 12. Create Supabase Edge Function gateway
  - [ ] 12.1 Implement ml-matching-gateway Edge Function
    - Create TypeScript Edge Function in `supabase/functions/ml-matching-gateway/`
    - Parse and validate incoming requests
    - Authenticate requests using Supabase auth headers
    - Fetch talent/job data from PostgreSQL with necessary joins
    - _Requirements: 4.1, 4.2_

  - [ ] 12.2 Add ML service integration with timeout
    - Call ML Backend Service with 5-second timeout
    - Handle successful responses and parse results
    - Handle timeout and connection errors gracefully
    - Log all ML service calls and responses
    - _Requirements: 4.1, 4.3_

  - [ ] 12.3 Implement fallback logic in Edge Function
    - Detect ML service failures (timeout, error response)
    - Fall back to rule-based matching algorithm
    - Implement simple weighted scoring in TypeScript
    - Return results with `source: 'fallback'` indicator
    - Log fallback events for monitoring
    - _Requirements: 4.3_

  - [ ] 12.4 Add response caching
    - Implement caching for frequent match requests
    - Set appropriate TTL (1 hour for match results)
    - Cache key based on request parameters
    - Return cached results when available
    - _Requirements: 4.1_

- [ ] 13. Set up database schema extensions
  - [ ] 13.1 Create migration for match_feedback table
    - Write SQL migration to create `match_feedback` table
    - Add indexes on talent_id, job_id, created_at
    - Add unique constraint on (talent_id, job_id, feedback_type)
    - _Requirements: 3.1, 3.2_

  - [ ] 13.2 Create migration for ml_model_versions table
    - Write SQL migration to create `ml_model_versions` table
    - Add index on is_active for quick lookup
    - Add version uniqueness constraint
    - _Requirements: 3.4, 3.5_

  - [ ] 13.3 Update matches table schema
    - Add columns: ml_score, ml_version, explanation (JSONB), source
    - Create migration to alter existing matches table
    - Update existing rows with default values
    - _Requirements: 1.3, 6.1_


- [ ] 14. Update frontend to use ML matching
  - [ ] 14.1 Create ML matching service client
    - Create `src/services/mlMatchingService.ts` with API client
    - Implement `getTalentMatches(talentId, limit)` function
    - Implement `getJobMatches(jobId, limit)` function
    - Handle API errors and fallback gracefully
    - _Requirements: 1.1, 2.1_

  - [ ] 14.2 Update TalentDashboard to display ML matches
    - Fetch ML-powered job matches on dashboard load
    - Display match scores with visual indicators (progress bars, badges)
    - Show "Highly Recommended" badge for scores >80
    - Display top 3 matching factors for each job
    - Show sub-scores breakdown (skills, experience, location, salary, culture)
    - _Requirements: 1.3, 1.4, 6.1, 6.5_

  - [ ] 14.3 Update CompanyDashboard to display ML matches
    - Fetch ML-powered talent matches for company's jobs
    - Display match scores and explanations for each candidate
    - Show top matching factors to help companies understand fit
    - Add sorting and filtering by match score
    - _Requirements: 2.2, 2.3, 2.5_

  - [ ] 14.4 Add feedback capture for ML improvement
    - Track when talent applies to a job (positive feedback)
    - Track when talent dismisses a recommendation (negative feedback)
    - Track when company contacts a talent (positive feedback)
    - Track when company rejects an applicant (negative feedback)
    - Send feedback to Supabase for training pipeline
    - _Requirements: 3.1, 3.2_

- [ ] 15. Create Docker deployment configuration
  - [ ] 15.1 Write production Dockerfile
    - Use Python 3.11-slim base image
    - Install system dependencies
    - Copy requirements and install Python packages
    - Pre-download sentence-transformers model
    - Copy application code and create necessary directories
    - Set up health check command
    - Configure uvicorn with 2 workers
    - _Requirements: 5.3, 5.4_

  - [ ] 15.2 Create docker-compose for local development
    - Define ML service container with volume mounts
    - Add environment variables from .env file
    - Expose port 8000 for API access
    - Add restart policy for reliability
    - _Requirements: 5.3_

  - [ ] 15.3 Write deployment documentation
    - Document environment variables required
    - Provide deployment commands for cloud providers (AWS, GCP, DigitalOcean)
    - Document how to build and push Docker image
    - Include troubleshooting guide for common issues
    - _Requirements: 5.3, 5.4_

- [ ] 16. Deploy and configure Supabase Edge Function
  - [ ] 16.1 Deploy ml-matching-gateway function
    - Test Edge Function locally with Supabase CLI
    - Deploy to Supabase project using `supabase functions deploy`
    - Set environment variables (ML_SERVICE_URL, timeouts)
    - Test deployed function with sample requests
    - _Requirements: 4.1_

  - [ ] 16.2 Configure function secrets
    - Set SUPABASE_SERVICE_ROLE_KEY for database access
    - Set ML_SERVICE_URL pointing to deployed ML backend
    - Configure timeout and retry settings
    - _Requirements: 4.1, 4.2_


- [ ]* 17. Write tests for ML components
  - [ ]* 17.1 Write unit tests for FeatureExtractor
    - Test skill overlap calculation with various skill sets
    - Test experience level matching with different levels
    - Test location distance calculation
    - Test salary overlap calculation
    - Test edge cases (empty skills, missing data)
    - _Requirements: 1.2, 1.5_

  - [ ]* 17.2 Write unit tests for TextEmbedder
    - Test embedding generation for sample texts
    - Test similarity calculation between embeddings
    - Test caching functionality
    - Test batch processing
    - _Requirements: 1.5_

  - [ ]* 17.3 Write unit tests for MatchingModel
    - Test prediction output range (0-100)
    - Test feature importance extraction
    - Test model save/load functionality
    - Test consistency of predictions
    - _Requirements: 5.2_

  - [ ]* 17.4 Write integration tests for API endpoints
    - Test talent-to-jobs endpoint with sample data
    - Test job-to-talents endpoint with sample data
    - Test authentication and authorization
    - Test rate limiting
    - Test error handling and fallback logic
    - _Requirements: 1.1, 2.1, 4.2, 4.3_

  - [ ]* 17.5 Write performance tests
    - Test matching latency with 100 jobs (<3 seconds)
    - Test embedding throughput (>500 embeddings/sec)
    - Test concurrent request handling
    - _Requirements: 1.1, 2.1, 2.4_

- [ ] 18. Perform initial model training and validation
  - [ ] 18.1 Generate comprehensive synthetic dataset
    - Create 1500 diverse talent profiles across various roles and experience levels
    - Create 300 job postings across different industries and requirements
    - Generate 5000+ talent-job pairs with realistic match distributions
    - Validate data quality and distributions
    - _Requirements: 5.2, 5.5_

  - [ ] 18.2 Train production-ready initial model
    - Extract features from all synthetic pairs
    - Train LightGBM model with cross-validation
    - Tune hyperparameters for optimal performance
    - Validate model beats random baseline by >30%
    - Save model with version metadata
    - _Requirements: 5.2, 5.5_

  - [ ] 18.3 Validate model explainability
    - Generate SHAP explanations for sample matches
    - Verify explanations are human-readable and accurate
    - Test that top factors align with actual feature contributions
    - Validate sub-scores sum correctly
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 19. Deploy ML Backend Service to production
  - [ ] 19.1 Set up cloud infrastructure
    - Provision VM instance (4GB RAM, 2 vCPU) on chosen cloud provider
    - Configure security groups and firewall rules
    - Set up SSL certificate for HTTPS
    - Configure domain/subdomain for ML service
    - _Requirements: 5.3, 5.4_

  - [ ] 19.2 Deploy Docker container
    - Build Docker image with production configuration
    - Push image to container registry
    - Pull and run container on production VM
    - Verify health check endpoint responds
    - Test API endpoints with sample requests
    - _Requirements: 5.3, 5.4_

  - [ ] 19.3 Configure monitoring and alerts
    - Set up log aggregation (CloudWatch, Stackdriver, or similar)
    - Configure Prometheus scraping of metrics endpoint
    - Set up alerts for high error rates, slow responses, service downtime
    - Create dashboard for key metrics
    - _Requirements: 7.2, 7.3, 7.5_

- [ ] 20. Integrate and test end-to-end flow
  - [ ] 20.1 Test complete matching flow
    - Create test talent and job in Supabase
    - Trigger match request from frontend
    - Verify request flows through Edge Function to ML service
    - Verify match results display correctly with scores and explanations
    - Test fallback when ML service is stopped
    - _Requirements: 1.1, 1.3, 1.4, 2.1, 2.2, 4.3_

  - [ ] 20.2 Test feedback collection
    - Apply to a job and verify feedback is recorded
    - Dismiss a recommendation and verify negative feedback
    - Check match_feedback table has correct entries
    - _Requirements: 3.1, 3.2_

  - [ ] 20.3 Test training pipeline with real data
    - Trigger manual training via API endpoint
    - Verify training collects feedback data
    - Verify new model is trained and saved
    - Verify model version is updated
    - Test that new model is used for subsequent predictions
    - _Requirements: 3.3, 3.4, 3.5_
