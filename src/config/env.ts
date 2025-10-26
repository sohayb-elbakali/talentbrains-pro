// Environment configuration for local development
export const env = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Y3dtdXFjeHFuZ2ltaXVlc3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTExNzIsImV4cCI6MjA2NjM2NzE3Mn0.0na5oVkgRBnRnJzinCbhF-Nzn66cLXLM0sLHHIVZ9hE'
} 
