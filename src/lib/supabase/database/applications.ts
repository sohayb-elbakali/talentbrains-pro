import { supabase } from "../client";
import { handleApiCall } from "../client";

export const applications = {
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

        if (filters.company_id) {
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
};
