import axios from 'axios';

const MATCHING_API_URL = import.meta.env.VITE_MATCHING_API_URL || 'http://localhost:8000/api/matching';

export interface MatchResult {
  talent_id?: string;
  job_id?: string;
  match_score: number;
  skill_match_score: number;
  experience_match_score: number;
  location_match_score: number;
  salary_match_score?: number;
  matched_skills: string[];
  missing_skills: string[];
  reason: string;
}

export interface MatchingStats {
  total_talents: number;
  total_jobs: number;
  status: string;
}

class MatchingService {
  /**
   * Match a talent to available jobs
   */
  async matchTalentToJobs(talentId: string, limit: number = 10): Promise<MatchResult[]> {
    try {
      const response = await axios.post(
        `${MATCHING_API_URL}/talent/${talentId}/jobs`,
        null,
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      console.error('Error matching talent to jobs:', error);
      throw error;
    }
  }

  /**
   * Match a job to available talents
   */
  async matchJobToTalents(jobId: string, limit: number = 10): Promise<MatchResult[]> {
    try {
      const response = await axios.post(
        `${MATCHING_API_URL}/job/${jobId}/talents`,
        null,
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      console.error('Error matching job to talents:', error);
      throw error;
    }
  }

  /**
   * Get specific match score between talent and job
   */
  async getSpecificMatch(talentId: string, jobId: string): Promise<MatchResult> {
    try {
      const response = await axios.get(
        `${MATCHING_API_URL}/talent/${talentId}/job/${jobId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting specific match:', error);
      throw error;
    }
  }

  /**
   * Get matching system statistics
   */
  async getStats(): Promise<MatchingStats> {
    try {
      const response = await axios.get(`${MATCHING_API_URL}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error getting matching stats:', error);
      throw error;
    }
  }
}

export const matchingService = new MatchingService();
