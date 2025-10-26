import { motion } from 'framer-motion';
import { 
  ArrowLeft, Briefcase, Calendar, CheckCircle, Clock, Download, 
  ExternalLink, FileText, Github, Globe, Linkedin, Mail, 
  MapPin, MessageSquare, Star, TrendingUp, User, XCircle, Send, Phone
} from 'lucide-react';
import { useEffect, useState } from "react";
import { notificationManager } from "../../utils/notificationManager";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmationModal from "../../components/ConfirmationModal";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../lib/supabase";

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
      toast.error("Failed to load application details");
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
      
      toast.success(`Status updated to ${confirmModal.status}`);
      fetchApplicationDetail();
    } catch (err: any) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: any = {
      pending: { icon: Clock, class: "from-yellow-400 to-orange-400", label: "Pending Review" },
      reviewed: { icon: CheckCircle, class: "from-blue-400 to-cyan-400", label: "Reviewed" },
      interview: { icon: Calendar, class: "from-purple-400 to-pink-400", label: "Interview" },
      offer: { icon: Star, class: "from-green-400 to-emerald-400", label: "Offer Extended" },
      accepted: { icon: CheckCircle, class: "from-green-500 to-teal-500", label: "Accepted" },
      rejected: { icon: XCircle, class: "from-red-400 to-pink-400", label: "Rejected" },
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-200 p-12 text-center max-w-md">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-red-600 mb-6">{error || "Application not found"}</p>
          <button
            onClick={() => navigate("/company/applicants")}
            className="btn btn-primary"
          >
            <ArrowLeft size={18} />
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate("/company/applicants")}
            className="btn btn-secondary mb-4"
          >
            <ArrowLeft size={18} />
            Back to Applications
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden"
            >
              <div className={`h-32 bg-gradient-to-r ${statusConfig.class} relative`}>
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={talent.profile.avatar_url || `https://api.dicebear.com/6.x/initials/svg?seed=${talent.profile.full_name}`}
                      alt={talent.profile.full_name}
                      className="w-24 h-24 rounded-2xl border-4 border-white shadow-2xl object-cover"
                    />
                  </div>
                  <span className={`px-4 py-2 bg-white rounded-xl shadow-lg flex items-center gap-2 font-bold text-gray-900`}>
                    <StatusIcon size={18} />
                    {statusConfig.label}
                  </span>
                </div>
              </div>

              <div className="p-8">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{talent.profile.full_name}</h1>
                  <p className="text-xl text-gray-600 mb-4">{talent.title}</p>
                  
                  <div className="flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-xl font-semibold">
                      <TrendingUp size={16} />
                      {talent.experience_level}
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-xl font-semibold">
                      <MapPin size={16} />
                      {talent.location}
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-xl font-semibold">
                      <User size={16} />
                      {talent.availability_status}
                    </span>
                  </div>
                </div>

                {talent.bio && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText size={20} className="text-purple-600" />
                      About
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{talent.bio}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {talent.portfolio_url && (
                    <a
                      href={talent.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      <Globe size={16} />
                      Portfolio
                      <ExternalLink size={14} />
                    </a>
                  )}
                  {talent.linkedin_url && (
                    <a
                      href={talent.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      <Linkedin size={16} />
                      LinkedIn
                      <ExternalLink size={14} />
                    </a>
                  )}
                  {talent.github_url && (
                    <a
                      href={talent.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      <Github size={16} />
                      GitHub
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-2xl border-2 border-purple-200 p-8 text-white"
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Send size={24} />
                </div>
                Quick Actions
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => openConfirmModal('interview')}
                  disabled={updatingStatus || application.status === 'interview'}
                  className="group relative overflow-hidden bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <Calendar className="h-8 w-8 mb-3 mx-auto" />
                    <p className="font-bold text-sm">Schedule Interview</p>
                  </div>
                </button>

                <button
                  onClick={() => openConfirmModal('offer')}
                  disabled={updatingStatus || application.status === 'offer'}
                  className="group relative overflow-hidden bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <Star className="h-8 w-8 mb-3 mx-auto" />
                    <p className="font-bold text-sm">Make Offer</p>
                  </div>
                </button>

                <button
                  onClick={() => openConfirmModal('rejected')}
                  disabled={updatingStatus || application.status === 'rejected'}
                  className="group relative overflow-hidden bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <XCircle className="h-8 w-8 mb-3 mx-auto" />
                    <p className="font-bold text-sm">Reject</p>
                  </div>
                </button>
              </div>

              <div className="mt-6 pt-6 border-t-2 border-white/20">
                <button className="w-full bg-white text-purple-600 hover:bg-gray-50 font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group">
                  <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
                  Send Message to Candidate
                  <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>

            {talentSkills && talentSkills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Star size={22} className="text-purple-600" />
                  Skills & Expertise
                </h3>
                <div className="flex flex-wrap gap-3">
                  {talentSkills.map((skill: any, index: number) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-xl font-semibold shadow-sm hover:shadow-md transition-shadow"
                    >
                      {typeof skill === 'string' ? skill : skill.name}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {application.cover_letter && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FileText size={22} className="text-purple-600" />
                  Cover Letter
                </h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {application.cover_letter}
                  </p>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-2xl border-2 border-blue-200 p-8 text-white"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Download size={24} />
                    </div>
                    Resume & Documents
                  </h3>
                  <p className="text-blue-100">Download and review candidate materials</p>
                </div>
              </div>
              
              {application.custom_resume_url ? (
                <a
                  href={application.custom_resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group w-full bg-white text-blue-600 hover:bg-gray-50 font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <Download size={20} className="group-hover:scale-110 transition-transform" />
                  Download Resume
                  <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
                </a>
              ) : (
                <div className="bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-xl p-6 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-white/80">No resume uploaded</p>
                </div>
              )}
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Briefcase size={20} className="text-purple-600" />
                Job Details
              </h3>
              <div className="space-y-5">
                <div className="pb-4 border-b-2 border-gray-100">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Position</span>
                  <p className="text-lg font-bold text-gray-900">{job.title}</p>
                </div>
                {job.location && (
                  <div className="pb-4 border-b-2 border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Location</span>
                    <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <MapPin size={18} className="text-purple-600" />
                      {job.location}
                    </p>
                  </div>
                )}
                {job.salary_min && job.salary_max && (
                  <div className="pb-4 border-b-2 border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Salary Range</span>
                    <p className="text-lg font-bold text-green-600">
                      ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Applied Date</span>
                  <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Calendar size={18} className="text-blue-600" />
                    {new Date(application.applied_at).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                {application.reviewed_at && (
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Reviewed Date</span>
                    <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-600" />
                      {new Date(application.reviewed_at).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-2xl p-6 text-white"
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Mail size={20} />
                Contact Information
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3">
                  <Mail size={18} />
                  <span className="text-sm font-medium">{talent.profile.email}</span>
                </div>
                {talent.profile.email && (
                  <a 
                    href={`mailto:${talent.profile.email}`}
                    className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-colors"
                  >
                    <Phone size={18} />
                    <span className="text-sm font-medium">Call Candidate</span>
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default ApplicationDetailPage;
