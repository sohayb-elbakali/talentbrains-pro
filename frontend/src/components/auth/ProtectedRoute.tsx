import { motion } from 'framer-motion';
import React from "react";
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
  const { isAuthenticated, loading, profile, profileCompletionStatus } = useAuth();

  // Show loading while auth is being checked
  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Wait for profile to be loaded
  if (!profile) {
    return <LoadingSpinner fullScreen text="Loading profile..." />;
  }

  // Redirect to profile completion if needed
  if (profileCompletionStatus.needsCompletion) {
    return <Navigate to="/profile-completion" replace />;
  }

  // Check role-based access
  const userRole = profile.role;
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    const defaultDashboard = userRole === "talent" ? "/talent" :
      userRole === "admin" ? "/admin" : "/company";
    return <Navigate to={defaultDashboard} replace />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

export default ProtectedRoute;

