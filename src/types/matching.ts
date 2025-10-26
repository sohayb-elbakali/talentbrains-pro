export interface MatchResult {
  id: number;
  name: string;
  role: string;
  company: string;
  matchScore: number;
  skills: string[];
  experience: string;
  salary: string;
  reason: string;
}

export interface MatchingState {
  matchingProgress: number;
  isMatching: boolean;
  matchResults: MatchResult[];
} 
