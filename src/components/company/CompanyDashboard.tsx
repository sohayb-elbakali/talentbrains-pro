import { BrainCircuit, Briefcase, Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth, useUserData } from "../../hooks/useAuth";
import { db } from "../../lib/supabase/index";
import type { Job } from "../../types/database";
import CompanyProfileUpdateModal from "./CompanyProfileUpdateModal";
import ModernJobCard from "./ModernJobCard";
import CompanyLogo from "../profile/CompanyLogo";
import { StatsSkeleton, CardSkeleton } from "../ui/SkeletonLoader";

// A small component for the stat cards to avoid repetition
const StatCard = ({
  title,
  value,
  icon,
  link,
  comingSoon = false,
  loading = false,
  gradient = "from-primary to-primary-hover",
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  link: string;
  comingSoon?: boolean;
  loading?: boolean;
  gradient?: string;
}) => {
  const content = (
    <div
      className={`bg-gradient-to-br ${gradient} p-6 rounded-2xl shadow-xl h-full flex flex-col justify-between ${comingSoon
        ? "opacity-60"
        : "hover:shadow-2xl hover:scale-105 transition-all duration-300"
        }`}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            {icon}
          </div>
        </div>
        {loading ? (
          <div className="h-10 bg-white/20 rounded-lg animate-pulse w-1/2"></div>
        ) : (
          <p className="text-4xl font-bold text-white mb-2">{value}</p>
        )}
        <h2 className="text-lg font-medium text-white/90">{title}</h2>
      </div>
      {comingSoon && (
        <span className="text-xs font-bold text-white bg-white/20 px-3 py-1 rounded-full self-start mt-4 backdrop-blur-sm">
          COMING SOON
        </span>
      )}
    </div>
  );

  if (link && !comingSoon) {
    return (
      <Link
        to={link}
        className="focus:outline-none focus:ring-2 focus:ring-primary rounded-2xl"
      >
        {content}
      </Link>
    );
  }
  return content;
};

const CompanyDashboard = () => {
  const { profile, user } = useAuth();
  const { data: userData } = useUserData(user?.id);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Get company name - ONLY from companies table, not from profile.full_name
  const companyName = userData?.company?.name || 'Company';

  // Get company ID first
  useEffect(() => {
    if (!profile?.id) return;

    const getCompanyId = async () => {
      const { data: companyData } = await db.getCompany(profile.id);
      if (companyData) {
        setCompanyId(companyData.id);
      }
    };

    getCompanyId();
  }, [profile?.id]);

  // Use React Query for data fetching with proper caching
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['company-jobs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await db.getJobs({ company_id: companyId });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: applicationsData, isLoading: appsLoading } = useQuery({
    queryKey: ['company-applications', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await db.getApplications({ company_id: companyId });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const loading = jobsLoading || appsLoading || !companyId;
  // Don't show 0 while loading - show loading state instead
  const activeJobs = loading ? undefined : (jobsData?.filter((job: any) => job.status === "active").length || 0);
  const totalApplicants = loading ? undefined : (applicationsData?.length || 0);
  const recentJobs = jobsData?.filter((job: any) => job.status === "active").slice(0, 5) || [];



  // LinkedIn-style: Don't show page until data is loaded
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8 animate-pulse">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gray-200 rounded-2xl"></div>
              <div className="flex-1">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>

          {/* Stats Skeleton */}
          <StatsSkeleton count={3} />

          {/* Jobs Skeleton */}
          <div className="mt-8">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6 animate-pulse"></div>
            <CardSkeleton count={3} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary rounded-2xl blur-lg opacity-20"></div>
                  <div className="relative w-20 h-20 rounded-2xl border-4 border-white shadow-2xl overflow-hidden">
                    <CompanyLogo
                      avatarUrl={profile?.avatar_url}
                      companyName={companyName}
                      size="xl"
                      className="w-full h-full"
                    />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome, {companyName}! 🚀
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Manage your recruitment pipeline with powerful insights.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/company/jobs/create"
                  className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-primary-hover transition-all duration-200"
                >
                  <Plus className="mr-2 h-5 w-5" /> Post Job
                </Link>
                <Link
                  to="/company/applicants"
                  className="inline-flex items-center px-6 py-3 bg-white text-primary border-2 border-primary-light rounded-xl font-semibold hover:bg-primary-light hover:border-primary transition-all duration-200"
                >
                  <Users className="mr-2 h-5 w-5" /> Applicants
                </Link>
              </div>
            </div>
          </div>
        </div>

        <main>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Active Job Postings"
              value={activeJobs !== undefined ? activeJobs.toString() : ""}
              icon={<Briefcase className="text-white" size={28} />}
              link="/company/jobs"
              loading={loading}
              gradient="from-primary to-primary-hover"
            />
            <StatCard
              title="Total Applicants"
              value={totalApplicants !== undefined ? totalApplicants.toString() : ""}
              icon={<Users className="text-white" size={28} />}
              link="/company/applicants"
              loading={loading}
              gradient="from-blue-500 to-blue-600"
            />
            <StatCard
              title="AI-Matched Candidates"
              value={"View"}
              icon={<BrainCircuit className="text-white" size={28} />}
              link="/company/matches"
              loading={loading}
              gradient="from-green-500 to-emerald-600"
            />
          </div>

          {/* Recent Jobs Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Recent Job Postings
              </h2>
              <Link
                to="/company/jobs"
                className="text-primary hover:text-primary-hover font-medium"
              >
                View All Jobs →
              </Link>
            </div>

            {recentJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentJobs.map((job: any) => (
                  <ModernJobCard
                    key={job.id}
                    job={job}
                    showCompany={false}
                    showStats={true}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No jobs posted yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Start by posting your first job to attract talented candidates.
                </p>
                <Link
                  to="/company/jobs/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Post Your First Job
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Profile Update Modal */}
      <CompanyProfileUpdateModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdate={() => {
          // Optionally refresh data or show success message
          setIsProfileModalOpen(false);
        }}
      />
    </div>
  );
};

export default CompanyDashboard;
