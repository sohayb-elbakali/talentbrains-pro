import { supabase } from "../client";
import { handleApiCall } from "../client";

export const profiles = {
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
};
