import { motion } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  Buildings,
  Calendar,
  CheckCircle,
  CurrencyDollar,
  FileText,
  MapPin,
  Upload,
  X,
  Info,
  Clock,
  Users,
} from "@phosphor-icons/react";
import React, { useEffect, useState, useMemo } from "react";
import { notify } from "../../utils/notify";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth, useUserData } from "../../hooks/useAuth";
import { db } from "../../lib/supabase/index";
import SkillsDisplay from "../../components/skills/SkillsDisplay";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

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
  company_name?: string;
  avatar_url?: string | null;
}

const JobDetailPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    data,
    isLoading: userDataLoading,
    error: userDataError,
  } = useUserData(user?.id);
  const talent = data?.talent;
  const profile = data?.profile;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [checkingApplication, setCheckingApplication] = useState(false);
  const [jobSkills, setJobSkills] = useState<any[]>([]);

  // Transform job skills for SkillsDisplay component
  const transformedJobSkills = useMemo(() => {
    return jobSkills.map((item: any) => {
      const skillName = item.skill?.name || item.skill_name || "Unknown Skill";
      return {
        skill_id: item.skill?.id || item.skill_id,
        skill_name: skillName,
        name: skillName,
        proficiency_level: item.proficiency_level || 3,
        is_required: item.is_required !== undefined ? item.is_required : true,
      };
    });
  }, [jobSkills]);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      try {
        const { data, error } = await db.getJob(jobId);
        if (error) {
          notify.showError("Failed to load job details");
          return;
        }
        setJob(data);

        const { data: skillsData } = await db.getJobSkills(jobId);
        setJobSkills(skillsData || []);
      } catch (err) {
        notify.showError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  // Check if user has already applied to this job
  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!jobId || !talent?.id) return;

      setCheckingApplication(true);
      try {
        const { data, error } = await db.getApplications({
          job_id: jobId,
          talent_id: talent.id,
        });

        if (!error && data && data.length > 0) {
          setExistingApplication(data[0]);
        }
      } catch (err) {
        // Silently handle error
      } finally {
        setCheckingApplication(false);
      }
    };

    checkExistingApplication();
  }, [jobId, talent?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        notify.showError("Please upload a PDF or Word document");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        notify.showError("File size must be less than 5MB");
        return;
      }
      setResumeFile(file);
      setResumeUrl("");
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !job) {
      notify.showError("You must be logged in as a talent to apply.");
      return;
    }

    if (existingApplication) {
      notify.showError("You have already applied to this job.");
      return;
    }

    if (!coverLetter.trim()) {
      notify.showError("Please write a cover letter");
      return;
    }

    if (!resumeUrl.trim() && !resumeFile) {
      notify.showError("Please provide a resume (upload file or URL)");
      return;
    }

    setSubmitting(true);
    try {
      if (!talent) {
        notify.showError(
          "Unable to find your talent profile. Please complete your profile first."
        );
        setSubmitting(false);
        return;
      }

      let finalResumeUrl = resumeUrl;

      if (resumeFile) {
        setUploadingResume(true);
        try {
          const fileExt = resumeFile.name.split(".").pop();
          const fileName = `${user.id}/${job.id}/${Date.now()}.${fileExt}`;

          const { supabase } = await import("../../lib/supabase/index");

          const { error: uploadError } = await supabase.storage
            .from("resumes")
            .upload(fileName, resumeFile);

          if (uploadError) {
            if (uploadError.message.includes("not found") || uploadError.message.includes("does not exist")) {
              notify.showError("Resume upload not configured. Please use a resume URL instead.");
              setUploadingResume(false);
              setSubmitting(false);
              setResumeFile(null);
              return;
            }

            notify.showError("Failed to upload resume. Please try using a resume URL instead.");
            setUploadingResume(false);
            setSubmitting(false);
            return;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("resumes").getPublicUrl(fileName);

          finalResumeUrl = publicUrl;
          setUploadingResume(false);
        } catch (err) {
          notify.showError("Resume upload failed. Please use a resume URL instead.");
          setUploadingResume(false);
          setSubmitting(false);
          return;
        }
      }

      const applicationData = {
        job_id: job.id,
        talent_id: talent.id,
        status: "pending",
        cover_letter: coverLetter,
        custom_resume_url: finalResumeUrl || undefined,
        applied_at: new Date().toISOString(),
      };

      const { data: newApplication, error } = await db.createApplication(applicationData);
      if (error) {
        notify.showError(
          "Failed to submit application: " + (error.message || "Unknown error")
        );
      } else {
        notify.showSuccess("Application submitted successfully!");
        setExistingApplication(newApplication);
        setShowApplyModal(false);
        setCoverLetter("");
        setResumeUrl("");
        setResumeFile(null);
      }
    } catch (err: any) {
      notify.showError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
      setUploadingResume(false);
    }
  };

  if (userDataLoading || loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (userDataError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Error</h2>
          <p className="text-slate-600 mb-6">{userDataError.message}</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Job Not Found
          </h2>
          <p className="text-slate-600 mb-6">
            The job you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/jobs")}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { color: string; bg: string; icon: any }> = {
      pending: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
      reviewed: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Info },
      interview: { color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: Users },
      offered: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle },
      rejected: { color: "text-red-700", bg: "bg-red-50 border-red-200", icon: X },
      withdrawn: { color: "text-slate-500", bg: "bg-slate-50 border-slate-200", icon: X },
    };

    const config = statuses[status.toLowerCase()] || statuses.pending;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${config.bg} ${config.color} text-xs font-bold uppercase tracking-wider`}>
        <Icon size={14} weight="bold" />
        {status}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/jobs")}
            className="flex items-center text-slate-500 hover:text-primary transition-all font-semibold group"
          >
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 mr-3 group-hover:border-primary/20 transition-all">
              <ArrowLeft size={18} weight="bold" />
            </div>
            Back to Job Board
          </button>
        </div>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 mb-8 relative overflow-hidden"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex gap-6 items-start">
              {/* Company Logo */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                  {job.avatar_url ? (
                    <img
                      src={job.avatar_url}
                      alt={job.company_name || "Company"}
                      className="w-full h-full object-contain p-3 rounded-2xl"
                    />
                  ) : (
                    <Buildings size={40} weight="regular" className="text-slate-300" />
                  )}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    {job.title}
                  </h1>
                  <span className={`px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-200`}>
                    {job.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-slate-500">
                  <div className="flex items-center font-bold text-slate-700">
                    <Buildings size={18} className="mr-1.5 text-primary" />
                    {job.company_name}
                  </div>
                  <div className="flex items-center text-sm font-medium">
                    <MapPin size={18} className="mr-1.5 text-slate-400" />
                    {job.location}
                  </div>
                  <div className="flex items-center text-sm font-medium">
                    <Briefcase size={18} className="mr-1.5 text-slate-400" />
                    {job.employment_type.replace("_", " ")}
                  </div>
                  <div className="flex items-center text-sm font-medium">
                    <Calendar size={18} className="mr-1.5 text-slate-400" />
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Section */}
            <div className="w-full lg:w-auto flex flex-col items-center lg:items-end gap-3">
              {checkingApplication ? (
                <div className="w-full lg:w-48 h-12 bg-slate-100 animate-pulse rounded-xl" />
              ) : existingApplication ? (
                <div className="flex flex-col items-center lg:items-end gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 w-full lg:w-auto">
                  <div className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100 font-bold">
                    <CheckCircle size={20} weight="bold" />
                    Applied
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>Application Status:</span>
                    {getStatusBadge(existingApplication.status)}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowApplyModal(true)}
                  disabled={job.status !== "active" || !user}
                  className="w-full lg:w-48 py-3.5 bg-primary text-white rounded-xl hover:bg-blue-700 font-bold text-lg shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {!user ? "Sign In to Apply" : "Apply Now"}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg text-primary">
                  <FileText size={24} weight="bold" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Job Description</h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                {job.description}
              </div>
            </div>

            {/* Skills */}
            {jobSkills.length > 0 && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <CheckCircle size={24} weight="bold" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Skills Requirements</h2>
                </div>
                <SkillsDisplay skills={transformedJobSkills} variant="card" showProficiency={true} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Compensation Card */}
            {(job.salary_min || job.salary_max) && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                  <CurrencyDollar size={18} weight="bold" className="text-emerald-500" />
                  Compensation
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {job.salary_min && job.salary_max
                    ? `${job.currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                    : job.salary_min
                      ? `${job.currency} ${job.salary_min.toLocaleString()}+`
                      : `${job.currency} Up to ${job.salary_max?.toLocaleString()}`}
                </div>
                <div className="text-slate-500 text-sm mt-1">per year estimated</div>
              </div>
            )}

            {/* Job Details Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Position Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex-shrink-0">
                    <Briefcase size={20} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">Type</div>
                    <div className="text-slate-700 font-bold capitalize">{job.employment_type.replace("_", " ")}</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex-shrink-0">
                    <MapPin size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">Location</div>
                    <div className="text-slate-700 font-bold">{job.location}</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex-shrink-0">
                    <Calendar size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">Posted On</div>
                    <div className="text-slate-700 font-bold">{new Date(job.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal - Simplified */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative border border-slate-200"
          >
            {/* Header - Compact */}
            <div className="border-b border-slate-100 px-4 py-3">
              <button
                className="absolute top-3 right-3 p-1.5 hover:bg-slate-100 rounded-full transition-all text-slate-400"
                onClick={() => {
                  setShowApplyModal(false);
                  setCoverLetter("");
                  setResumeUrl("");
                  setResumeFile(null);
                }}
                aria-label="Close"
              >
                <X size={18} weight="regular" />
              </button>
              <h2 className="text-base font-semibold text-slate-900 pr-8">{job.title}</h2>
              <p className="text-slate-500 text-xs">{job.company_name}</p>
            </div>

            <form onSubmit={handleApply} className="p-4 space-y-3">
              {/* Applying As - Compact */}
              {talent && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-bold text-sm">
                    {profile?.full_name?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {profile?.full_name || profile?.email}
                    </p>
                  </div>
                </div>
              )}

              {/* Cover Letter - Smaller */}
              <div>
                <label className="block text-slate-700 font-medium mb-1 text-xs">
                  Cover Letter <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg p-2.5 min-h-[80px] focus:border-primary focus:ring-1 focus:ring-blue-100 transition-all resize-none text-sm"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  required
                  placeholder="Why are you a great fit?"
                />
              </div>

              {/* Resume - Compact */}
              <div>
                <label className="block text-slate-700 font-medium mb-1 text-xs">
                  Resume <span className="text-red-500">*</span>
                </label>

                {/* File Upload - Smaller */}
                <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center hover:border-primary hover:bg-slate-50 transition-all cursor-pointer">
                  <input
                    type="file"
                    id="resume-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    {resumeFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText size={18} className="text-primary" />
                        <span className="text-sm font-medium text-slate-900 truncate">{resumeFile.name}</span>
                        <CheckCircle size={16} className="text-green-500" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Upload size={18} className="text-slate-400" />
                        <span className="text-sm text-slate-500">Upload file</span>
                      </div>
                    )}
                  </label>
                </div>

                {/* OR + URL - Inline compact */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-400">or</span>
                  <input
                    type="url"
                    className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-primary focus:ring-1 focus:ring-blue-100 transition-all text-xs disabled:bg-slate-50"
                    value={resumeUrl}
                    onChange={(e) => {
                      setResumeUrl(e.target.value);
                      if (e.target.value) setResumeFile(null);
                    }}
                    placeholder="Paste resume link"
                    disabled={!!resumeFile}
                  />
                </div>
              </div>

              {/* Buttons - Compact */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowApplyModal(false);
                    setCoverLetter("");
                    setResumeUrl("");
                    setResumeFile(null);
                  }}
                  className="flex-1 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                  disabled={submitting || uploadingResume || !coverLetter.trim() || (!resumeUrl.trim() && !resumeFile)}
                >
                  {submitting || uploadingResume ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      <span>{uploadingResume ? "Uploading" : "Sending"}</span>
                    </>
                  ) : (
                    "Apply"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default JobDetailPage;
