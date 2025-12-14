import { motion } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  Buildings,
  Calendar,
  CheckCircle,
  CurrencyDollar,
  FileText,
  Link as LinkIcon,
  MapPin,
  Upload,
  X,
} from "@phosphor-icons/react";
import React, { useEffect, useState, useMemo } from "react";
import { notify } from "../utils/notify";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth, useUserData } from "../hooks/useAuth";
import { db } from "../lib/supabase/index";
import SkillsDisplay from "../components/skills/SkillsDisplay";
import LoadingSpinner from "../components/LoadingSpinner";

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

          const { default: supabase } = await import("../lib/supabase");

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/jobs")}
          className="mb-6 flex items-center text-slate-600 hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft size={20} weight="regular" className="mr-2" />
          Back to Jobs
        </button>

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-md border border-slate-200 p-8 mb-8 hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-4">
                {/* Company Logo */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200">
                    {job.avatar_url ? (
                      <img
                        src={job.avatar_url}
                        alt={job.company_name || "Company"}
                        className="w-full h-full object-contain p-2 rounded-2xl"
                      />
                    ) : (
                      <Buildings size={32} weight="regular" className="text-primary" />
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                      {job.title}
                    </h1>
                    <div className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold capitalize rounded-lg flex-shrink-0 border border-slate-200">
                      {job.status}
                    </div>
                  </div>

                  {job.company_name && (
                    <p className="text-lg text-slate-700 mb-3 font-medium flex items-center">
                      <Buildings size={20} weight="regular" className="mr-2 text-primary" />
                      {job.company_name}
                    </p>
                  )}

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
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div className="flex-shrink-0">
              {checkingApplication ? (
                <button
                  disabled
                  className="w-full md:w-auto px-8 py-3 bg-slate-300 text-slate-600 rounded-lg text-lg font-semibold cursor-not-allowed"
                >
                  Checking...
                </button>
              ) : existingApplication ? (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg shadow-md">
                    <CheckCircle size={24} weight="regular" />
                    <span className="text-lg font-semibold">Applied</span>
                  </div>
                  <span className="text-sm text-slate-600 capitalize">
                    Status: <span className="font-semibold text-primary">{existingApplication.status}</span>
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => setShowApplyModal(true)}
                  disabled={job.status !== "active" || !user}
                  className="w-full md:w-auto px-8 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 text-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!user ? "Sign In to Apply" : "Apply Now"}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Job Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                <FileText size={24} weight="regular" className="mr-3 text-primary" />
                Job Description
              </h2>
              <div className="prose max-w-none text-slate-700 leading-relaxed">
                <p className="whitespace-pre-wrap">{job.description}</p>
              </div>
            </motion.div>

            {/* Skills for this Job */}
            {jobSkills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                  <CheckCircle size={24} weight="regular" className="mr-3 text-primary" />
                  Skills for this Job
                </h2>
                <SkillsDisplay skills={transformedJobSkills} variant="card" showProficiency={true} />
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Salary Info */}
            {(job.salary_min || job.salary_max) && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                  <CurrencyDollar size={20} weight="regular" className="mr-2 text-green-600" />
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
                  <p className="text-slate-600 text-sm">per year</p>
                </div>
              </motion.div>
            )}

            {/* Quick Info */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Job Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <Briefcase size={20} weight="regular" className="text-primary mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Employment Type
                    </p>
                    <p className="text-sm text-slate-600 capitalize">{job.employment_type.replace("_", " ")}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin size={20} weight="regular" className="text-primary mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Location</p>
                    <p className="text-sm text-slate-600">{job.location}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto border border-slate-200"
          >
            <div className="sticky top-0 bg-primary text-white p-6 rounded-t-2xl z-10">
              <button
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-all"
                onClick={() => {
                  setShowApplyModal(false);
                  setCoverLetter("");
                  setResumeUrl("");
                  setResumeFile(null);
                }}
                aria-label="Close"
              >
                <X size={20} weight="regular" />
              </button>
              <div className="flex items-center gap-3 pr-12">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileText size={24} weight="regular" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Apply for {job.title}</h2>
                  <p className="text-blue-100 mt-1">
                    Complete your application details below
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleApply} className="p-6 space-y-6">
              {/* Cover Letter */}
              <div>
                <label className="block text-slate-900 font-bold mb-3 flex items-center text-base">
                  <FileText size={20} weight="regular" className="mr-2 text-primary" />
                  Cover Letter
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  className="w-full border-2 border-slate-300 rounded-xl p-4 min-h-[150px] focus:border-primary focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  required
                  placeholder="Tell us why you're a great fit for this position..."
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-slate-500">
                    {coverLetter.length} characters
                  </p>
                  {coverLetter.length > 0 && (
                    <span className="text-xs text-green-600 font-medium">✓ Looking good!</span>
                  )}
                </div>
              </div>

              {/* Resume Section */}
              <div className="bg-slate-50 rounded-xl p-5 border-2 border-slate-200">
                <label className="block text-slate-900 font-bold mb-3 flex items-center text-base">
                  <Upload size={20} weight="regular" className="mr-2 text-primary" />
                  Resume / CV
                  <span className="text-red-500 ml-1">*</span>
                </label>

                {/* Resume Upload */}
                <div className="mb-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-primary hover:bg-blue-50/50 transition-all cursor-pointer">
                    <input
                      type="file"
                      id="resume-upload"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor="resume-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      {resumeFile ? (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 shadow-sm border border-primary"
                        >
                          <FileText size={32} weight="regular" className="text-primary" />
                          <div className="text-left">
                            <p className="font-semibold text-primary">
                              {resumeFile.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {(resumeFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <CheckCircle size={20} weight="regular" className="text-green-500" />
                        </motion.div>
                      ) : (
                        <>
                          <Upload size={48} weight="regular" className="text-slate-400 mb-3" />
                          <p className="text-slate-900 font-semibold mb-1">
                            Click to upload your resume
                          </p>
                          <p className="text-sm text-slate-500">
                            PDF, DOC, or DOCX (max 5MB)
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-slate-50 text-slate-500 font-medium">OR</span>
                  </div>
                </div>

                {/* Resume URL Alternative */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-2 flex items-center text-sm">
                    <LinkIcon size={16} weight="regular" className="mr-2 text-primary" />
                    Provide Resume URL
                  </label>
                  <input
                    type="url"
                    className="w-full border-2 border-slate-300 rounded-xl p-3 focus:border-primary focus:ring-2 focus:ring-blue-200 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                    value={resumeUrl}
                    onChange={(e) => {
                      setResumeUrl(e.target.value);
                      if (e.target.value) setResumeFile(null);
                    }}
                    placeholder="https://drive.google.com/your-resume"
                    disabled={!!resumeFile}
                  />
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    Link to your resume on Google Drive, Dropbox, or personal website
                  </p>
                </div>
              </div>

              {/* Profile Info */}
              {talent && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {profile?.full_name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Applying as:</p>
                      <p className="font-bold text-slate-900">
                        {profile?.full_name || profile?.email}
                      </p>
                      {talent.title && (
                        <p className="text-sm text-primary font-medium">{talent.title}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-4 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowApplyModal(false);
                    setCoverLetter("");
                    setResumeUrl("");
                    setResumeFile(null);
                  }}
                  className="flex-1 py-3 px-6 border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 px-6 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  disabled={submitting || uploadingResume || !coverLetter.trim() || (!resumeUrl.trim() && !resumeFile)}
                >
                  {submitting || uploadingResume ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {uploadingResume ? "Uploading..." : "Submitting..."}
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default JobDetailPage;
