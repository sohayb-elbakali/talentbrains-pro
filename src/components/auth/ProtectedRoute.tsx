import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import LoadingSpinner from "../ui/LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, loading, profile, checkProfileCompletion } =
    useAuth();
  const [profileCompletionStatus, setProfileCompletionStatus] = useState<{
    needsCompletion: boolean;
    type: string | null;
  }>({ needsCompletion: false, type: null });
  const [completionChecked, setCompletionChecked] = useState(false);

  // Check profile completion status
  const checkCompletion = useCallback(async () => {
    if (isAuthenticated && profile && !completionChecked) {
      const status = await checkProfileCompletion();
      setProfileCompletionStatus(status);
      setCompletionChecked(true);
    }
  }, [isAuthenticated, profile, checkProfileCompletion, completionChecked]);

  useEffect(() => {
    checkCompletion();
  }, [checkCompletion]);

  if (loading || (isAuthenticated && profile && !completionChecked)) {
    return <LoadingSpinner fullScreen text="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check if user needs to complete profile
  const needsProfileCompletion = profileCompletionStatus.needsCompletion;
  const currentPath = window.location.pathname;

  // If user needs profile completion and is not on a profile completion page
  if (needsProfileCompletion && !currentPath.includes("profile-completion")) {
    if (profileCompletionStatus.type === "company") {
      return <Navigate to="/company-profile-completion" replace />;
    } else if (profileCompletionStatus.type === "talent") {
      return <Navigate to="/talent-profile-completion" replace />;
    }
  }

  // If user doesn't need profile completion but is on a profile completion page
  if (!needsProfileCompletion && currentPath.includes("profile-completion")) {
    const dashboardUrl = profile?.role === "talent" ? "/talent" : "/company";
    return <Navigate to={dashboardUrl} replace />;
  }

  const userRole = profile?.role;
  if (allowedRoles && userRole && !allowedRoles.includes(userRole as any)) {
    const defaultDashboard = userRole === "talent" ? "/talent" : "/company";
    return <Navigate to={defaultDashboard} replace />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

export default ProtectedRoute;
