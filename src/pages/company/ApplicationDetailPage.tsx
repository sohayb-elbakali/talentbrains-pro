import {
  ArrowLeft, Briefcase, Calendar, CheckCircle, Clock, Download,
  ArrowSquareOut, FileText, MapPin, User, XCircle, Star, Envelope
} from '@phosphor-icons/react';
import { useEffect, useState } from "react";
import { notify } from "../../utils/notify";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../lib/supabase/index";
import { useQueryClient } from '@tanstack/react-query';
import SkillsDisplay from "../../components/skills/SkillsDisplay";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

interface ApplicationDetail {
  id: string;
  status: string;
  applied_at: string;
  cover_letter?: string;
  custom_resume_url?: string;
  job: {
    id: string;
    title: string;
    location?: string;
    salary_min?: number;
    salary_max?: number;
  };
  talent: {
    id: string;
    title: string;
    bio: string;
    experience_level: string;
    location: string;
    availability_status: string;
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
  }>({ isOpen: false, status: '', title: '', message: '', type: 'warning' });

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
      if (fetchError) throw new Error(fetchError.message);
      if (!data) throw new Error("Application not found");
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
      interview: { title: 'Schedule Interview?', message: 'This will notify the candidate.', type: 'info' },
      offer: { title: 'Make Job Offer?', message: 'This will send an offer to the candidate.', type: 'warning' },
      rejected: { title: 'Reject Application?', message: 'The candidate will be notified.', type: 'danger' }
    };
    const config = configs[status];
    if (config) setConfirmModal({ isOpen: true, status, ...config });
  };

  const handleStatusUpdate = async () => {
    if (!application || !confirmModal.status) return;
    try {
      setUpdatingStatus(true);
      const { error } = await db.updateApplication(application.id, { status: confirmModal.status });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['company-applications'] });
      notify.showSuccess(`Status updated to ${confirmModal.status}`);
      fetchApplicationDetail();
    } catch (err: any) {
      notify.showError("Failed to update status");
    } finally {
      setUpdatingStatus(false);
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-amber-100 text-amber-700", label: "Pending" },
      reviewed: { color: "bg-blue-100 text-blue-700", label: "Reviewed" },
      interview: { color: "bg-purple-100 text-purple-700", label: "Interview" },
      offer: { color: "bg-green-100 text-green-700", label: "Offer" },
      accepted: { color: "bg-green-100 text-green-700", label: "Accepted" },
      rejected: { color: "bg-red-100 text-red-700", label: "Rejected" },
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading application..." />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-md">
          <XCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error || "Not found"}</p>
          <button
            onClick={() => navigate("/company/applicants")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  const { talent, job } = application;
  const statusConfig = getStatusConfig(application.status);

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back */}
        <button
          onClick={() => navigate("/company/applicants")}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft size={18} weight="bold" />
          <span className="font-medium">Back to Applications</span>
        </button>

        {/* Candidate Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <img
              src={talent.profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${talent.profile.full_name}&backgroundColor=dbeafe`}
              alt=""
              className="w-16 h-16 rounded-xl object-cover border border-slate-200"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{talent.profile.full_name}</h1>
                  <p className="text-blue-600 font-medium">{talent.title}</p>
                </div>
                <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <User size={16} /> {talent.experience_level}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={16} /> {talent.location}
                </span>
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle size={16} /> {talent.availability_status}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {talent.portfolio_url && (
                  <a href={talent.portfolio_url} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 flex items-center gap-1">
                    Portfolio <ArrowSquareOut size={14} />
                  </a>
                )}
                {talent.linkedin_url && (
                  <a href={talent.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 flex items-center gap-1">
                    LinkedIn <ArrowSquareOut size={14} />
                  </a>
                )}
                {talent.github_url && (
                  <a href={talent.github_url} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 flex items-center gap-1">
                    GitHub <ArrowSquareOut size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="font-bold text-slate-900 mb-4">Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => openConfirmModal('interview')}
              disabled={updatingStatus}
              className={`p-4 rounded-xl border text-center transition-all ${application.status === 'interview'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 hover:border-blue-300'
                }`}
            >
              <Calendar size={24} className="mx-auto mb-2 text-blue-600" />
              <span className="text-sm font-medium">Interview</span>
            </button>
            <button
              onClick={() => openConfirmModal('offer')}
              disabled={updatingStatus}
              className={`p-4 rounded-xl border text-center transition-all ${application.status === 'offer'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-white border-slate-200 hover:border-green-300'
                }`}
            >
              <Star size={24} className="mx-auto mb-2 text-green-600" />
              <span className="text-sm font-medium">Make Offer</span>
            </button>
            <button
              onClick={() => openConfirmModal('rejected')}
              disabled={updatingStatus || application.status === 'rejected'}
              className={`p-4 rounded-xl border text-center transition-all ${application.status === 'rejected'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-white border-slate-200 hover:border-red-300'
                }`}
            >
              <XCircle size={24} className="mx-auto mb-2 text-red-600" />
              <span className="text-sm font-medium">Reject</span>
            </button>
          </div>
        </div>

        {/* Job Applied For */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Briefcase size={18} className="text-blue-600" />
            Applied For
          </h2>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-slate-900">{job.title}</p>
            {job.location && (
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <MapPin size={14} /> {job.location}
              </p>
            )}
            {job.salary_min && job.salary_max && (
              <p className="text-sm text-green-600 font-medium">
                ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
              </p>
            )}
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <Clock size={14} /> Applied {new Date(application.applied_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* About */}
        {talent.bio && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              About
            </h2>
            <p className="text-slate-700 leading-relaxed">{talent.bio}</p>
          </div>
        )}

        {/* Skills */}
        {talentSkills.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Star size={18} className="text-blue-600" />
              Skills
            </h2>
            <SkillsDisplay skills={talentSkills} variant="card" showProficiency={true} />
          </div>
        )}

        {/* Cover Letter */}
        {application.cover_letter && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              Cover Letter
            </h2>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{application.cover_letter}</p>
          </div>
        )}

        {/* Resume */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Download size={18} className="text-blue-600" />
            Resume
          </h2>
          {application.custom_resume_url ? (
            <a
              href={application.custom_resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Download size={18} />
              Download Resume
              <ArrowSquareOut size={14} />
            </a>
          ) : (
            <p className="text-slate-500">No resume uploaded</p>
          )}
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Envelope size={18} className="text-blue-600" />
            Contact
          </h2>
          <a
            href={`mailto:${talent.profile.email}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
          >
            <Envelope size={18} />
            {talent.profile.email}
          </a>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleStatusUpdate}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ApplicationDetailPage;
