/**
 * Environment Configuration
 * 
 * SECURITY: All environment variables must be properly set.
 * Never commit actual keys to source control.
 */

const getRequiredEnvVar = (key: string, fallback?: string): string => {
  const value = import.meta.env[key] || fallback;
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    // In production, you might want to throw an error
    // throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
};

export const env = {
  // Supabase URL - required for API communication
  VITE_SUPABASE_URL: getRequiredEnvVar('VITE_SUPABASE_URL'),

  // Supabase Anon Key - required for client-side auth
  // This is a public key but should still be set via environment variables
  VITE_SUPABASE_ANON_KEY: getRequiredEnvVar('VITE_SUPABASE_ANON_KEY'),

  // Check if we're in development mode
  isDevelopment: import.meta.env.DEV || false,

  // Check if we're in production mode
  isProduction: import.meta.env.PROD || false,
}; 
