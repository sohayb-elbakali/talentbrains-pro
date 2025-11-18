import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { Toaster } from "sonner";
import { notify } from "./utils/notify";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CompanyDashboard from "./components/company/CompanyDashboard";
import CompanyProfileCompletion from "./components/company/CompanyProfileCompletion";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import TalentDashboard from "./components/dashboard/TalentDashboard";

import ErrorBoundary from "./components/ErrorBoundary";
import NetworkErrorBoundary from "./components/NetworkErrorBoundary";
import OfflineIndicator from "./components/OfflineIndicator";
import Layout from "./components/layout/Layout";
import LoadingSpinner from "./components/LoadingSpinner";
import TalentProfileCompletion from "./components/talent/TalentProfileCompletion";
import { useAuth } from "./hooks/useAuth";
import AdminProfilePage from "./pages/AdminProfilePage";
import AIMatchingPage from "./pages/AIMatchingPage";
import ApplicationDetailPage from "./pages/company/ApplicationDetailPage";
import CompanyApplicantsPage from "./pages/company/CompanyApplicantsPage";
import CompanyJobsPage from "./pages/company/CompanyJobsPage";
import CompanyMatchesPage from "./pages/company/CompanyMatchesPage";
import CreateJobPage from "./pages/company/CreateJobPage";
import CompanyJobDetailPage from "./pages/company/JobDetailPage";
import EditJobPage from "./pages/company/EditJobPage";
import CompanyProfilePage from "./pages/CompanyProfilePage";
import JobDetailPage from "./pages/JobDetailPage";
import JobsPage from "./pages/JobsPage";
import LandingPage from "./pages/LandingPage";
import SettingsPage from "./pages/SettingsPage";
import TalentApplicationsPage from "./pages/talent/TalentApplicationsPage";
import TalentProfilePage from "./pages/TalentProfilePage";
import TalentsPage from "./pages/TalentsPage";
import TalentPublicProfilePage from "./pages/TalentPublicProfilePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      networkMode: 'offlineFirst',
    },
  },
});

// Make queryClient available globally for cleanup on logout
if (typeof window !== 'undefined') {
  (window as any).queryClient = queryClient;
}

