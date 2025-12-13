import { motion } from 'framer-motion';
import {
  ArrowLeft, Briefcase, Calendar, CheckCircle, Clock, Download,
  ArrowSquareOut, FileText, Globe, MapPin, User, XCircle, PaperPlaneTilt, Phone,
  Star, Eye, Envelope
} from '@phosphor-icons/react';
import { useEffect, useState } from "react";
import { notify } from "../../utils/notify";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmationModal from "../../components/ConfirmationModal";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../lib/supabase";
import { useQueryClient } from '@tanstack/react-query';
import SkillsDisplay from "../../components/skills/SkillsDisplay";
import LoadingSpinner from "../../components/LoadingSpinner";

interface ApplicationDetail {
  id: string;
  status: string;
  applied_at: string;
  cover_letter?: string;
  custom_resume_url?: string;
  reviewed_at?: string;
  job: {
    id: string;
    title: string;
    company_id: string;
    location?: string;
    salary_min?: number;
    salary_max?: number;
    description?: string;
  };
  talent: {
    id: string;
    profile_id: string;
    title: string;
    bio: string;
    experience_level: string;
    location: string;
    availability_status: string;
    skills?: string[];
    portfolio_url?: string;
    linkedin_url?: string;
    github_url?: string;
    profile: {
      id: string;
      email: string;
      full_name: string;
      avatar_url: string | null;
    };
  };
}

