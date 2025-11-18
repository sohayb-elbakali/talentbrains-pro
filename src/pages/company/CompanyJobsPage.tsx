import { motion } from 'framer-motion';
import { Edit, PlusCircle, Trash2, Briefcase, MapPin, Calendar, DollarSign, Users } from 'lucide-react';
import React from 'react';
import { notificationManager } from '../../utils/notificationManager';
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../lib/supabase/index";
import { useRealtimeQuery } from "../../hooks/useRealtimeQuery";

// Define the type for a job object
interface Job {
  id: string;
  title: string;
  status: string;
  created_at: string;
  location?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  views_count?: number;
  applications_count?: number;
}

const CompanyJobsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch company data with real-time updates
  const { data: companyData, error: companyError } = useRealtimeQuery({
    queryKey: ['company', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await db.getCompany(user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    table: 'companies',
    filter: `profile_id=eq.${user?.id}`,
  });

  // Fetch jobs with real-time updates
  const { data: jobs = [], isLoading: loading, error: jobsError } = useRealtimeQuery({
    queryKey: ['company-jobs-with-counts', companyData?.id],
    queryFn: async () => {
      if (!companyData?.id) return [];
      const { data, error } = await db.getJobs({ company_id: companyData.id });
      if (error) throw error;
      
      // Get application counts in parallel for better performance
      const jobsWithCounts = await Promise.all(
        (data || []).map(async (job: Job) => {
          const { data: count } = await db.getJobApplicationCount(job.id);
          return {
            ...job,
            applications_count: count || 0,
          };
        })
      );
      return jobsWithCounts;
    },
    enabled: !!companyData?.id,
    staleTime: 0, // Always refetch to get latest counts
    table: 'jobs,applications', // Subscribe to both tables for real-time updates
    filter: `company_id=eq.${companyData?.id}`,
  });

  const error = companyError || jobsError;

  // Add delete handler with optimistic update
  const handleDeleteJob = async (jobId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this job? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      const { error } = await db.deleteJob(jobId);
      if (error) {
        notificationManager.showError("Failed to delete job");
        return;
      }
      // Real-time subscription will automatically update the list
      notificationManager.showSuccess("Job deleted successfully");
    } catch (err) {
      notificationManager.showError("An unexpected error occurred");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {(error as any)?.message || 'An error occurred'}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Your Job Postings
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your active and past job listings
              </p>
            </div>
            <Link
              to="/company/jobs/create"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <PlusCircle className="h-5 w-5" />
              Post a New Job
            </Link>
          </div>
        </motion.div>

        {/* Jobs Grid */}
        {jobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-12"
          >
            <div className="text-center max-w-md mx-auto">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Briefcase className="h-12 w-12 text-purple-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                No Jobs Posted Yet
              </h2>
              <p className="text-gray-600 mb-6">
                Start attracting top talent by posting your first job opening!
              </p>
              <Link
                to="/company/jobs/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <PlusCircle className="h-5 w-5" />
                Create Your First Job
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 hover:shadow-2xl transition-all duration-300 overflow-hidden group"
              >
                {/* Status Bar */}
                <div className={`h-2 bg-gradient-to-r ${
                  job.status === 'active' ? 'from-green-400 to-emerald-500' :
                  job.status === 'paused' ? 'from-yellow-400 to-orange-400' :
                  job.status === 'draft' ? 'from-gray-400 to-gray-500' :
                  'from-red-400 to-pink-400'
                }`}></div>

                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Job Info */}
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => navigate(`/company/jobs/${job.id}`)}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative flex-shrink-0">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-400 rounded-xl blur opacity-30"></div>
                          <div className="relative w-14 h-14 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center border-2 border-white shadow-md">
                            <Briefcase className="h-7 w-7 text-purple-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm ${
                              job.status === 'active' ? 'bg-green-100 text-green-800' :
                              job.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                              job.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {job.status}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-purple-500" />
                              {job.location || "Remote"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Briefcase className="h-4 w-4 text-blue-500" />
                              {job.employment_type?.replace("_", " ") || "Full-time"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              {new Date(job.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {(job.salary_min || job.salary_max) && (
                            <div className="mt-3 flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-green-600" />
                              <span className="text-lg font-bold text-gray-900">
                                ${job.salary_min?.toLocaleString() || '0'} - ${job.salary_max?.toLocaleString() || '0'}
                              </span>
                              <span className="text-sm text-gray-500">per year</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap lg:flex-col gap-3">
                      <button
                        onClick={() => navigate(`/company/applicants?job=${job.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-md"
                      >
                        <Users className="h-4 w-4" />
                        <span>{job.applications_count || 0} Applications</span>
                      </button>
                      <button
                        onClick={() => navigate(`/company/jobs/${job.id}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105 shadow-md"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-md"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyJobsPage;
