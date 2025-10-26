import { useEffect, useState } from 'react';
import { CheckCircle, Clock, UserCheck, Gift, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusUpdateNotificationProps {
  status: string;
  jobTitle: string;
  companyName: string;
  onClose: () => void;
}

const StatusUpdateNotification: React.FC<StatusUpdateNotificationProps> = ({
  status,
  jobTitle,
  companyName,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'reviewed':
        return {
          icon: <UserCheck className="h-6 w-6" />,
          color: 'bg-blue-500',
          title: 'Application Reviewed',
          message: 'Your application has been reviewed by the company'
        };
      case 'interview':
        return {
          icon: <Clock className="h-6 w-6" />,
          color: 'bg-purple-500',
          title: 'Interview Scheduled',
          message: 'Congratulations! You\'ve been invited for an interview'
        };
      case 'offer':
        return {
          icon: <Gift className="h-6 w-6" />,
          color: 'bg-green-500',
          title: 'Job Offer Received',
          message: 'Amazing! You\'ve received a job offer'
        };
      case 'accepted':
        return {
          icon: <CheckCircle className="h-6 w-6" />,
          color: 'bg-green-600',
          title: 'Offer Accepted',
          message: 'Your application has been accepted'
        };
      case 'rejected':
        return {
          icon: <XCircle className="h-6 w-6" />,
          color: 'bg-red-500',
          title: 'Application Update',
          message: 'Your application status has been updated'
        };
      default:
        return {
          icon: <CheckCircle className="h-6 w-6" />,
          color: 'bg-gray-500',
          title: 'Status Updated',
          message: 'Your application status has been updated'
        };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.3 }}
          className="fixed top-4 right-4 z-50 max-w-sm w-full"
        >
          <div className={`${statusInfo.color} rounded-lg shadow-lg text-white p-4`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {statusInfo.icon}
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium">
                  {statusInfo.title}
                </p>
                <p className="mt-1 text-sm opacity-90">
                  {statusInfo.message}
                </p>
                <div className="mt-2 text-xs opacity-75">
                  <p className="font-medium">{jobTitle}</p>
                  <p>{companyName}</p>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  type="button"
                  className="inline-flex text-white hover:text-gray-200 focus:outline-none"
                  onClick={() => {
                    setIsVisible(false);
                    setTimeout(onClose, 300);
                  }}
                >
                  <span className="sr-only">Close</span>
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StatusUpdateNotification;
