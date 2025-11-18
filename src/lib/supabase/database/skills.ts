import { supabase } from "../client";
import { handleApiCall } from "../client";

export const skills = {
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

  createSkill: async (name: string, category: string = "Custom") => {
    try {
      const { data, error } = await supabase
        .from("skills")
        .insert({
          name: name,
          category: category,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: "Failed to create skill" } };
    }
  },

  getOrCreateSkill: async (name: string, category: string = "Custom") => {
    try {
      const { data: existingSkills, error: searchError } = await supabase
        .from("skills")
        .select("*")
        .ilike("name", name)
        .limit(1);

      if (searchError) {
        return { data: null, error: searchError };
      }

      if (existingSkills && existingSkills.length > 0) {
        return { data: existingSkills[0], error: null };
      }

      return await skills.createSkill(name, category);
    } catch (error) {
      return { data: null, error: { message: "Failed to get or create skill" } };
    }
  },

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
          console.error("❌ Error fetching talent skills:", error);
          return { data: null, error };
        }

        console.log("✅ Raw talent_skills data from DB:", data);

        const skillsData = data?.map((item: any) => {
          const mapped = {
            id: item.skill.id,
            skill_id: item.skill.id,
            name: item.skill.name,
            skill_name: item.skill.name,
            category: item.skill.category,
            proficiency_level: item.proficiency_level ?? 3, // Use nullish coalescing
            years_of_experience: item.years_of_experience ?? 0,
            is_primary: item.is_primary ?? false
          };
          console.log("✅ Mapped skill:", mapped);
          return mapped;
        }) || [];
        
        console.log("✅ Final skillsData:", skillsData);
        return { data: skillsData, error: null };
      } catch (error) {
        console.error("❌ Exception in getTalentSkills:", error);
        return {
          data: null,
          error: { message: "Failed to get talent skills" },
        };
      }
    });
  },

  getJobSkills: async (jobId: string) => {
    return handleApiCall(async () => {
      try {
        console.log("🔍 getJobSkills called for jobId:", jobId);
        const { data, error } = await supabase
          .from("job_skills")
          .select(
            `
            skill:skills!inner(
              id,
              name,
              category
            ),
            proficiency_level,
            is_required
          `
          )
          .eq("job_id", jobId);

        console.log("🔍 Raw job skills data:", data);
        console.log("🔍 Error:", error);

        if (error) {
          return { data: null, error };
        }

        const skillsData = data?.map((item: any) => {
          console.log("🔍 Processing item:", item);
          return {
            skill_id: item.skill?.id,
            skill_name: item.skill?.name, // Add skill_name for compatibility
            name: item.skill?.name, // Keep name as well
            category: item.skill?.category,
            proficiency_level: item.proficiency_level,
            is_required: item.is_required,
            skill: item.skill // Include the full skill object
          };
        }) || [];
        
        console.log("🔍 Transformed skills data:", skillsData);
        return { data: skillsData, error: null };
      } catch (error) {
        console.error("🔍 getJobSkills error:", error);
        return {
          data: null,
          error: { message: "Failed to get job skills" },
        };
      }
    });
  },

  addTalentSkill: async (talentId: string, skillId: string, proficiencyLevel: number, yearsOfExperience: number, isPrimary: boolean = false) => {
    return handleApiCall(async () => {
      try {
        const { data, error } = await supabase
          .from("talent_skills")
          .insert({
            talent_id: talentId,
            skill_id: skillId,
            proficiency_level: proficiencyLevel,
            years_of_experience: yearsOfExperience,
            is_primary: isPrimary
          })
          .select()
          .single();

        if (error) {
          return { data: null, error };
        }

        return { data, error: null };
      } catch (error) {
        return {
          data: null,
          error: { message: "Failed to add talent skill" },
        };
      }
    });
  },

  removeTalentSkills: async (talentId: string) => {
    return handleApiCall(async () => {
      try {
        const { error } = await supabase
          .from("talent_skills")
          .delete()
          .eq("talent_id", talentId);

        if (error) {
          return { data: null, error };
        }

        return { data: true, error: null };
      } catch (error) {
        return {
          data: null,
          error: { message: "Failed to remove talent skills" },
        };
      }
    });
  },

  addJobSkill: async (jobId: string, skillId: string, proficiencyLevel: number, isRequired: boolean = false) => {
    return handleApiCall(async () => {
      try {
        const { data, error } = await supabase
          .from("job_skills")
          .insert({
            job_id: jobId,
            skill_id: skillId,
            proficiency_level: proficiencyLevel,
            is_required: isRequired
          })
          .select()
          .single();

        if (error) {
          return { data: null, error };
        }

        return { data, error: null };
      } catch (error) {
        return {
          data: null,
          error: { message: "Failed to add job skill" },
        };
      }
    });
  },

  removeJobSkills: async (jobId: string) => {
    return handleApiCall(async () => {
      try {
        const { error } = await supabase
          .from("job_skills")
          .delete()
          .eq("job_id", jobId);

        if (error) {
          return { data: null, error };
        }

        return { data: true, error: null };
      } catch (error) {
        return {
          data: null,
          error: { message: "Failed to remove job skills" },
        };
      }
    });
  },
};
