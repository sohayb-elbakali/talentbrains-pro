import { useQuery, useMutation } from '@tanstack/react-query';
import { matchingService, MatchResult, MatchingStats } from '../services/matchingService';

/**
 * Hook to match a talent to jobs
 */
export const useMatchTalentToJobs = (talentId: string, limit: number = 10) => {
  return useQuery<MatchResult[], Error>({
    queryKey: ['matchTalentToJobs', talentId, limit],
    queryFn: () => matchingService.matchTalentToJobs(talentId, limit),
    enabled: !!talentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to match a job to talents
 */
export const useMatchJobToTalents = (jobId: string, limit: number = 10) => {
  return useQuery<MatchResult[], Error>({
    queryKey: ['matchJobToTalents', jobId, limit],
    queryFn: () => matchingService.matchJobToTalents(jobId, limit),
    enabled: !!jobId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get specific match score
 */
export const useSpecificMatch = (talentId: string, jobId: string) => {
  return useQuery<MatchResult, Error>({
    queryKey: ['specificMatch', talentId, jobId],
    queryFn: () => matchingService.getSpecificMatch(talentId, jobId),
    enabled: !!talentId && !!jobId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to get matching statistics
 */
export const useMatchingStats = () => {
  return useQuery<MatchingStats, Error>({
    queryKey: ['matchingStats'],
    queryFn: () => matchingService.getStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Mutation hook for triggering talent matching
 */
export const useTriggerTalentMatching = () => {
  return useMutation({
    mutationFn: ({ talentId, limit }: { talentId: string; limit?: number }) =>
      matchingService.matchTalentToJobs(talentId, limit),
  });
};

/**
 * Mutation hook for triggering job matching
 */
export const useTriggerJobMatching = () => {
  return useMutation({
    mutationFn: ({ jobId, limit }: { jobId: string; limit?: number }) =>
      matchingService.matchJobToTalents(jobId, limit),
  });
};
