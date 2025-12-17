import { motion } from 'framer-motion';
import { PencilSimple, Plus, Trash, Briefcase, MapPin, Calendar, CurrencyDollar, Users } from '@phosphor-icons/react';
import React, { useState } from 'react';
import { notify } from "../../utils/notify";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../lib/supabase/index";
import { useRealtimeQuery } from "../../hooks/useRealtimeQuery";
import ConfirmationModal from "../../components/ui/ConfirmationModal";

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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    staleTime: 5 * 60 * 1000,
    table: 'jobs,applications',
    filter: `company_id=eq.${companyData?.id}`,
  });

  const error = companyError || jobsError;

  // Open delete confirmation modal
  const openDeleteModal = (job: Job) => {
    setJobToDelete({ id: job.id, title: job.title });
    setDeleteModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;

    setIsDeleting(true);
    try {
      await notify.promise(
        db.deleteJob(jobToDelete.id).then(({ error }) => {
          if (error) throw error;
          return { success: true };
        }),
        {
          loading: `Deleting "${jobToDelete.title}"...`,
          success: `"${jobToDelete.title}" deleted successfully`,
          error: `Failed to delete "${jobToDelete.title}"`
        }
      );
      // Real-time subscription will automatically update the list
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
      setJobToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="h-10 bg-slate-200 rounded w-1/3 mb-2"></div>
            <div className="h-5 bg-slate-200 rounded w-1/4"></div>
          </div>

          {/* Jobs Skeleton */}
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-pulse">
                <div className="h-1 bg-slate-200"></div>
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-slate-200 rounded-2xl"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-slate-200 rounded w-1/2 mb-3"></div>
                      <div className="flex gap-3">
                        <div className="h-6 bg-slate-200 rounded w-16"></div>
                        <div className="h-6 bg-slate-200 rounded w-20"></div>
                        <div className="h-6 bg-slate-200 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-8 text-red-600">Error: {(error as any)?.message || 'An error occurred'}</div>;
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Your Job <span className="text-primary">Postings</span>
              </h1>
              <p className="text-slate-600 text-lg">
                Manage your active and past job listings
              </p>
            </div>
            <Link
              to="/company/jobs/create"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} weight="regular" />
              Post a New Job
            </Link>
          </div>
        </motion.div>

        {/* Jobs Grid */}
        {jobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12"
          >
            <div className="text-center max-w-md mx-auto">
              <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-200">
                <Briefcase size={48} weight="regular" className="text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                No Jobs Posted Yet
              </h2>
              <p className="text-slate-600 mb-6">
                Start attracting top talent by posting your first job opening!
              </p>
              <Link
                to="/company/jobs/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} weight="regular" />
                Create Your First Job
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-primary transition-all duration-200 overflow-hidden group"
              >
                {/* Status Bar */}
                <div className={`h-1 ${job.status === 'active' ? 'bg-green-500' :
                  job.status === 'paused' ? 'bg-orange-500' :
                    job.status === 'draft' ? 'bg-slate-400' :
                      'bg-red-500'
                  }`}></div>

                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Job Info */}
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => navigate(`/company/jobs/${job.id}`)}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200">
                            <Briefcase size={28} weight="regular" className="text-primary" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${job.status === 'active' ? 'bg-green-100 text-green-700 border border-green-200' :
                              job.status === 'paused' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                job.status === 'draft' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                                  'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                              {job.status}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin size={16} weight="regular" className="text-slate-400" />
                              {job.location || "Remote"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Briefcase size={16} weight="regular" className="text-slate-400" />
                              {job.employment_type?.replace("_", " ") || "Full-time"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar size={16} weight="regular" className="text-slate-400" />
                              {new Date(job.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {(job.salary_min || job.salary_max) && (
                            <div className="mt-3 flex items-center gap-2">
                              <CurrencyDollar size={20} weight="regular" className="text-green-600" />
                              <span className="text-lg font-bold text-slate-900">
                                ${job.salary_min?.toLocaleString() || '0'} - ${job.salary_max?.toLocaleString() || '0'}
                              </span>
                              <span className="text-sm text-slate-500">per year</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap lg:flex-col gap-3">
                      <button
                        onClick={() => navigate(`/company/applicants?job=${job.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors border border-slate-200"
                      >
                        <Users size={16} weight="regular" />
                        <span>{job.applications_count || 0} Applicants</span>
                      </button>
                      <button
                        onClick={() => navigate(`/company/jobs/${job.id}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        <PencilSimple size={16} weight="regular" />
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(job)}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash size={16} weight="regular" />
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setDeleteModalOpen(false);
            setJobToDelete(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Job Posting"
        message={
          <div className="space-y-3">
            <p>
              Are you sure you want to delete <span className="font-bold">"{jobToDelete?.title}"</span>?
            </p>
            <p className="text-sm text-slate-600">
              This will permanently remove the job posting and all associated applications. This action cannot be undone.
            </p>
          </div>
        }
        confirmText={isDeleting ? "Deleting..." : "Delete Job"}
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default CompanyJobsPage;
