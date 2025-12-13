import { motion } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  Buildings,
  Calendar,
  CurrencyDollar,
  PencilSimple,
  Eye,
  MapPin,
  Pause,
  Play,
  Star,
  Trash,
  TrendUp,
  Users,
} from "@phosphor-icons/react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { notify } from "../../utils/notify";
import { db } from "../../lib/supabase/index";
import SkillsDisplay from "../../components/skills/SkillsDisplay";
import LoadingSpinner from "../../components/LoadingSpinner";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  employment_type: string;
  salary_min?: number;
  salary_max?: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  views_count: number;
  applications_count: number;
  company_id: string;
  company_name?: string | null;
  avatar_url?: string | null;
  required_skills?: string[];
}

const JobDetailPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobSkills, setJobSkills] = useState<any[]>([]);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;

      try {
        const { data, error } = await db.getJob(jobId);

        if (error) {
          notify.showError("Failed to load job details");
          return;
        }

        if (data) {
          const { data: appCount } = await db.getJobApplicationCount(jobId);
          setJob({
            ...data,
            applications_count: appCount || 0,
          });
        }

        const { data: skillsData } = await db.getJobSkills(jobId);
        setJobSkills(skillsData || []);
      } catch (error) {
        notify.showError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleEditJob = () => {
    navigate(`/company/jobs/${jobId}/edit`);
  };

  const handleDeleteJob = async () => {
    if (!job) return;

    if (
      !confirm(
        "Are you sure you want to delete this job? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const { error } = await db.deleteJob(jobId!);

      if (error) {
        notify.showError("Failed to delete job");
        return;
      }

      notify.showSuccess("Job deleted successfully");
      navigate("/company/jobs");
    } catch (error) {
      notify.showError("An unexpected error occurred");
    }
  };

  const handleToggleStatus = async () => {
    if (!job) return;

    const newStatus = job.status === "active" ? "paused" : "active";

    try {
      const { error } = await db.updateJob(jobId!, { status: newStatus });

      if (error) {
        notify.showError("Failed to update job status");
        return;
      }

      setJob({ ...job, status: newStatus });
      notify.showSuccess(
        `Job ${newStatus === "active" ? "activated" : "paused"} successfully`
      );
    } catch (error) {
      notify.showError("An unexpected error occurred");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading job details..." />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center mx-auto mb-6">
            <Briefcase size={40} weight="regular" className="text-slate-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Job Not Found</h2>
          <p className="text-slate-600 mb-8">
            The job you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/company/jobs")}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      active: "bg-green-500",
      paused: "bg-orange-500",
      draft: "bg-slate-400",
      closed: "bg-red-500",
    };
    return colors[status] || "bg-blue-500";
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/company/jobs")}
          className="mb-6 flex items-center gap-2 text-slate-600 hover:text-primary transition-colors group font-medium"
        >
          <ArrowLeft size={20} weight="regular" className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Jobs</span>
        </button>

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8 relative overflow-hidden"
        >
          {/* Status Bar */}
          <div className={`h-1 ${getStatusColor(job.status)}`}></div>

          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200">
                      <Buildings size={32} weight="regular" className="text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                        {job.title}
                      </h1>
                      <div
                        className={`px-4 py-2 ${getStatusColor(job.status)} text-white text-sm font-bold uppercase rounded-lg flex-shrink-0`}
                      >
                        {job.status.toUpperCase()}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                          <MapPin size={16} weight="regular" className="text-primary" />
                        </div>
                        <span className="font-medium">{job.location}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                          <Briefcase size={16} weight="regular" className="text-primary" />
                        </div>
                        <span className="font-medium capitalize">
                          {job.employment_type.replace("_", " ")}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                          <Calendar size={16} weight="regular" className="text-slate-400" />
                        </div>
                        <span className="font-medium">
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleEditJob}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <PencilSimple size={16} weight="regular" />
                  Edit
                </button>
                <button
                  onClick={handleToggleStatus}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-colors ${job.status === "active"
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "bg-green-500 text-white hover:bg-green-600"
                    }`}
                >
                  {job.status === "active" ? (
                    <>
                      <Pause size={16} weight="regular" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play size={16} weight="regular" />
                      Activate
                    </>
                  )}
                </button>
                <button
                  onClick={handleDeleteJob}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-red-600 border border-red-200 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                >
                  <Trash size={16} weight="regular" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <Eye size={24} weight="regular" className="text-primary" />
              </div>
              <TrendUp size={20} weight="regular" className="text-slate-400" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">{job.views_count || 0}</p>
            <p className="text-slate-600 font-medium">Total Views</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 cursor-pointer hover:shadow-md hover:border-primary transition-all"
            onClick={() => navigate(`/company/applicants?job=${job.id}`)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <Users size={24} weight="regular" className="text-primary" />
              </div>
              <TrendUp size={20} weight="regular" className="text-slate-400" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">{job.applications_count || 0}</p>
            <p className="text-slate-600 font-medium">Applications</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 cursor-pointer hover:shadow-md hover:border-primary transition-all"
            onClick={() => navigate(`/company/jobs/${job.id}/matching`)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <Star size={24} weight="regular" className="text-primary" />
              </div>
              <TrendUp size={20} weight="regular" className="text-slate-400" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">Find</p>
            <p className="text-slate-600 font-medium">Matching Talents</p>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Description */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <Buildings size={24} weight="regular" className="text-primary" />
                </div>
                Job Description
              </h2>
              <div className="prose max-w-none text-slate-700 leading-relaxed">
                <p className="whitespace-pre-wrap text-base">{job.description}</p>
              </div>
            </motion.div>

            {/* Skills Required */}
            {(jobSkills.length > 0 || (job.required_skills && job.required_skills.length > 0)) && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <Star size={24} weight="regular" className="text-primary" />
                  </div>
                  Skills for this Job
                </h2>
                {jobSkills.length > 0 ? (
                  <SkillsDisplay skills={jobSkills} variant="card" showProficiency={true} />
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {job.required_skills?.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold border border-slate-200"
                      >
                        <Star size={16} weight="regular" />
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Salary Info */}
            {(job.salary_min || job.salary_max) && (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <CurrencyDollar size={20} weight="regular" className="text-green-600" />
                  Compensation
                </h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900 mb-2">
                    {job.salary_min && job.salary_max
                      ? `${job.currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                      : job.salary_min
                        ? `${job.currency} ${job.salary_min.toLocaleString()}+`
                        : `${job.currency} Up to ${job.salary_max?.toLocaleString()}`}
                  </div>
                  <p className="text-slate-600 font-medium">per year</p>
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/company/applicants?job=${job.id}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Users size={20} weight="regular" />
                  View Applications
                </button>
                <button
                  onClick={() => navigate(`/company/jobs/${job.id}/matching`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-primary border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  <Star size={20} weight="regular" />
                  Find Matching Talents
                </button>
              </div>
            </motion.div>

            {/* Job Details */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-4">Job Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <Briefcase size={16} weight="regular" className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">Employment Type</p>
                    <p className="text-sm font-semibold text-slate-900 capitalize">
                      {job.employment_type.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <MapPin size={16} weight="regular" className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">Location</p>
                    <p className="text-sm font-semibold text-slate-900">{job.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <Calendar size={16} weight="regular" className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">Posted On</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(job.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;