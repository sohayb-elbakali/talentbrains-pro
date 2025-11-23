import { useEffect } from 'react';
import { notify } from "../../utils/notify";
import { useAuth } from '../../hooks/useAuth';

interface AuthErrorHandlerProps {
  children: React.ReactNode;
}

/**
 * Component that handles authentication errors globally
 * This component should wrap the entire application to catch auth errors
 */
const AuthErrorHandler: React.FC<AuthErrorHandlerProps> = ({ children }) => {
  const { clearAuth } = useAuth();

  useEffect(() => {
    // Global error handler for unhandled promise rejections
    const handleUnhandledRejection = async (event: PromiseRejectionEvent) => {
      const error = event.reason;

      if (isAuthError(error)) {
        console.log('Unhandled auth error detected:', error);
        event.preventDefault(); // Prevent the error from being logged to console

        toast.error("Your session has expired. Please sign in again.");
        clearAuth();

        // Force sign out to clear any corrupted session data
        try {
          const { auth } = await import('../../lib/supabase');
          await auth.signOut();
        } catch (signOutError) {
          console.error('Error during forced sign out:', signOutError);
        }
      }
    };

    // Global error handler for window errors
    const handleWindowError = async (event: ErrorEvent) => {
      const error = event.error;

      if (isAuthError(error)) {
        console.log('Window auth error detected:', error);
        event.preventDefault(); // Prevent the error from being logged to console

        toast.error("Your session has expired. Please sign in again.");
        clearAuth();

        // Force sign out to clear any corrupted session data
        try {
          const { auth } = await import('../../lib/supabase');
          await auth.signOut();
        } catch (signOutError) {
          console.error('Error during forced sign out:', signOutError);
        }
      }
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleWindowError);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleWindowError);
    };
  }, [clearAuth]);

  return <>{children}</>;
};

// Helper function to detect authentication errors
const isAuthError = (error: any): boolean => {
  if (!error) return false;

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code || '';

  // Common authentication error patterns
  return (
    errorCode === '401' ||
    errorCode === 'PGRST301' || // JWT expired
    errorMessage.includes('jwt') ||
    errorMessage.includes('token') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('session') ||
    errorMessage.includes('expired')
  );
};

export default AuthErrorHandler;
