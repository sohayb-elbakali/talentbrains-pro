import { supabase } from "../client";
import { handleApiCall } from "../client";

export const jobs = {
  getJobs: async (filters: any = {}) => {
    return handleApiCall(async () => {
      let query = supabase
        .from("jobs")
        .select(`
          *,
          company:companies!inner(
            id,
            name,
            profile:profiles(
              avatar_url
            )
          )
        `)
        .order("updated_at", { ascending: false });

      if (filters.company_id) {
        query = query.eq("company_id", filters.company_id);
      } else if (!filters.showAll) {
        query = query.eq("status", "active");
      }

      if (filters.job_id) {
        query = query.eq("id", filters.job_id);
      }

      const { data, error } = await query;

      // Transform data to include avatar_url at job level for easier access
      if (data) {
        const transformedData = data.map((job: any) => ({
          ...job,
          company_name: job.company?.name || job.company_name,
          avatar_url: job.company?.profile?.avatar_url || null,
        }));
        return { data: transformedData, error };
      }

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
          company:companies!inner(
            id,
            name,
            profile:profiles(
              avatar_url
            )
          )
        `)
        .eq("id", jobId)
        .single();

      if (error) {
        return { data: null, error };
      }

      // Transform data to include avatar_url at job level
      if (data) {
        const transformedData = {
          ...data,
          company_name: data.company?.name || data.company_name,
          avatar_url: data.company?.profile?.avatar_url || null,
        };
        return { data: transformedData, error: null };
      }

      return { data, error: null };
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
    try {
      const { error } = await supabase.from("jobs").delete().eq("id", jobId);

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: { message: "Failed to delete job" } };
    }
  },
};
