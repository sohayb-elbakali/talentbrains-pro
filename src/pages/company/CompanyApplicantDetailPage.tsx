import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Briefcase,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Download,
    Eye,
    FileText,
    Mail,
    MapPin,
    Phone,
    Star,
    User,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { notify } from "../../utils/notify";
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth, useUserData } from "../../hooks/useAuth";
import { db } from '../../lib/supabase';
import type { Application } from '../../types/database';
import { useQueryClient } from '@tanstack/react-query';

interface ApplicationWithDetails extends Application {
  job: {
    id: string;
    title: string;
    description: string;
    location: string;
    employment_type: string;
    salary_min?: number;
    salary_max?: number;
    companies: {
      id: string;
      name: string;
      logo_url?: string;
    };
  };
  talents: {
    id: string;
    title: string;
    bio?: string;
    location?: string;
    experience_level: string;
    years_of_experience: number;
    hourly_rate_min?: number;
    hourly_rate_max?: number;
    salary_expectation_min?: number;
    salary_expectation_max?: number;
    portfolio_url?: string;
    resume_url?: string;
    github_url?: string;
    linkedin_url?: string;
    profiles: {
      full_name: string;
      avatar_url?: string;
      email: string;
      phone?: string;
    };
  };
}

const CompanyApplicantDetailPage = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const {
    data,
    isLoading: userDataLoading,
    error: userDataError,
    refetch,
  } = useUserData(profile?.id);
  const company = data?.company;
  const navigate = useNavigate();
  const [application, setApplication] = useState<ApplicationWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number | null>(null);

  useEffect(() => {
    if (!applicationId || !company?.id) return;

    const fetchApplicationDetails = async () => {
      try {
        setLoading(true);
        const { data, error } = await db.getApplications({
          company_id: company.id,
          application_id: applicationId,
        });

        if (error) throw error;

        if (!data || data.length === 0) {
          setError(
            "Application not found or you do not have permission to view it."
          );
          return;
        }

        const appData = data[0] as ApplicationWithDetails;
        setApplication(appData);
        setNotes(appData.notes || "");
        setFeedback(appData.feedback || "");
        setRating(appData.rating || null);

        // Mark as reviewed if it's still pending
        if (appData.status === "pending") {
          await handleStatusUpdate("reviewed");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationDetails();
  }, [applicationId, company]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!application) return;

    try {
      setUpdating(true);
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === "reviewed" && !application.reviewed_at) {
        updates.reviewed_at = new Date().toISOString();
      }

      const { error } = await db.updateApplication(application.id, updates);

      if (error) throw error;

      // Update local state immediately
      setApplication((prev) => (prev ? { ...prev, ...updates } : null));
      
      // Invalidate React Query cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['company-applications'] });
      
      // Show success notification
      notify.showSuccess(`Application status updated to ${newStatus}`);
    } catch (err: any) {
      notify.showError("Failed to update application status");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!application) return;

    try {
      setUpdating(true);
      const updates = {
        notes,
        feedback,
        rating,
        updated_at: new Date().toISOString(),
      };

      const { error } = await db.updateApplication(application.id, updates);

      if (error) throw error;

      setApplication((prev) => (prev ? { ...prev, ...updates } : null));
      
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ['company-applications'] });
      
      notify.showSuccess("Notes and feedback saved successfully");
    } catch (err: any) {
      notify.showError("Failed to save notes and feedback");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses =
      "px-3 py-1 text-sm font-semibold rounded-full inline-flex items-center";
    switch (status) {
      case "pending":
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            <Clock size={16} className="mr-1" />
            Pending
          </span>
        );
      case "reviewed":
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            <Eye size={16} className="mr-1" />
            Reviewed
          </span>
        );
      case "interview":
        return (
          <span className={`${baseClasses} bg-purple-100 text-purple-800`}>
            <Calendar size={16} className="mr-1" />
            Interview
          </span>
        );
      case "offer":
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <CheckCircle size={16} className="mr-1" />
            Offer
          </span>
        );
      case "accepted":
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <CheckCircle size={16} className="mr-1" />
            Accepted
          </span>
        );
      case "rejected":
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <XCircle size={16} className="mr-1" />
            Rejected
          </span>
        );
      case "withdrawn":
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            <XCircle size={16} className="mr-1" />
            Withdrawn
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            Unknown
          </span>
        );
    }
  };

  if (userDataLoading) {
    return <div>Loading user data...</div>;
  }
  if (userDataError) {
    return <div>Error loading profile: {userDataError.message}</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Application</h3>
          <p className="text-red-600 mb-4">{error || 'Application not found'}</p>
          <Link
            to="/company/applicants"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applicants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/company/applicants')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applicants
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Applicant Details</h1>
        </div>
        {getStatusBadge(application.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Profile */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-start space-x-6">
              <img
                src={application.talents.profiles.avatar_url || `https://api.dicebear.com/6.x/initials/svg?seed=${application.talents.profiles.full_name}`}
                alt={application.talents.profiles.full_name}
                className="w-24 h-24 rounded-full object-cover"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {application.talents.profiles.full_name}
                </h2>
                <p className="text-lg text-gray-600 mb-3">{application.talents.title}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {application.talents.location || 'Location not specified'}
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    {application.talents.experience_level} level ({application.talents.years_of_experience} years)
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {application.talents.profiles.email}
                  </div>
                  {application.talents.profiles.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {application.talents.profiles.phone}
                    </div>
                  )}
                </div>

                {application.talents.bio && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
                    <p className="text-gray-600">{application.talents.bio}</p>
                  </div>
                )}

                {/* Salary Expectations */}
                {(application.talents.salary_expectation_min || application.talents.hourly_rate_min) && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Compensation Expectations</h4>
                    <div className="text-gray-600">
                      {application.talents.salary_expectation_min && (
                        <p>Salary: ${application.talents.salary_expectation_min?.toLocaleString()} - ${application.talents.salary_expectation_max?.toLocaleString()}/year</p>
                      )}
                      {application.talents.hourly_rate_min && (
                        <p>Hourly: ${application.talents.hourly_rate_min} - ${application.talents.hourly_rate_max}/hour</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Links */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {application.talents.portfolio_url && (
                    <a
                      href={application.talents.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Portfolio
                    </a>
                  )}
                  {application.talents.resume_url && (
                    <a
                      href={application.talents.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Resume
                    </a>
                  )}
                  {application.talents.github_url && (
                    <a
                      href={application.talents.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                    >
                      GitHub
                    </a>
                  )}
                  {application.talents.linkedin_url && (
                    <a
                      href={application.talents.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Applied Position</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900">{application.job.title}</h4>
                <p className="text-gray-600">{application.job.companies.name}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  {application.job.location}
                </div>
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                  {application.job.employment_type.replace('_', ' ')}
                </div>
                {application.job.salary_min && (
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                    ${application.job.salary_min?.toLocaleString()} - ${application.job.salary_max?.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cover Letter */}
          {application.cover_letter && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Cover Letter</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{application.cover_letter}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Application Timeline */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Application Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Applied</p>
                  <p className="text-xs text-gray-500">{new Date(application.applied_at).toLocaleDateString()}</p>
                </div>
              </div>
              {application.reviewed_at && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Reviewed</p>
                    <p className="text-xs text-gray-500">{new Date(application.reviewed_at).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              {application.interview_scheduled_at && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Interview Scheduled</p>
                    <p className="text-xs text-gray-500">{new Date(application.interview_scheduled_at).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Actions */}
          <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-xl border-2 border-purple-100 p-6 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Update Application Status
              </h3>
              {updating && (
                <div className="flex items-center space-x-2 text-purple-600">
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Updating...</span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleStatusUpdate('interview')}
                disabled={updating || application.status === 'interview'}
                className="group w-full px-5 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Calendar className="h-5 w-5" />
                <span>Schedule Interview</span>
              </button>
              <button
                onClick={() => handleStatusUpdate('offer')}
                disabled={updating || application.status === 'offer'}
                className="group w-full px-5 py-3.5 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <CheckCircle className="h-5 w-5" />
                <span>Make Offer</span>
              </button>
              <button
                onClick={() => handleStatusUpdate('rejected')}
                disabled={updating || application.status === 'rejected'}
                className="group w-full px-5 py-3.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <XCircle className="h-5 w-5" />
                <span>Reject Application</span>
              </button>
            </div>
            
            {/* Status Description */}
            <div className="mt-4 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-purple-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">Current Status:</span>{' '}
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </p>
              {application.status === 'pending' && (
                <p className="text-xs text-gray-500 mt-1">
                  ⏳ Awaiting review - Take action to move this application forward
                </p>
              )}
              {application.status === 'reviewed' && (
                <p className="text-xs text-gray-500 mt-1">
                  ✓ Reviewed - Ready for next steps
                </p>
              )}
              {application.status === 'interview' && (
                <p className="text-xs text-gray-500 mt-1">
                  📅 Interview scheduled - Prepare for candidate meeting
                </p>
              )}
              {application.status === 'offer' && (
                <p className="text-xs text-gray-500 mt-1">
                  🎉 Offer extended - Awaiting candidate response
                </p>
              )}
              {application.status === 'rejected' && (
                <p className="text-xs text-gray-500 mt-1">
                  ❌ Application declined
                </p>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rating</h3>
            <div className="flex space-x-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-1 ${
                    rating && star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-400`}
                >
                  <Star className="h-6 w-6 fill-current" />
                </button>
              ))}
            </div>
            {rating && (
              <p className="text-sm text-gray-600 mb-4">
                {rating === 1 && 'Poor fit'}
                {rating === 2 && 'Below average'}
                {rating === 3 && 'Average candidate'}
                {rating === 4 && 'Good candidate'}
                {rating === 5 && 'Excellent candidate'}
              </p>
            )}
          </div>

          {/* Notes and Feedback */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Notes & Feedback</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internal Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Add internal notes about this candidate..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback for Candidate
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Feedback to share with the candidate..."
                />
              </div>
              <button
                onClick={handleSaveNotes}
                disabled={updating}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Saving...' : 'Save Notes & Feedback'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CompanyApplicantDetailPage;
