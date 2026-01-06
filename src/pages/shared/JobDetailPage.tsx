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
  Clock,
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
  const { data, isLoading: userDataLoading, error: userDataError } = useUserData(user?.id);
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

  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!jobId || !talent?.id) return;
      setCheckingApplication(true);
      try {
        const { data, error } = await db.getApplications({ job_id: jobId, talent_id: talent.id });
        if (!error && data && data.length > 0) {
          setExistingApplication(data[0]);
        }
      } catch (err) {
        // Silent
      } finally {
        setCheckingApplication(false);
      }
    };
    checkExistingApplication();
  }, [jobId, talent?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
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
      notify.showError("Please provide a resume");
      return;
    }

    setSubmitting(true);
    try {
      if (!talent) {
        notify.showError("Please complete your profile first.");
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
          const { error: uploadError } = await supabase.storage.from("resumes").upload(fileName, resumeFile);
          if (uploadError) {
            notify.showError("Failed to upload resume. Please use a resume URL instead.");
            setUploadingResume(false);
            setSubmitting(false);
            return;
          }
          const { data: { publicUrl } } = supabase.storage.from("resumes").getPublicUrl(fileName);
          finalResumeUrl = publicUrl;
          setUploadingResume(false);
        } catch (err) {
          notify.showError("Resume upload failed.");
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
        notify.showError("Failed to submit application");
      } else {
        notify.showSuccess("Application submitted!");
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Error</h2>
          <p className="text-slate-600">{userDataError.message}</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Job Not Found</h2>
          <button onClick={() => navigate("/jobs")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700",
      reviewed: "bg-blue-100 text-blue-700",
      interview: "bg-purple-100 text-purple-700",
      offer: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return colors[status.toLowerCase()] || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft size={18} weight="bold" />
          <span className="font-medium">Back</span>
        </button>

        {/* Job Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            {/* Company Logo */}
            <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
              {job.avatar_url ? (
                <img src={job.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : (
                <Buildings size={28} weight="regular" className="text-blue-500" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
                  <p className="text-blue-600 font-medium">{job.company_name}</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase">
                  {job.status}
                </span>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin size={16} /> {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase size={16} /> {job.employment_type.replace("_", " ")}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={16} /> Posted {new Date(job.created_at).toLocaleDateString()}
                </span>
                {(job.salary_min || job.salary_max) && (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <CurrencyDollar size={16} />
                    {job.salary_min && job.salary_max
                      ? `${job.currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                      : job.salary_min
                        ? `${job.currency} ${job.salary_min.toLocaleString()}+`
                        : `Up to ${job.currency} ${job.salary_max?.toLocaleString()}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            {checkingApplication ? (
              <div className="w-32 h-10 bg-slate-100 animate-pulse rounded-lg" />
            ) : existingApplication ? (
              <div className="flex items-center gap-3">
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium flex items-center gap-2">
                  <CheckCircle size={18} weight="bold" />
                  Applied
                </span>
                <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusBadge(existingApplication.status)}`}>
                  {existingApplication.status}
                </span>
              </div>
            ) : (
              <button
                onClick={() => setShowApplyModal(true)}
                disabled={job.status !== "active" || !user}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {!user ? "Sign In to Apply" : "Apply Now"}
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            Job Description
          </h2>
          <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
            {job.description}
          </div>
        </div>

        {/* Skills */}
        {jobSkills.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="text-blue-600" />
              Required Skills
            </h2>
            <SkillsDisplay skills={transformedJobSkills} variant="card" showProficiency={true} />
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
          >
            <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">{job.title}</h2>
                <p className="text-slate-500 text-sm">{job.company_name}</p>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApply} className="p-5 space-y-4">
              {talent && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {profile?.full_name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{profile?.full_name}</p>
                    <p className="text-xs text-slate-500">{profile?.email}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-medium mb-1.5 text-sm">
                  Cover Letter <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full border border-slate-200 rounded-lg p-3 min-h-[100px] focus:border-blue-500 focus:ring-1 focus:ring-blue-100 resize-none"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Why are you a great fit for this role?"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5 text-sm">
                  Resume <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-blue-300 transition-colors">
                  <input
                    type="file"
                    id="resume-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    {resumeFile ? (
                      <div className="flex items-center justify-center gap-2 text-blue-600">
                        <FileText size={20} />
                        <span className="font-medium">{resumeFile.name}</span>
                        <CheckCircle size={18} className="text-green-500" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-slate-500">
                        <Upload size={20} />
                        <span>Upload resume (PDF, DOC)</span>
                      </div>
                    )}
                  </label>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-400">or</span>
                  <input
                    type="url"
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:bg-slate-50"
                    value={resumeUrl}
                    onChange={(e) => { setResumeUrl(e.target.value); if (e.target.value) setResumeFile(null); }}
                    placeholder="Paste resume link"
                    disabled={!!resumeFile}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingResume || !coverLetter.trim() || (!resumeUrl.trim() && !resumeFile)}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting || uploadingResume ? (
                    <>
                      <Clock size={16} className="animate-spin" />
                      {uploadingResume ? "Uploading..." : "Sending..."}
                    </>
                  ) : (
                    "Submit Application"
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