const ApplicationDetailPage = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [talentSkills, setTalentSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    status: string;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    status: '',
    title: '',
    message: '',
    type: 'warning'
  });

  useEffect(() => {
    if (!applicationId || !user || profile?.role !== "company") {
      navigate("/company/applicants");
      return;
    }
    fetchApplicationDetail();
  }, [applicationId, user, profile]);

  const fetchApplicationDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await db.getApplication(applicationId!);

      if (fetchError) {
        throw new Error(fetchError.message || "Failed to fetch application details");
      }

      if (!data) {
        throw new Error("Application not found");
      }

      setApplication(data);

      if (data.talent?.id) {
        const { data: skills } = await db.getTalentSkills(data.talent.id);
        setTalentSkills(skills || []);
      }
    } catch (err: any) {
      setError(err.message);
      notify.showError("Failed to load application details");
    } finally {
      setLoading(false);
    }
  };

  const openConfirmModal = (status: string) => {
    const configs: any = {
      interview: {
        title: 'Schedule Interview?',
        message: 'This will notify the candidate that you want to schedule an interview. Are you sure you want to proceed?',
        type: 'info'
      },
      offer: {
        title: 'Make Job Offer?',
        message: 'This will send an offer notification to the candidate. Make sure you are ready to extend an offer before proceeding.',
        type: 'warning'
      },
      rejected: {
        title: 'Reject Application?',
        message: 'This action will notify the candidate that their application has been rejected. This cannot be easily undone.',
        type: 'danger'
      }
    };

    const config = configs[status];
    if (config) {
      setConfirmModal({
        isOpen: true,
        status,
        ...config
      });
    }
  };

  const handleStatusUpdate = async () => {
    if (!application || !confirmModal.status) return;

    try {
      setUpdatingStatus(true);
      const { error } = await db.updateApplication(application.id, { status: confirmModal.status });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['company-applications'] });

      notify.showSuccess(`Status updated to ${confirmModal.status} `);
      fetchApplicationDetail();
    } catch (err: any) {
      notify.showError("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: any = {
      pending: { icon: Clock, class: "bg-orange-100 text-orange-700 border-orange-200", label: "Pending Review" },
      reviewed: { icon: Eye, class: "bg-blue-100 text-blue-700 border-blue-200", label: "Reviewed" },
      interview: { icon: Calendar, class: "bg-orange-100 text-orange-700 border-orange-200", label: "Interview" },
      offer: { icon: Star, class: "bg-green-100 text-green-700 border-green-200", label: "Offer Extended" },
      accepted: { icon: CheckCircle, class: "bg-green-100 text-green-700 border-green-200", label: "Accepted" },
      rejected: { icon: XCircle, class: "bg-red-100 text-red-700 border-red-200", label: "Rejected" },
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading application details..." />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-12 text-center max-w-md">
          <XCircle size={64} weight="regular" className="text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Error</h2>
          <p className="text-red-600 mb-6">{error || "Application not found"}</p>
          <button
            onClick={() => navigate("/company/applicants")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={18} weight="regular" />
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  const { talent, job } = application;
  const statusConfig = getStatusConfig(application.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate("/company/applicants")}
            className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-primary transition-colors font-medium"
          >
            <ArrowLeft size={18} weight="regular" />
            Back to Applications
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div className="h-24 bg-slate-50 relative border-b border-slate-200">
                <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={talent.profile.avatar_url || `https://api.dicebear.com/6.x/initials/svg?seed=${talent.profile.full_name}`}
                      alt={talent.profile.full_name}
                      className="w-24 h-24 rounded-2xl border-4 border-white shadow-sm object-cover"
                    />
                  </div >
                  <span className={`px-4 py-2 ${statusConfig.class} rounded-lg border font-semibold text-sm flex items-center gap-2`}>
                    <StatusIcon size={16} weight="regular" />
                    {statusConfig.label}
                  </span>
                </div >
              </div >

              <div className="p-8">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{talent.profile.full_name}</h1>
                  <p className="text-xl text-slate-600 mb-4">{talent.title}</p>

                  <div className="flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium border border-slate-200">
                      <User size={16} weight="regular" />
                      {talent.experience_level}
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium border border-slate-200">
                      <MapPin size={16} weight="regular" />
                      {talent.location}
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium border border-green-200">
                      <CheckCircle size={16} weight="regular" />
                      {talent.availability_status}
                    </span>
                  </div>
                </div>

                {talent.bio && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <FileText size={20} weight="regular" className="text-primary" />
                      About
                    </h3>
                    <p className="text-slate-700 leading-relaxed">{talent.bio}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {talent.portfolio_url && (
                    <a
                      href={talent.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                    >
                      <Globe size={16} weight="regular" />
                      Portfolio
                      <ArrowSquareOut size={14} weight="regular" />
                    </a>
                  )}
                  {talent.linkedin_url && (
                    <a
                      href={talent.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                    >
                      LinkedIn
                      <ArrowSquareOut size={14} weight="regular" />
                    </a>
                  )}
                  {talent.github_url && (
                    <a
                      href={talent.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                    >
                      GitHub
                      <ArrowSquareOut size={14} weight="regular" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div >

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <PaperPlaneTilt size={24} weight="regular" className="text-primary" />
                  </div>
                  Quick Actions
                </h3>
                {updatingStatus && (
                  <div className="flex items-center space-x-2 bg-slate-100 rounded-lg px-4 py-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-slate-700">Updating...</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => openConfirmModal('interview')}
                  disabled={updatingStatus}
                  className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calendar size={32} weight="regular" className="mb-3 mx-auto text-primary" />
                  <p className="font-bold text-sm text-slate-900">Schedule Interview</p>
                  {application.status === 'interview' && (
                    <span className="mt-2 inline-block bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-lg border border-green-200">
                      ✓ Active
                    </span>
                  )}
                </button>

                <button
                  onClick={() => openConfirmModal('offer')}
                  disabled={updatingStatus}
                  className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Star size={32} weight="regular" className="mb-3 mx-auto text-primary" />
                  <p className="font-bold text-sm text-slate-900">Make Offer</p>
                  {application.status === 'offer' && (
                    <span className="mt-2 inline-block bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-lg border border-green-200">
                      ✓ Active
                    </span>
                  )}
                </button>

                <button
                  onClick={() => openConfirmModal('rejected')}
                  disabled={updatingStatus || application.status === 'rejected'}
                  className="bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl p-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle size={32} weight="regular" className="mb-3 mx-auto text-red-600" />
                  <p className="font-bold text-sm text-slate-900">Reject</p>
                  {application.status === 'rejected' && (
                    <span className="mt-2 inline-block bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-lg border border-red-200">
                      ✓ Done
                    </span>
                  )}
                </button>
              </div>

              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">Current Status:</span>{' '}
                  {statusConfig.label}
                </p>
              </div>
            </motion.div>

            {
              talentSkills && talentSkills.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
                >
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Star size={22} weight="regular" className="text-primary" />
                    Skills & Expertise
                  </h3>
                  <SkillsDisplay
                    skills={talentSkills}
                    variant="card"
                    showProficiency={true}
                  />
                </motion.div>
              )
            }

            {
              application.cover_letter && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
                >
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <FileText size={22} weight="regular" className="text-primary" />
                    Cover Letter
                  </h3>
                  <div className="prose max-w-none">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {application.cover_letter}
                    </p>
                  </div>
                </motion.div>
              )
            }

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <Download size={24} weight="regular" className="text-primary" />
                    </div>
                    Resume & Documents
                  </h3>
                  <p className="text-slate-600">Download and review candidate materials</p>
                </div>
              </div>

              {application.custom_resume_url ? (
                <a
                  href={application.custom_resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group w-full bg-primary text-white hover:bg-blue-700 font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3"
                >
                  <Download size={20} weight="regular" />
                  Download Resume
                  <ArrowSquareOut size={16} weight="regular" />
                </a>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                  <FileText size={48} weight="regular" className="mx-auto mb-3 text-slate-400" />
                  <p className="text-slate-600">No resume uploaded</p>
                </div>
              )}
            </motion.div>
          </div >

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Briefcase size={20} weight="regular" className="text-primary" />
                Job Details
              </h3>
              <div className="space-y-5">
                <div className="pb-4 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Position</span>
                  <p className="text-lg font-bold text-slate-900">{job.title}</p>
                </div>
                {job.location && (
                  <div className="pb-4 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Location</span>
                    <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <MapPin size={18} weight="regular" className="text-primary" />
                      {job.location}
                    </p>
                  </div>
                )}
                {job.salary_min && job.salary_max && (
                  <div className="pb-4 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Salary Range</span>
                    <p className="text-lg font-bold text-green-600">
                      ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Applied Date</span>
                  <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Calendar size={18} weight="regular" className="text-primary" />
                    {new Date(application.applied_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Envelope size={20} weight="regular" className="text-primary" />
                Contact Information
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <Envelope size={18} weight="regular" className="text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">{talent.profile.email}</span>
                </div>
                {talent.profile.email && (
                  <a
                    href={`mailto:${talent.profile.email}`}
                    className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    <Phone size={18} weight="regular" className="text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Call Candidate</span>
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        </div >
      </div >

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleStatusUpdate}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText="Yes, Proceed"
        cancelText="Cancel"
      />
    </div >
  );
};

export default ApplicationDetailPage;
