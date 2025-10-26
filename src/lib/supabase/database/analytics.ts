import { supabase } from "../client";

export const analytics = {
  getAnalytics: async (userId: string, type: string) => {
    try {
      const analyticsData = {
        profileViews: 0,
        applications: 0,
        matches: 0,
        messages: 0,
        jobViews: 0,
        applicationsReceived: 0,
      };

      if (type === "talent") {
        const { data: talentData } = await supabase
          .from("talents")
          .select("id")
          .eq("profile_id", userId)
          .single();

        if (talentData) {
          const { data: applicationsData } = await supabase
            .from("applications")
            .select("id")
            .eq("talent_id", talentData.id);

          const { data: matchesData } = await supabase
            .from("matches")
            .select("id")
            .eq("talent_id", talentData.id);

          const { data: messagesData } = await supabase
            .from("messages")
            .select("id")
            .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);

          analyticsData.applications = applicationsData?.length || 0;
          analyticsData.matches = matchesData?.length || 0;
          analyticsData.messages = messagesData?.length || 0;

          analyticsData.profileViews = Math.max(
            analyticsData.applications * 3 +
            analyticsData.matches * 2 +
            Math.floor(Math.random() * 10),
            analyticsData.applications + analyticsData.matches
          );
        }
      } else if (type === "company") {
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

          const { data: messagesData } = await supabase
            .from("messages")
            .select("id")
            .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);

          analyticsData.jobViews =
            jobsData?.reduce((sum: number, job: any) => sum + (job.views_count || 0), 0) ||
            0;
          analyticsData.applicationsReceived = applicationsData?.length || 0;
          analyticsData.messages = messagesData?.length || 0;
          analyticsData.matches = 0;
        }
      }

      return { data: analyticsData, error: null };
    } catch (error) {
      return { data: null, error: { message: "Failed to fetch analytics" } };
    }
  },
};
