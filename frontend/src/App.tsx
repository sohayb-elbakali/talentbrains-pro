import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useEffect } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { Toaster } from "sonner";
import { notify } from "./utils/notify";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ErrorBoundary from "./components/error/ErrorBoundary";
import NetworkErrorBoundary from "./components/error/NetworkErrorBoundary";
import OfflineIndicator from "./components/notifications/OfflineIndicator";
import Layout from "./components/layout/Layout";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import { useAuth } from "./hooks/useAuth";

// Lazy loaded components
import {
  LandingPage,
  TalentPublicProfilePage,
  CompanyDashboard,
  CompanyJobsPage,
  CreateJobPage,
  EditJobPage,
  CompanyJobDetailPage,
  CompanyApplicantsPage,
  ApplicationDetailPage,
  CompanyMatchesPage,
  CompanyProfilePage,
  JobMatchingResultsPage,
  TalentDashboard,
  TalentApplicationsPage,
  TalentProfilePage,
  TalentsPage,
  TalentMatchesPage,
  AdminDashboard,
  AdminProfilePage,
  JobsPage,
  JobDetailPage,
  SettingsPage,
  AIMatchingPage,
  MatchingDashboard,
  CompanyProfileCompletion,
  TalentProfileCompletion,
} from "./lib/lazyComponents";


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
  const { isAuthenticated, profile, loading, profileCompletionStatus } = useAuth();

  // Show loading spinner while auth is loading
  if (loading) {
    return <LoadingSpinner fullScreen text="Loading application..." />;
  }

  const getDashboardRedirect = () => {
    if (!isAuthenticated) return <Navigate to="/" replace />;

    // Check if profile completion is needed
    if (profileCompletionStatus.needsCompletion) {
      return <Navigate to="/profile-completion" replace />;
    }

    // Simply redirect to role-based dashboard
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
      <Suspense fallback={<LoadingSpinner fullScreen text="Loading..." />}>
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
            path="/talent/matches"
            element={
              <ProtectedRoute allowedRoles={["talent"]}>
                <TalentMatchesPage />
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
                  <Route path="jobs/:jobId/matching" element={<JobMatchingResultsPage />} />
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
            path="/talents/:talentId"
            element={
              <ProtectedRoute>
                <TalentPublicProfilePage />
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
            path="/matching"
            element={
              <ProtectedRoute>
                <MatchingDashboard />
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
      </Suspense>
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