function AppContent() {
  const {
    isAuthenticated,
    profile,
    loading,
    checkProfileCompletion,
    profileCompletionStatus,
  } = useAuth();
  const [completionChecked, setCompletionChecked] = useState(false);

  // Check profile completion status when user is authenticated
  const checkCompletion = useCallback(async () => {
    if (isAuthenticated && profile && !completionChecked) {
      await checkProfileCompletion(true); // Force refresh to get latest status
      setCompletionChecked(true);
    }
  }, [isAuthenticated, profile, checkProfileCompletion, completionChecked]);

  useEffect(() => {
    checkCompletion();
  }, [checkCompletion]);

  // Show loading spinner while auth is loading
  if (loading) {
    return <LoadingSpinner fullScreen text="Loading application..." />;
  }

  const getDashboardRedirect = () => {
    if (!isAuthenticated) return <Navigate to="/" replace />;

    // Check if profile completion is needed
    if (profile && profileCompletionStatus.needsCompletion) {
      if (profileCompletionStatus.type === "company") {
        return <Navigate to="/company-profile-completion" replace />;
      } else if (profileCompletionStatus.type === "talent") {
        return <Navigate to="/talent-profile-completion" replace />;
      }
      // Admin users don't have a separate completion form, just redirect to dashboard
    }

    let dashboardUrl = "/company"; // default
    if (profile?.role === "talent") {
      dashboardUrl = "/talent";
    } else if (profile?.role === "admin") {
      dashboardUrl = "/admin";
    } else if (profile?.role === "company") {
      dashboardUrl = "/company";
    }

    return <Navigate to={dashboardUrl} replace />;
  };

  return (
    <Layout>
      <Routes>
        {/* Always show landing page at root */}
        <Route path="/" element={<LandingPage />} />

        {/* Dashboard redirect route */}
        <Route path="/dashboard" element={getDashboardRedirect()} />

        {/* Public Route */}
        <Route path="/landing" element={<LandingPage />} />

        {/* Profile Completion Routes */}
        <Route
          path="/profile-completion"
          element={
            profile?.role === "company" ? (
              <Navigate to="/company-profile-completion" replace />
            ) : profile?.role === "talent" ? (
              <Navigate to="/talent-profile-completion" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/company-profile-completion"
          element={<CompanyProfileCompletion />}
        />
        <Route
          path="/talent-profile-completion"
          element={<TalentProfileCompletion />}
        />

        {/* Profile Pages */}
        <Route
          path="/company-profile"
          element={
            <ProtectedRoute allowedRoles={["company"]}>
              <CompanyProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/talent-profile"
          element={
            <ProtectedRoute allowedRoles={["talent"]}>
              <TalentProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/talent"
          element={
            <ProtectedRoute allowedRoles={["talent"]}>
              <TalentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/talent/applications"
          element={
            <ProtectedRoute allowedRoles={["talent"]}>
              <TalentApplicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/talent/jobs"
          element={
            <ProtectedRoute allowedRoles={["talent"]}>
              <JobsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/*"
          element={
            <ProtectedRoute allowedRoles={["company"]}>
              <Routes>
                <Route index element={<CompanyDashboard />} />
                <Route path="jobs/create" element={<CreateJobPage />} />
                <Route path="jobs" element={<CompanyJobsPage />} />
                <Route path="applicants" element={<CompanyApplicantsPage />} />
                <Route
                  path="applicants/:applicationId"
                  element={<ApplicationDetailPage />}
                />
                <Route path="matches" element={<CompanyMatchesPage />} />
                <Route path="jobs/:jobId" element={<CompanyJobDetailPage />} />
                <Route path="jobs/:jobId/edit" element={<EditJobPage />} />
              </Routes>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <JobsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:jobId"
          element={
            <ProtectedRoute>
              <JobDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/talents"
          element={
            <ProtectedRoute allowedRoles={["company"]}>
              <TalentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/talents/:profileId"
          element={
            <ProtectedRoute allowedRoles={["company"]}>
              <TalentPublicProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-matching"
          element={
            <ProtectedRoute>
              <AIMatchingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              {profile?.role === "talent" ? (
                <TalentProfilePage />
              ) : profile?.role === "admin" ? (
                <AdminProfilePage />
              ) : (
                <CompanyProfilePage />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        {/* Legacy dashboard route - redirect to new dashboard route */}
        <Route
          path="/dashboard-legacy"
          element={
            <Navigate
              to={
                profile?.role === "admin"
                  ? "/admin"
                  : profile?.role === "company"
                    ? "/company"
                    : "/talent"
              }
              replace
            />
          }
        />

        {/* Catch-all redirects to the landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    const handleError = (event: any) => {
      if (event?.error?.message?.includes("message port closed")) {
        notify.showError(
          "A browser extension or session error occurred. Try disabling extensions or clearing storage."
        );
        event.preventDefault();
      }
    };
    const handleUnhandledRejection = (event: any) => {
      if (event?.reason?.message?.includes("message port closed")) {
        notify.showError(
          "A browser extension or session error occurred. Try disabling extensions or clearing storage."
        );
        event.preventDefault();
      }
    };
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  return (
    <ErrorBoundary>
      <NetworkErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <OfflineIndicator />
          <Toaster 
            position="top-right" 
            richColors 
            expand={false} 
            closeButton
            offset="80px"
            toastOptions={{
              style: {
                borderRadius: '16px',
                padding: '16px',
                fontSize: '14px',
                fontWeight: '500',
              },
              className: 'sonner-toast',
            }}
          />
          <Router>
            <AppContent />
          </Router>
        </QueryClientProvider>
      </NetworkErrorBoundary>
    </ErrorBoundary>
  );
}

export default App;
