import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  CheckCircle,
  Heart,
  MessageSquare,
  Sparkles,
  User,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../lib/supabase/index";

export default function WelcomeDashboard() {
  const { profile, user } = useAuth();

  // Use React Query for dashboard stats with proper caching
  const { data: dashboardStats, isLoading: loading } = useQuery({
    queryKey: ['welcome-dashboard', user?.id, profile?.role],
    queryFn: async () => {
      if (!profile || !user) return { profileCompletion: 0, availableJobs: 0, aiMatches: 0 };

      // Calculate profile completion
      const basicFields = ["full_name", "email"];
      const filledBasicFields = basicFields.filter(
        (field) => profile[field] && profile[field].trim() !== ""
      );
      const basicScore = (filledBasicFields.length / basicFields.length) * 40;

      const optionalFields = ["avatar_url"];
      const filledOptionalFields = optionalFields.filter(
        (field) => profile[field] && profile[field].trim() !== ""
      );
      const optionalScore = (filledOptionalFields.length / optionalFields.length) * 20;

      let roleScore = 0;
      if (profile.role === "talent") {
        const { data: talentData } = await db.getTalent(user.id);
        if (talentData) {
          const talentFields = ["title", "bio", "experience_level", "location"];
          const filledTalentFields = talentFields.filter(
            (field) => talentData[field] && talentData[field].toString().trim() !== ""
          );
          roleScore = (filledTalentFields.length / talentFields.length) * 40;
        }
      } else if (profile.role === "company") {
        const { data: companyData } = await db.getCompany(user.id);
        if (companyData) {
          const companyFields = ["name", "description", "industry", "location"];
          const filledCompanyFields = companyFields.filter(
            (field) => companyData[field] && companyData[field].toString().trim() !== ""
          );
          roleScore = (filledCompanyFields.length / companyFields.length) * 40;
        }
      }

      const profileCompletion = Math.round(basicScore + optionalScore + roleScore);

      // Get available jobs and matches in parallel
      const [jobsResult, matchesResult] = await Promise.all([
        db.getJobs({ status: "active" }),
        profile.role === "talent" ? db.getMatches({ talent_id: user.id }) : Promise.resolve({ data: [] })
      ]);

      return {
        profileCompletion,
        availableJobs: jobsResult.data?.length || 0,
        aiMatches: matchesResult.data?.length || 0,
      };
    },
    enabled: !!profile && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const welcomeSteps = [
    {
      icon: <User className="h-6 w-6" />,
      title: "Complete Your Profile",
      description:
        "Add your skills, experience, and preferences to get better matches.",
      completed: false,
      action: "Complete Profile",
    },
    {
      icon: <Briefcase className="h-6 w-6" />,
      title: "Browse Jobs",
      description:
        "Explore opportunities that match your skills and interests.",
      completed: false,
      action: "Browse Jobs",
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Get AI Matches",
      description: "Our AI will find the perfect opportunities for you.",
      completed: false,
      action: "View Matches",
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Connect & Apply",
      description: "Start conversations and apply to your favorite positions.",
      completed: false,
      action: "Start Applying",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full mb-6">
          <Sparkles className="h-5 w-5 text-purple-600 mr-2" />
          <span className="text-sm font-medium text-purple-700">
            Welcome to TalentBrains!
          </span>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome, {profile?.full_name || "Talent"}! 🎉
        </h1>

        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          You're all set up! Let's get you started on your journey to find the
          perfect opportunity.
        </p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
      >
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Profile Completion</p>
              <p className="text-2xl font-bold">
                {loading ? "..." : `${dashboardStats?.profileCompletion || 0}%`}
              </p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <User className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${dashboardStats?.profileCompletion || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Available Jobs</p>
              <p className="text-2xl font-bold">
                {loading ? "..." : (dashboardStats?.availableJobs || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <Briefcase className="h-6 w-6" />
            </div>
          </div>
          <p className="text-sm opacity-90 mt-2">
            {(dashboardStats?.availableJobs || 0) > 0
              ? "Ready to explore!"
              : "New jobs added daily"}
          </p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">AI Matches</p>
              <p className="text-2xl font-bold">
                {loading ? "..." : dashboardStats?.aiMatches || 0}
              </p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <Heart className="h-6 w-6" />
            </div>
          </div>
          <p className="text-sm opacity-90 mt-2">
            {(dashboardStats?.aiMatches || 0) > 0
              ? `${dashboardStats?.aiMatches} perfect matches found!`
              : "Complete profile to get matches"}
          </p>
        </div>
      </motion.div>

      {/* Getting Started Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Getting Started
          </h2>
          <p className="text-gray-600">
            Follow these steps to make the most of your TalentBrains experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {welcomeSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-start space-x-4 p-6 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
            >
              <div
                className={`p-3 rounded-full ${step.completed
                    ? "bg-green-100 text-green-600"
                    : "bg-purple-100 text-purple-600"
                  }`}
              >
                {step.completed ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  step.icon
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                <button className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-700">
                  {step.action}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-12 text-center"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Ready to get started?
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/profile-completion"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
          >
            <User className="h-5 w-5 mr-2" />
            Complete My Profile
          </a>
          <a
            href="/jobs"
            className="inline-flex items-center px-6 py-3 bg-white text-gray-700 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:text-purple-600 transition-all duration-200"
          >
            <Briefcase className="h-5 w-5 mr-2" />
            Browse Jobs
          </a>
        </div>
      </motion.div>
    </div>
  );
}
