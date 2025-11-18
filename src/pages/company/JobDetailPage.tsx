import { motion } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  Building,
  Calendar,
  DollarSign,
  Edit,
  Eye,
  MapPin,
  Pause,
  Play,
  Star,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { notificationManager } from "../../utils/notificationManager";
import { db } from "../../lib/supabase/index";
import SkillsDisplay from "../../components/skills/SkillsDisplay";

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
          notificationManager.showError("Failed to load job details");
          return;
        }

        if (data) {
          // Fetch application count
          const { data: appCount } = await db.getJobApplicationCount(jobId);
          setJob({
            ...data,
            applications_count: appCount || 0,
          });
        }

        // Fetch job skills
        const { data: skillsData } = await db.getJobSkills(jobId);
        setJobSkills(skillsData || []);
      } catch (error) {
        notificationManager.showError("An unexpected error occurred");
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
        notificationManager.showError("Failed to delete job");
        return;
      }

      notificationManager.showSuccess("Job deleted successfully");
      navigate("/company/jobs");
    } catch (error) {
      notificationManager.showError("An unexpected error occurred");
    }
  };

  const handleToggleStatus = async () => {
    if (!job) return;

    const newStatus = job.status === "active" ? "paused" : "active";

    try {
      const { error } = await db.updateJob(jobId!, { status: newStatus });

      if (error) {
        notificationManager.showError("Failed to update job status");
        return;
      }

      setJob({ ...job, status: newStatus });
      notificationManager.showSuccess(
        `Job ${newStatus === "active" ? "activated" : "paused"} successfully`
      );
    } catch (error) {
      notificationManager.showError("An unexpected error occurred");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Job Not Found</h2>
          <p className="text-gray-600 mb-8">
            The job you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/company/jobs")}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      active: "from-green-400 to-emerald-500",
      paused: "from-yellow-400 to-orange-400",
      draft: "from-gray-400 to-gray-500",
      closed: "from-red-400 to-pink-400",
    };
    return colors[status] || "from-blue-400 to-cyan-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/company/jobs")}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Jobs</span>
        </button>

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8 mb-8 relative overflow-hidden"
        >
          {/* Decorative Header */}
          <div className="h-2 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500"></div>

          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-400 rounded-2xl blur opacity-30"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center border-2 border-white shadow-lg">
                      <Building className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                        {job.title}
                      </h1>
                      <div
                        className={`px-4 py-2 bg-gradient-to-r ${getStatusColor(
                          job.status
                        )} text-white text-sm font-bold uppercase rounded-full shadow-md flex-shrink-0`}
                      >
                        {job.status.toUpperCase()}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-2">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <MapPin className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="font-medium">{job.location}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <Briefcase className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium capitalize">
                          {job.employment_type.replace("_", " ")}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-100 rounded-lg">
                          <Calendar className="h-4 w-4 text-gray-600" />
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
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={handleToggleStatus}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg ${job.status === "active"
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600"
                      : "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                    }`}
                >
                  {job.status === "active" ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Activate
                    </>
                  )}
                </button>
                <button
                  onClick={handleDeleteJob}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Eye className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 opacity-50" />
            </div>
            <p className="text-3xl font-bold mb-1">{job.views_count || 0}</p>
            <p className="text-blue-100 font-medium">Total Views</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate(`/company/applicants?job=${job.id}`)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 opacity-50" />
            </div>
            <p className="text-3xl font-bold mb-1">{job.applications_count || 0}</p>
            <p className="text-green-100 font-medium">Applications</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate(`/company/matches?job_id=${job.id}`)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Star className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 opacity-50" />
            </div>
            <p className="text-3xl font-bold mb-1">View</p>
            <p className="text-purple-100 font-medium">AI Matches</p>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl">
                  <Building className="h-6 w-6 text-purple-600" />
                </div>
                Job Description
              </h2>
              <div className="prose max-w-none text-gray-700 leading-relaxed">
                <p className="whitespace-pre-wrap text-base">{job.description}</p>
              </div>
            </motion.div>

            {/* Skills Required */}
            {(jobSkills.length > 0 || (job.required_skills && job.required_skills.length > 0)) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl">
                    <Star className="h-6 w-6 text-purple-600" />
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 rounded-xl text-sm font-semibold border-2 border-purple-200"
                      >
                        <Star className="h-4 w-4" />
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl border-2 border-green-100 p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Compensation
                </h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {job.salary_min && job.salary_max
                      ? `${job.currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                      : job.salary_min
                        ? `${job.currency} ${job.salary_min.toLocaleString()}+`
                        : `${job.currency} Up to ${job.salary_max?.toLocaleString()}`}
                  </div>
                  <p className="text-gray-600 font-medium">per year</p>
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/company/applicants?job=${job.id}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  <Users className="h-5 w-5" />
                  View Applications
                </button>
                <button
                  onClick={() => navigate(`/company/matches?job_id=${job.id}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  <Star className="h-5 w-5" />
                  View AI Matches
                </button>
              </div>
            </motion.div>

            {/* Job Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Job Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Briefcase className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Employment Type</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {job.employment_type.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="text-sm font-semibold text-gray-900">{job.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Posted On</p>
                    <p className="text-sm font-semibold text-gray-900">
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