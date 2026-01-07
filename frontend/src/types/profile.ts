export interface Profile {
  id: number;
  name: string;
  tagline: string;
  location: string;
  rate: string;
  skills: string[];
  about: string;
  avatar?: string;
  experience?: string;
  education?: string[];
  certifications?: string[];
} 
