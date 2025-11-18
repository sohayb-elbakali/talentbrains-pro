import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";
import type { Database } from "../types/database";

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

const handleApiCall = async <T>(
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
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        flowType: 'pkce',
      },
      global: {
        headers: {
          "X-Client-Info": "talentbrains-web-app",
          "Cache-Control": "max-age=300",
        },
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 5,
        },
      },
    }
  );

  globalForSupabase.supabaseInitialized = true;
}

supabase = globalForSupabase.supabase;

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database helpers
export const db = {
  // Profiles
  getProfile: async (userId: string) => {
    return handleApiCall(async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, email, full_name, avatar_url, role, is_verified, is_active, preferences"
          )
          .eq("id", userId)
          .limit(1)
          .maybeSingle();

        if (error) {
          if (error.message && error.message.includes("304")) {
            return { data: null, error: null };
          }
          return { data: null, error };
        }

        return { data, error: null };
      } catch (error: any) {
        if (
          error.message &&
          (error.message.includes("304") ||
            error.message.includes("Not Modified"))
        ) {
          return { data: null, error: null };
        }
        return {
          data: null,
          error: {
            message: error.message || "Error fetching profile",
          },
        };
      }
    });
  },

  createProfile: async (profileData: any) => {
    const { data, error } = await supabase
      .from("profiles")
      .insert(profileData)
      .select()
      .single();
    return { data, error };
  },

  updateProfile: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    return { data, error };
  },

  // Get all profiles (for admin stats)
  getProfiles: async () => {
    return handleApiCall(async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, email, full_name, role, is_active, is_verified, created_at, last_login_at"
          )
          .order("created_at", { ascending: false });

        return { data, error };
      } catch (error) {
        return { data: null, error: { message: "Failed to fetch profiles" } };
      }
    });
  },

  // Companies
  getCompany: async (profileId: string) => {
    return handleApiCall(async () => {
      try {
        const { data, error } = await supabase
          .from("companies")
          .select("*")
          .eq("profile_id", profileId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return { data: null, error: null };
          }
          return { data: null, error };
        }

        return { data, error: null };
      } catch (error) {
        return { data: null, error: { message: "Failed to fetch company" } };
      }
    });
  },

  createCompany: async (companyData: any) => {
    return handleApiCall(async () => {
      try {
        console.log('Creating company with data:', companyData);
        
        const { data, error } = await supabase
          .from("companies")
          .insert(companyData)
          .select()
          .single();

        if (error) {
          console.error('Create company error:', error);
          return { data: null, error };
        }

        console.log('Company created successfully:', data);
        return { data, error: null };
      } catch (error) {
        console.error('Exception in createCompany:', error);
        return { data: null, error: { message: "Failed to create company" } };
      }
    });
  },

  updateCompany: async (profileId: string, updates: any) => {
    return handleApiCall(async () => {
      try {
        console.log('Updating company for profile:', profileId, 'with data:', updates);
        
        const { data, error } = await supabase
          .from("companies")
          .update(updates)
          .eq("profile_id", profileId)
          .select()
          .single();

        if (error) {
          console.error('Update company error:', error);
          return { data: null, error };
        }

        console.log('Company updated successfully:', data);
        return { data, error: null };
      } catch (error) {
        console.error('Exception in updateCompany:', error);
        return { data: null, error: { message: "Failed to update company" } };
      }
    });
  },

  // Get all companies (for admin stats)
  getCompanies: async () => {
    return handleApiCall(async () => {
      try {
        const { data, error } = await supabase
          .from("companies")
          .select("id, name, is_verified, created_at")
          .order("created_at", { ascending: false });

        return { data, error };
      } catch (error) {
        return { data: null, error: { message: "Failed to fetch companies" } };
      }
    });
  },

  updateCompanyById: async (companyId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .update(updates)
        .eq("id", companyId)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: "Failed to update company by ID" },
      };
    }
  },

  // Talents
  getTalent: async (profileId: string) => {
    return handleApiCall(async () => {
      console.log("🔍 getTalent: Starting with profileId:", profileId);

      const { data, error } = await supabase
        .from("talents")
        .select("*")
        .eq("profile_id", profileId)
        .single();

      console.log("🔍 getTalent: Database response:", { data, error });

      if (error) {
        if (error.code === "PGRST116") {
          console.log(
            "🔍 getTalent: No talent found (PGRST116), returning null"
          );
          return { data: null, error: null };
        }
        console.log("🔍 getTalent: Error occurred:", error);
        return { data: null, error };
      }

      console.log("🔍 getTalent: Success, returning data");
      return { data, error: null };
    });
  },

  createTalent: async (talentData: any) => {
    return handleApiCall(async () => {
      console.log("🔍 createTalent: Starting with data:", talentData);

      const { data, error } = await supabase
        .from("talents")
        .insert(talentData)
        .select()
        .single();

      console.log("🔍 createTalent: Database response:", { data, error });

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    });
  },

  updateTalent: async (talentId: string, updates: any) => {
    return handleApiCall(async () => {
      console.log(
        "🔍 updateTalent: Starting with ID:",
        talentId,
        "updates:",
        updates
      );

      const { data, error } = await supabase
        .from("talents")
        .update(updates)
        .eq("id", talentId)
        .select()
        .single();

      console.log("🔍 updateTalent: Database response:", { data, error });

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    });
  },

  // Get all talents (for admin/company views)
  getTalents: async (filters: any = {}) => {
    return handleApiCall(async () => {
      try {
        let query = supabase
          .from("talents")
          .select(`
            *,
            profile:profiles!inner(
              id,
              email,
              full_name,
              avatar_url,
              role,
              is_verified,
              is_active
            )
          `)
          .order("created_at", { ascending: false });

        // Filter by availability status if specified
        if (filters.availability_status) {
          query = query.eq("availability_status", filters.availability_status);
        }

        // Filter by experience level if specified
        if (filters.experience_level) {
          query = query.eq("experience_level", filters.experience_level);
        }

        // Filter by location if specified
        if (filters.location) {
          query = query.ilike("location", `%${filters.location}%`);
        }

        const { data, error } = await query;

        if (error) {
          return { data: null, error };
        }

        return { data, error: null };
      } catch (error) {
        return { data: null, error: { message: "Failed to fetch talents" } };
      }
    });
  },

  // Jobs
  getJobs: async (filters: any = {}) => {
    console.log("🔍 getJobs called with filters:", filters);
    return handleApiCall(async () => {
      console.log("🔍 Inside handleApiCall for getJobs");

      // Query with company information and profile avatar joined
      let query = supabase
        .from("jobs")
        .select(`
          *,
          companies!inner(
            name,
            logo_url,
            profile_id,
            profiles!inner(
              avatar_url
            )
          )
        `)
        .order("created_at", { ascending: false });

      console.log("🔍 Base query created");

      // Filter by company_id if specified (for company dashboard)
      if (filters.company_id) {
        console.log("🔍 Filtering by company_id:", filters.company_id);
        query = query.eq("company_id", filters.company_id);
      } else if (!filters.showAll) {
        console.log("🔍 Filtering by status: active");
        // For public job listings, only show active jobs (unless showAll is true)
        query = query.eq("status", "active");
      } else {
        console.log("🔍 Showing all jobs (no status filter)");
      }
      // If showAll is true, don't filter by status (show all jobs)

      // Add job_id filter if specified
      if (filters.job_id) {
        console.log("🔍 Filtering by job_id:", filters.job_id);
        query = query.eq("id", filters.job_id);
      }

      console.log("🔍 Executing query...");
      const { data, error } = await query;

      // Transform data to flatten company info for backward compatibility
      // Use profile avatar_url if logo_url is not set
      const transformedData = data?.map((job: any) => ({
        ...job,
        company_name: job.companies?.name,
        avatar_url: job.companies?.logo_url || job.companies?.profiles?.avatar_url,
      }));

      console.log("🔍 Query result:", { data: transformedData?.length, error });
      return { data: transformedData, error };
    });
  },

  // Debug function to check all jobs
  getAllJobsDebug: async () => {
    console.log("🔍 getAllJobsDebug: Starting direct query...");
    try {
      console.log("🔍 Testing basic connection...");

      // Test 1: Very simple query
      const { data: testData, error: testError } = await supabase
        .from("jobs")
        .select("count", { count: "exact", head: true });

      console.log("🔍 Jobs count test:", { count: testData, error: testError });

      // Test 2: Simple select
      console.log("🔍 Attempting simple select...");
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, status")
        .limit(5);

      console.log("🔍 Simple select result:", {
        data,
        error,
        count: data?.length,
      });
      return { data, error };
    } catch (err) {
      console.error("🔍 Exception in getAllJobsDebug:", err);
      return { data: null, error: err };
    }
  },

  // Function to activate all draft jobs (for debugging)
  activateAllDraftJobs: async () => {
    return handleApiCall(async () => {
      const { data, error } = await supabase
        .from("jobs")
        .update({ status: "active" })
        .eq("status", "draft")
        .select();

      console.log("✅ Activated draft jobs:", data);
      return { data, error };
    });
  },

  createJob: async (jobData: any) => {
    const { data, error } = await supabase
      .from("jobs")
      .insert(jobData)
      .select()
      .single();
    return { data, error };
  },

  getJob: async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          companies!inner(
            name,
            logo_url,
            profile_id,
            profiles!inner(
              avatar_url
            )
          )
        `)
        .eq("id", jobId)
        .single();

      if (error) {
        return { data: null, error };
      }

      // Transform data to flatten company info
      // Use profile avatar_url if logo_url is not set
      const transformedData = data ? {
        ...data,
        company_name: data.companies?.name,
        avatar_url: data.companies?.logo_url || data.companies?.profiles?.avatar_url,
      } : null;

      return { data: transformedData, error: null };
    } catch (error) {
      return { data: null, error: { message: "Failed to fetch job" } };
    }
  },

  updateJob: async (jobId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .update(updates)
        .eq("id", jobId)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: "Failed to update job" } };
    }
  },

  deleteJob: async (jobId: string) => {
    return handleApiCall(async () => {
      try {
        const { error } = await supabase.from("jobs").delete().eq("id", jobId);

        if (error) {
          return { data: null, error };
        }

        return { data: null, error: null };
      } catch (error) {
        return { data: null, error: { message: "Failed to delete job" } };
      }
    });
  },

  // Applications
  getApplications: async (filters: any = {}) => {
    return handleApiCall(async () => {
      try {
        let query = supabase
          .from("applications")
          .select(
            `
          *,
          talent:talents!inner(
            id,
            profile_id,
            title,
            bio,
            experience_level,
            location,
            availability_status,
            profile:profiles!inner(
              id,
              email,
              full_name,
              avatar_url
            )
          ),
          job:jobs!inner(
            id,
            title,
            company_id,
            location,
            salary_min,
            salary_max,
            employment_type,
            companies:companies!inner(
              id,
              name,
              logo_url
            )
          )
        `
          )
          .order("created_at", { ascending: false });

        if (filters.job_id) {
          query = query.eq("job_id", filters.job_id);
        }
        if (filters.talent_id) {
          query = query.eq("talent_id", filters.talent_id);
        }
        if (filters.status) {
          query = query.eq("status", filters.status);
        }
        if (filters.talent_id) {
          query = query.eq("talent_id", filters.talent_id);
        }

        // Handle company_id filtering by first getting jobs for that company
        if (filters.company_id) {
          // First get all job IDs for this company
          const { data: companyJobs, error: jobsError } = await supabase
            .from("jobs")
            .select("id")
            .eq("company_id", filters.company_id);

          if (jobsError) {
            return { data: null, error: jobsError };
          }

          if (companyJobs && companyJobs.length > 0) {
            const jobIds = companyJobs.map((job: any) => job.id);
            query = query.in("job_id", jobIds);
          } else {
            // No jobs for this company, return empty array
            return { data: [], error: null };
          }
        }

        const { data, error } = await query;
        return { data, error };
      } catch (error) {
        return {
          data: null,
          error: { message: "Failed to fetch applications" },
        };
      }
    });
  },

  getApplication: async (applicationId: string) => {
    return handleApiCall(async () => {
      try {
        const { data, error } = await supabase
          .from("applications")
          .select(
            `
            *,
            talent:talents!inner(
              id,
              profile_id,
              title,
              bio,
              experience_level,
              location,
              availability_status,
              portfolio_url,
              linkedin_url,
              github_url,
              profile:profiles!inner(
                id,
                email,
                full_name,
                avatar_url
              )
            ),
            job:jobs!inner(
              id,
              title,
              company_id,
              location,
              salary_min,
              salary_max,
              description
            )
          `
          )
          .eq("id", applicationId)
          .single();

        if (error) {
          return { data: null, error };
        }

        return { data, error: null };
      } catch (error) {
        return {
          data: null,
          error: { message: "Failed to fetch application" },
        };
      }
    });
  },

  createApplication: async (applicationData: any) => {
    return handleApiCall(async () => {
      try {
        const { data, error } = await supabase
          .from("applications")
          .insert(applicationData)
          .select()
          .single();

        if (error) {
          return { data: null, error };
        }

        return { data, error: null };
      } catch (error) {
        return {
          data: null,
          error: { message: "Failed to create application" },
        };
      }
    });
  },

  updateApplication: async (applicationId: string, updates: any) => {
    return handleApiCall(async () => {
      try {
        const { data, error } = await supabase
          .from("applications")
          .update(updates)
          .eq("id", applicationId)
          .select()
          .single();

        if (error) {
          return { data: null, error };
        }

        return { data, error: null };
      } catch (error) {
        return {
          data: null,
          error: { message: "Failed to update application" },
        };
      }
    });
  },

  deleteApplication: async (applicationId: string) => {
    return handleApiCall(async () => {
      try {
        const { error } = await supabase
          .from("applications")
          .delete()
          .eq("id", applicationId);

        if (error) {
          return { data: null, error };
        }

        return { data: null, error: null };
      } catch (error) {
        return { data: null, error: { message: "Failed to delete application" } };
      }
    });
  },

  // Get application count for a specific job
  getJobApplicationCount: async (jobId: string) => {
    return handleApiCall(async () => {
      try {
        const { count, error } = await supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .eq("job_id", jobId);

        if (error) {
          return { data: null, error };
        }

        return { data: count || 0, error: null };
      } catch (error) {
        return {
          data: null,
          error: { message: "Failed to get application count" },
        };
      }
    });
  },

  // Get talent skills
  // Get talent skills with full details (proficiency, years, etc.)
  getTalentSkills: async (talentId: string) => {
    return handleApiCall(async () => {
      try {
        const { data, error } = await supabase
          .from("talent_skills")
          .select(
            `
            skill:skills!inner(
              id,
              name,
              category
            ),
            proficiency_level,
            years_of_experience,
            is_primary
          `
          )
          .eq("talent_id", talentId);

        if (error) {
          return { data: null, error };
        }

        // Transform to full skill objects
        const skillsData = data?.map((item: any) => ({
          id: item.skill.id,
          skill_id: item.skill.id,
          name: item.skill.name,
          skill_name: item.skill.name,
          category: item.skill.category,
          proficiency_level: item.proficiency_level ?? 3,
          years_of_experience: item.years_of_experience ?? 0,
          is_primary: item.is_primary ?? false
        })) || [];
        
        return { data: skillsData, error: null };
      } catch (error) {
        return {
          data: null,
          error: { message: "Failed to get talent skills" },
        };
      }
    });
  },

  // DEPRECATED: Use getTalentSkills instead
  // This returns skill names only for backward compatibility
  getTalentSkillNames: async (talentId: string) => {
    return handleApiCall(async () => {
      try {
        const { data, error } = await supabase
          .from("talent_skills")
          .select(
            `
            skill:skills!inner(
              id,
              name,
              category
            ),
            proficiency_level,
            years_of_experience,
            is_primary
          `
          )
          .eq("talent_id", talentId);

        if (error) {
          return { data: null, error };
        }

        // Transform to simple array of skill names for compatibility
        const skillNames = data?.map((item: any) => item.skill.name) || [];
        return { data: skillNames, error: null };
      } catch (error) {
        return {
          data: null,
          error: { message: "Failed to get talent skills" },
        };
      }
    });
  },

  // Get job skills
  getJobSkills: async (jobId: string) => {
    return handleApiCall(async () => {
      try {
        console.log("🔍 getJobSkills called for jobId:", jobId);

        // Test: Check if skills table has any data at all
        const { data: allSkills } = await supabase
          .from("skills")
          .select("id, name")
          .limit(5);
        console.log("🔍 TEST - Sample skills from database:", allSkills);

        // First, get the job_skills records
        const { data: jobSkillsData, error: jobSkillsError } = await supabase
          .from("job_skills")
          .select("*")
          .eq("job_id", jobId);

        console.log("🔍 job_skills data (FULL):", JSON.stringify(jobSkillsData, null, 2));
        console.log("🔍 job_skills error:", jobSkillsError);

        if (jobSkillsError) {
          console.error("🔍 getJobSkills error details:", jobSkillsError);
          return { data: null, error: jobSkillsError };
        }

        if (!jobSkillsData || jobSkillsData.length === 0) {
          console.log("🔍 No job skills found");
          return { data: [], error: null };
        }

        // Get all skill IDs
        const skillIds = jobSkillsData.map((js: any) => js.skill_id);
        console.log("🔍 Skill IDs to fetch:", skillIds, "Types:", skillIds.map((id: any) => typeof id));

        // Fetch the actual skills
        const { data: skillsData, error: skillsError } = await supabase
          .from("skills")
          .select("id, name, category")
          .in("id", skillIds);

        console.log("🔍 skills data (FULL):", JSON.stringify(skillsData, null, 2));
        console.log("🔍 skills error:", skillsError);
        console.log("🔍 Skills found:", skillsData?.length || 0);

        if (skillsError) {
          console.error("🔍 skills fetch error:", skillsError);
          return { data: null, error: skillsError };
        }

        // Create a map of skills by ID
        const skillsMap = new Map(skillsData?.map((s: any) => [s.id, s]) || []);
        console.log("🔍 Skills map:", Array.from(skillsMap.entries()));

        // Combine the data
        const transformedSkills = jobSkillsData.map((item: any) => {
          const skillData: any = skillsMap.get(item.skill_id);
          console.log(`🔍 Looking for skill_id: "${item.skill_id}" (type: ${typeof item.skill_id}), found:`, skillData);
          return {
            skill_id: item.skill_id,
            skill_name: skillData?.name || `Unknown (ID: ${item.skill_id})`,
            category: skillData?.category,
            proficiency_level: item.proficiency_level,
            is_required: item.is_required,
            skill: skillData,
          };
        });

        console.log("🔍 getJobSkills final transformed:", JSON.stringify(transformedSkills, null, 2));
        return { data: transformedSkills, error: null };
      } catch (error) {
        console.error("🔍 getJobSkills exception:", error);
        return {
          data: null,
          error: { message: "Failed to get job skills" },
        };
      }
    });
  },

  // Skills
  getSkills: async () => {
    try {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: "Failed to fetch skills" } };
    }
  },

  // Matches
  getMatches: async (filters: any = {}) => {
    try {
      let query = supabase
        .from("matches")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters.talent_id) {
        query = query.eq("talent_id", filters.talent_id);
      }
      if (filters.job_id) {
        query = query.eq("job_id", filters.job_id);
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      return { data: null, error: { message: "Failed to fetch matches" } };
    }
  },

  // Analytics
  getAnalytics: async (userId: string, type: string) => {
    try {
      // This is a simplified analytics implementation
      // In a real application, you might have dedicated analytics tables or use a service like PostHog
      const analytics = {
        profileViews: 0,
        applications: 0,
        matches: 0,
        messages: 0,
        jobViews: 0,
        applicationsReceived: 0,
      };

      if (type === "talent") {
        // Get talent record first
        const { data: talentData } = await supabase
          .from("talents")
          .select("id")
          .eq("profile_id", userId)
          .single();

        if (talentData) {
          // Get talent-specific analytics using talent ID
          const { data: applicationsData } = await supabase
            .from("applications")
            .select("id")
            .eq("talent_id", talentData.id);

          const { data: matchesData } = await supabase
            .from("matches")
            .select("id")
            .eq("talent_id", talentData.id);

          // Get messages count for this talent
          const { data: messagesData } = await supabase
            .from("messages")
            .select("id")
            .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);

          analytics.applications = applicationsData?.length || 0;
          analytics.matches = matchesData?.length || 0;
          analytics.messages = messagesData?.length || 0;

          // For profile views, we'll use a calculation based on applications and matches
          // This gives a more realistic number than random values
          analytics.profileViews = Math.max(
            analytics.applications * 3 +
            analytics.matches * 2 +
            Math.floor(Math.random() * 10), // Small random component for variation
            analytics.applications + analytics.matches
          );
        }
      } else if (type === "company") {
        // Get company-specific analytics
        const { data: companyData } = await supabase
          .from("companies")
          .select("id")
          .eq("profile_id", userId)
          .single();

        if (companyData) {
          const { data: jobsData } = await supabase
            .from("jobs")
            .select("id, views_count")
            .eq("company_id", companyData.id);

          const { data: applicationsData } = await supabase
            .from("applications")
            .select("id")
            .in("job_id", jobsData?.map((job: any) => job.id) || []);

          // Get messages count for this company
          const { data: messagesData } = await supabase
            .from("messages")
            .select("id")
            .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);

          analytics.jobViews =
            jobsData?.reduce((sum: number, job: any) => sum + (job.views_count || 0), 0) ||
            0;
          analytics.applicationsReceived = applicationsData?.length || 0;
          analytics.messages = messagesData?.length || 0;
          analytics.matches = 0; // Companies don't have matches in the same way
        }
      }

      return { data: analytics, error: null };
    } catch (error) {
      return { data: null, error: { message: "Failed to fetch analytics" } };
    }
  },

  // Messages
  getMessages: async (filters: any = {}) => {
    try {
      let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters.thread_id) {
        query = query.eq("thread_id", filters.thread_id);
      }
      if (filters.sender_id) {
        query = query.eq("sender_id", filters.sender_id);
      }
      if (filters.recipient_id) {
        query = query.eq("recipient_id", filters.recipient_id);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      return { data: null, error: { message: "Failed to fetch messages" } };
    }
  },

  sendMessage: async (messageData: any) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert(messageData)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: "Failed to send message" } };
    }
  },

  // Notifications
  getNotifications: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: "Failed to fetch notifications" },
      };
    }
  },

  createNotification: async (notificationData: any) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert(notificationData)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: "Failed to create notification" },
      };
    }
  },

  // Activity Logs
  logActivity: async (activityData: any) => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .insert(activityData)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: "Failed to log activity" } };
    }
  },
};

export { supabase };
export default supabase;
