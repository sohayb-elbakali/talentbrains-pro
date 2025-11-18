import { motion } from "framer-motion";
import { CheckCircle, FileText, Link as LinkIcon, Upload, X } from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import { notificationManager } from "../utils/notificationManager";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth, useUserData } from "../hooks/useAuth";
import { db } from "../lib/supabase/index";
import SkillsDisplay from "../components/skills/SkillsDisplay";
import CompanyLogo from "../components/CompanyLogo";

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
    console.log("🔍 Transforming job skills:", jobSkills);
    const transformed = jobSkills.map((item: any) => {
      const skillName = item.skill?.name || item.skill_name || "Unknown Skill";
      console.log("🔍 Skill item:", item, "-> name:", skillName);
      return {
        skill_id: item.skill?.id || item.skill_id,
        skill_name: skillName,
        name: skillName, // Add both for compatibility
        proficiency_level: item.proficiency_level || 3,
        is_required: item.is_required !== undefined ? item.is_required : true,
      };
    });
    console.log("🔍 Transformed skills:", transformed);
    return transformed;
  }, [jobSkills]);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      try {
        const { data, error } = await db.getJob(jobId);
        if (error) {
          notificationManager.showError("Failed to load job details");
          return;
        }
        setJob(data);

        const { data: skillsData } = await db.getJobSkills(jobId);
        setJobSkills(skillsData || []);
      } catch (err) {
        notificationManager.showError("An unexpected error occurred");
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
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        notificationManager.showError("Please upload a PDF or Word document");
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        notificationManager.showError("File size must be less than 5MB");
        return;
      }
      setResumeFile(file);
      setResumeUrl(""); // Clear URL if file is selected
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !job) {
      notificationManager.showError("You must be logged in as a talent to apply.");
      return;
    }

    // Check if already applied
    if (existingApplication) {
      notificationManager.showError("You have already applied to this job.");
      return;
    }

    if (!coverLetter.trim()) {
      notificationManager.showError("Please write a cover letter");
      return;
    }

    if (!resumeUrl.trim() && !resumeFile) {
      notificationManager.showError("Please provide a resume (upload file or URL)");
      return;
    }

    setSubmitting(true);
    try {
      if (!talent) {
        notificationManager.showError(
          "Unable to find your talent profile. Please complete your profile first."
        );
        setSubmitting(false);
        return;
      }

      let finalResumeUrl = resumeUrl;

      // Upload resume file if provided
      if (resumeFile) {
        setUploadingResume(true);
        try {
          const fileExt = resumeFile.name.split(".").pop();
          const fileName = `${user.id}/${job.id}/${Date.now()}.${fileExt}`;

          const { default: supabase } = await import("../lib/supabase");

          // Try to upload to resumes bucket
          const { error: uploadError } = await supabase.storage
            .from("resumes")
            .upload(fileName, resumeFile);

          if (uploadError) {
            // If bucket doesn't exist, inform user to use URL instead
            if (uploadError.message.includes("not found") || uploadError.message.includes("does not exist")) {
              notificationManager.showError("Resume upload not configured. Please use a resume URL instead (Google Drive, Dropbox, etc.)");
              setUploadingResume(false);
              setSubmitting(false);
              setResumeFile(null);
              return;
            }

            notificationManager.showError("Failed to upload resume. Please try using a resume URL instead.");
            setUploadingResume(false);
            setSubmitting(false);
            return;
          }

          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("resumes").getPublicUrl(fileName);

          finalResumeUrl = publicUrl;
          setUploadingResume(false);
        } catch (err) {
          console.error("Resume upload exception:", err);
          notificationManager.showError("Resume upload failed. Please use a resume URL instead.");
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
        notificationManager.showError(
          "Failed to submit application: " + (error.message || "Unknown error")
        );
      } else {
        notificationManager.showSuccess("Application submitted successfully!");
        setExistingApplication(newApplication);
        setShowApplyModal(false);
        setCoverLetter("");
        setResumeUrl("");
        setResumeFile(null);
      }
    } catch (err: any) {
      notificationManager.showError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
      setUploadingResume(false);
    }
  };

  if (userDataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }
  if (userDataError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{userDataError.message}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading job...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Job Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The job you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/jobs")}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/jobs")}
          className="mb-4 flex items-center text-gray-600 hover:text-purple-600 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Jobs
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 rounded-2xl blur-md opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
                  <div className="relative">
                    <CompanyLogo
                      avatarUrl={job.avatar_url}
                      companyName={job.company_name || 'Company'}
                      size="xl"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    {job.title}
                  </h1>
                  {job.company_name && (
                    <p className="text-lg text-gray-700 mb-3 font-medium flex items-center">
                      <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {job.company_name}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-purple-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {job.location}
                    </span>
                    <span className="flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-purple-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                          clipRule="evenodd"
                        />
                        <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                      </svg>
                      {job.employment_type}
                    </span>
                    <span className="flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-purple-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Posted {new Date(job.created_at).toLocaleDateString()}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${job.status === "active"
                        ? "bg-green-100 text-green-800"
                        : job.status === "paused"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                        }`}
                    >
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              {checkingApplication ? (
                <button
                  disabled
                  className="w-full md:w-auto px-8 py-3 bg-gray-300 text-gray-600 rounded-lg text-lg font-semibold cursor-not-allowed"
                >
                  Checking...
                </button>
              ) : existingApplication ? (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-lg font-semibold">Applied</span>
                  </div>
                  <span className="text-sm text-gray-600 capitalize">
                    Status: <span className="font-semibold text-purple-600">{existingApplication.status}</span>
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => setShowApplyModal(true)}
                  disabled={job.status !== "active" || !user}
                  className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 text-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!user ? "Sign In to Apply" : "Apply Now"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <svg
                  className="w-6 h-6 mr-3 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Job Description
              </h2>
              <div className="prose max-w-none text-gray-700 leading-relaxed">
                <p className="whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>

            {/* Skills for this Job */}
            {jobSkills.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <svg
                    className="w-6 h-6 mr-3 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                  Skills for this Job
                </h2>
                <SkillsDisplay skills={transformedJobSkills} variant="card" showProficiency={true} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Salary Info */}
            {(job.salary_min || job.salary_max) && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg border border-green-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Compensation
                </h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {job.salary_min && job.salary_max
                      ? `${job.currency
                      } ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                      : job.salary_min
                        ? `${job.currency} ${job.salary_min.toLocaleString()}+`
                        : `${job.currency
                        } Up to ${job.salary_max?.toLocaleString()}`}
                  </div>
                  <p className="text-gray-600 text-sm">per year</p>
                </div>
              </div>
            )}

            {/* Quick Info */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Job Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 mr-3 text-purple-600 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Employment Type
                    </p>
                    <p className="text-sm text-gray-600">{job.employment_type}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 mr-3 text-purple-600 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Location</p>
                    <p className="text-sm text-gray-600">{job.location}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto border border-purple-100"
          >
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl z-10">
              <button
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-all backdrop-blur-sm"
                onClick={() => {
                  setShowApplyModal(false);
                  setCoverLetter("");
                  setResumeUrl("");
                  setResumeFile(null);
                }}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 pr-12">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Apply for {job.title}</h2>
                  <p className="text-purple-100 mt-1">
                    Complete your application details below
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleApply} className="p-6 space-y-6">
              {/* Important Notice */}
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-purple-900 mb-1">Before You Apply</h3>
                    <p className="text-sm text-purple-700">
                      Please provide your cover letter and resume. Both are required to submit your application.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cover Letter */}
              <div>
                <label className="block text-gray-900 font-bold mb-3 flex items-center text-base">
                  <FileText className="w-5 h-5 mr-2 text-purple-600" />
                  Cover Letter
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  className="w-full border-2 border-gray-300 rounded-xl p-4 min-h-[150px] focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  required
                  placeholder="Tell us why you're a great fit for this position. Highlight your relevant experience and skills..."
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500">
                    {coverLetter.length} characters
                  </p>
                  {coverLetter.length > 0 && (
                    <span className="text-xs text-green-600 font-medium">✓ Looking good!</span>
                  )}
                </div>
              </div>

              {/* Resume Section */}
              <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
                <label className="block text-gray-900 font-bold mb-3 flex items-center text-base">
                  <Upload className="w-5 h-5 mr-2 text-purple-600" />
                  Resume / CV
                  <span className="text-red-500 ml-1">*</span>
                </label>

                {/* Resume Upload */}
                <div className="mb-4">
                  <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer">
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
                          className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 shadow-sm border border-purple-200"
                        >
                          <FileText className="w-8 h-8 text-purple-600" />
                          <div className="text-left">
                            <p className="font-semibold text-purple-700">
                              {resumeFile.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {(resumeFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </motion.div>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-purple-400 mb-3" />
                          <p className="text-gray-900 font-semibold mb-1">
                            Click to upload your resume
                          </p>
                          <p className="text-sm text-gray-500">
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
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-gray-50 text-gray-500 font-medium">OR</span>
                  </div>
                </div>

                {/* Resume URL Alternative */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center text-sm">
                    <LinkIcon className="w-4 h-4 mr-2 text-purple-600" />
                    Provide Resume URL
                  </label>
                  <input
                    type="url"
                    className="w-full border-2 border-gray-300 rounded-xl p-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={resumeUrl}
                    onChange={(e) => {
                      setResumeUrl(e.target.value);
                      if (e.target.value) setResumeFile(null);
                    }}
                    placeholder="https://drive.google.com/your-resume"
                    disabled={!!resumeFile}
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    Link to your resume on Google Drive, Dropbox, or personal website
                  </p>
                </div>
              </div>

              {/* Profile Info */}
              {talent && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {profile?.full_name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Applying as:</p>
                      <p className="font-bold text-gray-900">
                        {profile?.full_name || profile?.email}
                      </p>
                      {talent.title && (
                        <p className="text-sm text-purple-600 font-medium">{talent.title}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Warning */}
              {(!coverLetter.trim() || (!resumeUrl.trim() && !resumeFile)) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="font-semibold text-amber-900 mb-1">Required Fields Missing</p>
                      <ul className="text-sm text-amber-700 space-y-1">
                        {!coverLetter.trim() && <li>• Cover letter is required</li>}
                        {!resumeUrl.trim() && !resumeFile && <li>• Resume (file or URL) is required</li>}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowApplyModal(false);
                    setCoverLetter("");
                    setResumeUrl("");
                    setResumeFile(null);
                  }}
                  className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  disabled={submitting || uploadingResume || !coverLetter.trim() || (!resumeUrl.trim() && !resumeFile)}
                >
                  {uploadingResume ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Uploading Resume...
                    </>
                  ) : submitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Submit Application
                    </>
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
