# TalentBrains Matching API

Fast backend built with FastAPI for matching talents to jobs based on:
- Skills (required & preferred)
- Years of experience & experience level
- Location & remote preferences
- Salary expectations

## Setup

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

3. **Run the server:**
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Health Check
- `GET /` - API status
- `GET /health` - Health check

### Matching Endpoints

#### Match Talent to Jobs
```
POST /api/matching/talent/{talent_id}/jobs?limit=10
```
Returns top matching jobs for a talent profile.

#### Match Job to Talents
```
POST /api/matching/job/{job_id}/talents?limit=10
```
Returns top matching talents for a job posting.

#### Specific Match Score
```
GET /api/matching/talent/{talent_id}/job/{job_id}
```
Calculate match score between specific talent and job.

#### Statistics
```
GET /api/matching/stats
```
Get matching system statistics.

## Matching Algorithm

The matching score (0-100) is calculated using weighted factors:

- **Skills (40%)**: Required skills match + preferred skills match
- **Experience (30%)**: Years of experience + experience level match
- **Location (20%)**: City match + remote work compatibility
- **Salary (10%)**: Salary range overlap

### Skill Matching
- Required skills: 70% weight
- Preferred skills: 30% weight
- Case-insensitive matching

### Experience Matching
- Level match (entry/mid/senior/lead): 60% weight
- Years of experience: 40% weight
- Penalties for over/under qualification

### Location Matching
- Remote + Remote: 100%
- Same city: 100%
- Similar city: 80%
- Different locations: 30%

### Salary Matching
- Overlap in ranges: Higher score
- No overlap: Lower score based on gap
- Missing data: Neutral (50%)

## Response Format

```json
{
  "talent_id": "uuid",
  "job_id": "uuid",
  "match_score": 85.5,
  "skill_match_score": 90.0,
  "experience_match_score": 85.0,
  "location_match_score": 80.0,
  "salary_match_score": 75.0,
  "matched_skills": ["Python", "FastAPI", "PostgreSQL"],
  "missing_skills": ["Docker"],
  "reason": "Strong skill match (3 skills) • Experience level matches well • Location compatible"
}
```

## Testing

Test the API using curl:

```bash
# Match talent to jobs
curl -X POST "http://localhost:8000/api/matching/talent/{talent_id}/jobs?limit=5"

# Match job to talents
curl -X POST "http://localhost:8000/api/matching/job/{job_id}/talents?limit=5"

# Get specific match
curl "http://localhost:8000/api/matching/talent/{talent_id}/job/{job_id}"

# Get stats
curl "http://localhost:8000/api/matching/stats"
```

## Interactive API Docs

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Future Enhancements

- CV/Resume OCR extraction
- Advanced ML-based matching
- Semantic skill matching
- Historical match success tracking
- Candidate preferences learning
