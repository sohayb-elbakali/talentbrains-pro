import { supabase } from "../client";

export const matches = {
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
};
