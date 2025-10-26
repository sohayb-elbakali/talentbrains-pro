import { createClient } from "@supabase/supabase-js";
import { env } from "../../config/env";
import type { Database } from "../../types/database";

let globalAuthErrorHandler: ((error: any) => Promise<void>) | null = null;

export const setGlobalAuthErrorHandler = (
  handler: (error: any) => Promise<void>
) => {
  globalAuthErrorHandler = handler;
};

const isAuthError = (error: any): boolean => {
  if (!error) return false;

  const errorMessage = error.message?.toLowerCase() || "";
  const errorCode = error.code || "";

  return (
    errorCode === "401" ||
    errorCode === "406" ||
    errorCode === "PGRST301" ||
    errorMessage.includes("jwt") ||
    errorMessage.includes("token") ||
    errorMessage.includes("unauthorized") ||
    errorMessage.includes("authentication") ||
    errorMessage.includes("session") ||
    errorMessage.includes("expired")
  );
};

export const handleApiCall = async <T>(
  apiCall: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  try {
    const result = await apiCall();

    if (result.error && isAuthError(result.error)) {
      if (globalAuthErrorHandler) {
        await globalAuthErrorHandler(result.error);
      }
    }

    return result;
  } catch (error) {
    if (isAuthError(error) && globalAuthErrorHandler) {
      await globalAuthErrorHandler(error);
    }

    return {
      data: null,
      error: error || { message: "Unknown error occurred" },
    };
  }
};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

const globalForSupabase = globalThis as unknown as {
  supabase: any;
  supabaseInitialized: boolean;
};

let supabase: any = null;

if (!globalForSupabase.supabase || !globalForSupabase.supabaseInitialized) {
  globalForSupabase.supabase = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        debug: false,
        storageKey: 'sb-mucwmuqcxqngimiueszx-auth-token',
      },
      global: {
        headers: {
          "X-Client-Info": "talentbrains-web-app",
        },
      },
    }
  );

  globalForSupabase.supabaseInitialized = true;
}

supabase = globalForSupabase.supabase;

export { supabase };
export default supabase;
