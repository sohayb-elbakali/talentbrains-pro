import { supabase } from "../client";
import { handleApiCall } from "../client";

export const talents = {
  getTalents: async (filters?: {
    availability_status?: string;
    experience_level?: string;
    remote_preference?: boolean;
    location?: string;
    skills?: string[];
    limit?: number;
    offset?: number;
  }) => {
    return handleApiCall(async () => {
      let query = supabase
        .from("talents")
        .select(`
          *,
          profile:profiles(
            id,
            full_name,
            email,
            avatar_url,
            created_at
          ),
          talent_skills(
            skill:skills(
              id,
              name,
              category
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.availability_status) {
        query = query.eq('availability_status', filters.availability_status);
      }
      if (filters?.experience_level) {
        query = query.eq('experience_level', filters.experience_level);
      }
      if (filters?.remote_preference !== undefined) {
        query = query.eq('remote_preference', filters.remote_preference);
      }
      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    });
  },

  getTalent: async (profileId: string) => {
    return handleApiCall(async () => {
      const { data, error } = await supabase
        .from("talents")
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
    });
  },

  createTalent: async (talentData: any) => {
    return handleApiCall(async () => {
      const { data, error } = await supabase
        .from("talents")
        .insert(talentData)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    });
  },

  updateTalent: async (talentId: string, updates: any) => {
    return handleApiCall(async () => {
      const { data, error } = await supabase
        .from("talents")
        .update(updates)
        .eq("id", talentId)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    });
  },
};
