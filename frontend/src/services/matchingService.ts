import axios, { AxiosError } from 'axios';
import { supabase } from '../lib/supabase/client';

const MATCHING_API_URL = import.meta.env.VITE_MATCHING_API_URL || 'http://localhost:8000/api/v1/matching';

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

/**
 * Get the current user's access token for authenticated API requests.
 * 
 * @returns The access token or null if not authenticated
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Create axios instance with authentication headers.
 */
async function createAuthenticatedRequest() {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required. Please log in.');
  }

  return axios.create({
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
  });
}

/**
 * Handle API errors with user-friendly messages.
 */
function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>;

    if (axiosError.response?.status === 401) {
      throw new Error('Authentication expired. Please log in again.');
    }

    if (axiosError.response?.status === 403) {
      throw new Error('You do not have permission to perform this action.');
    }

    if (axiosError.response?.status === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }

    if (axiosError.response?.status === 404) {
      throw new Error('Resource not found.');
    }

    if (axiosError.response?.data?.detail) {
      throw new Error(axiosError.response.data.detail);
    }

    throw new Error('An error occurred while connecting to the matching service.');
  }

  throw error;
}

class MatchingService {
  /**
   * Match a talent to available jobs.
   * Requires authentication.
   */
  async matchTalentToJobs(talentId: string, limit: number = 10): Promise<MatchResult[]> {
    if (!talentId || talentId.length < 20) {
      throw new Error('Invalid talent ID');
    }

    try {
      const client = await createAuthenticatedRequest();
      const response = await client.post(
        `${MATCHING_API_URL}/talent/${encodeURIComponent(talentId)}/jobs`,
        null,
        { params: { limit: Math.min(Math.max(1, limit), 100) } }
      );
      return response.data;
    } catch (error) {
      console.error('Error matching talent to jobs:', error);
      handleApiError(error);
    }
  }

  /**
   * Match a job to available talents.
   * Requires authentication.
   */
  async matchJobToTalents(jobId: string, limit: number = 10): Promise<MatchResult[]> {
    if (!jobId || jobId.length < 20) {
      throw new Error('Invalid job ID');
    }

    try {
      const client = await createAuthenticatedRequest();
      const response = await client.post(
        `${MATCHING_API_URL}/job/${encodeURIComponent(jobId)}/talents`,
        null,
        { params: { limit: Math.min(Math.max(1, limit), 100) } }
      );
      return response.data;
    } catch (error) {
      console.error('Error matching job to talents:', error);
      handleApiError(error);
    }
  }

  /**
   * Get specific match score between talent and job.
   * Requires authentication.
   */
  async getSpecificMatch(talentId: string, jobId: string): Promise<MatchResult> {
    if (!talentId || talentId.length < 20) {
      throw new Error('Invalid talent ID');
    }
    if (!jobId || jobId.length < 20) {
      throw new Error('Invalid job ID');
    }

    try {
      const client = await createAuthenticatedRequest();
      const response = await client.get(
        `${MATCHING_API_URL}/talent/${encodeURIComponent(talentId)}/job/${encodeURIComponent(jobId)}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting specific match:', error);
      handleApiError(error);
    }
  }

  /**
   * Get matching system statistics.
   * Does not require authentication.
   */
  async getStats(): Promise<MatchingStats> {
    try {
      // Stats endpoint may not require auth, but include token if available
      const token = await getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.get(`${MATCHING_API_URL}/stats`, {
        headers,
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      console.error('Error getting matching stats:', error);
      handleApiError(error);
    }
  }
}

export const matchingService = new MatchingService();
