import { supabase } from "../client";
import { handleApiCall } from "../client";

export const companies = {
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
    try {
      const { data, error } = await supabase
        .from("companies")
        .insert(companyData)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: "Failed to create company" } };
    }
  },

  updateCompany: async (profileId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .update(updates)
        .eq("profile_id", profileId)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: "Failed to update company" } };
    }
  },

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
};
