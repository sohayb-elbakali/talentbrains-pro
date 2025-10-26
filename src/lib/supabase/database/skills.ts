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
          return { data: null, error };
        }

        const skillsData = data?.map((item: any) => ({
          id: item.skill.id,
          name: item.skill.name,
          category: item.skill.category,
          proficiency_level: item.proficiency_level,
          years_of_experience: item.years_of_experience,
          is_primary: item.is_primary
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

  getJobSkills: async (jobId: string) => {
    return handleApiCall(async () => {
      try {
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

        if (error) {
          return { data: null, error };
        }

        const skillsData = data?.map((item: any) => ({
          id: item.skill.id,
          name: item.skill.name,
          category: item.skill.category,
          proficiency_level: item.proficiency_level,
          is_required: item.is_required
        })) || [];
        return { data: skillsData, error: null };
      } catch (error) {
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
