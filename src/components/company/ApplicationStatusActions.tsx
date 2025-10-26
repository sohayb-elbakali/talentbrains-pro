import { useState } from "react";
import { notificationManager } from "../../utils/notificationManager";
import { db } from "../../lib/supabase";
import { APPLICATION_STATUSES } from "../../utils/constants";

interface ApplicationStatusActionsProps {
  applicationId: string;
  currentStatus: string;
  onStatusUpdate: () => void;
}

const ApplicationStatusActions: React.FC<ApplicationStatusActionsProps> = ({
  applicationId,
  currentStatus,
  onStatusUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) {
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Add reviewed_at timestamp when moving to reviewed status
      if (newStatus === APPLICATION_STATUSES.REVIEWED && currentStatus === APPLICATION_STATUSES.PENDING) {
        updateData.reviewed_at = new Date().toISOString();
      }

      const { error } = await db.updateApplication(applicationId, updateData);

      if (error) {
        throw new Error(error.message || "Failed to update application status");
      }

      toast.success(`Application status updated to ${newStatus}`);
      onStatusUpdate();
      setShowDropdown(false);
    } catch (err: any) {
      console.error("Error updating application status:", err);
      toast.error("Failed to update application status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      reviewed: "bg-blue-100 text-blue-800 border-blue-200",
      interview: "bg-purple-100 text-purple-800 border-purple-200",
      offer: "bg-green-100 text-green-800 border-green-200",
      accepted: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      withdrawn: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getAvailableStatuses = () => {
    const allStatuses = Object.values(APPLICATION_STATUSES);
    
    // Define allowed transitions
    const allowedTransitions: Record<string, string[]> = {
      [APPLICATION_STATUSES.PENDING]: [
        APPLICATION_STATUSES.REVIEWED,
        APPLICATION_STATUSES.REJECTED,
      ],
      [APPLICATION_STATUSES.REVIEWED]: [
        APPLICATION_STATUSES.INTERVIEW,
        APPLICATION_STATUSES.REJECTED,
      ],
      [APPLICATION_STATUSES.INTERVIEW]: [
        APPLICATION_STATUSES.OFFER,
        APPLICATION_STATUSES.REJECTED,
      ],
      [APPLICATION_STATUSES.OFFER]: [
        APPLICATION_STATUSES.ACCEPTED,
        APPLICATION_STATUSES.REJECTED,
      ],
      [APPLICATION_STATUSES.ACCEPTED]: [], // Final status
      [APPLICATION_STATUSES.REJECTED]: [], // Final status
      [APPLICATION_STATUSES.WITHDRAWN]: [], // Final status
    };

    return allowedTransitions[currentStatus] || [];
  };

  const availableStatuses = getAvailableStatuses();

  // Don't show actions for final statuses
  if (availableStatuses.length === 0) {
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(currentStatus)}`}>
        {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loading}
        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(currentStatus)} ${
          loading ? "opacity-50 cursor-not-allowed" : "hover:opacity-80 cursor-pointer"
        }`}
      >
        {loading ? "Updating..." : currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
        {!loading && (
          <svg className="inline ml-1 w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {showDropdown && !loading && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            {availableStatuses.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${getStatusColor(status).split(' ')[0]}`}></span>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  );
};

export default ApplicationStatusActions;
