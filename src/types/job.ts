export interface Job {
  id: number;
  title: string;
  company: string;
  employees: string;
  description: string;
  location: string;
  type: string;
  salary: string;
  postedTime: string;
  skills: string[];
  matchScore: number;
}

export interface JobFilter {
  id: string;
  label: string;
} 
