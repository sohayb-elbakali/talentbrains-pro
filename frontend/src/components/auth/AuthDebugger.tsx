import { useState } from 'react';
import { notify } from "../../utils/notify";
import { useAuth } from '../../hooks/useAuth';

/**
 * Debug component to test authentication error handling
 * This component should only be used in development
 */
const AuthDebugger: React.FC = () => {
  const { user, profile, isAuthenticated } = useAuth();
  const [debugInfo, setDebugInfo] = useState<string>('');

  const checkLocalStorage = () => {
    const authData = localStorage.getItem('sb-mucwmuqcxqngimiueszx-auth-token');
    setDebugInfo(authData ? 'Auth data found in localStorage' : 'No auth data in localStorage');
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('sb-mucwmuqcxqngimiueszx-auth-token');
    toast.success('Local storage cleared! Refresh the page to test.');
    setDebugInfo('Local storage cleared');
  };

  const simulateAuthError = async () => {
    try {
      // Simulate an expired token error
      const fakeError = {
        code: 'PGRST301',
        message: 'JWT expired',
      };

      // This would normally be caught by our error handlers
      throw fakeError;
    } catch (error) {
      console.error('Simulated auth error:', error);
      toast.error('Simulated auth error - check console');
    }
  };

  const testProfileLoad = async () => {
    if (!user) {
      toast.error('No user logged in');
      return;
    }

    try {
      const { db } = await import('../../lib/supabase/index');
      const result = await db.getProfile(user.id);

      if (result.error) {
        toast.error(`Profile load error: ${result.error.message}`);
      } else {
        toast.success('Profile loaded successfully');
      }
    } catch (error: any) {
      toast.error(`Profile load failed: ${error.message}`);
    }
  };

  if (import.meta.env.PROD) {
    return null; // Don't show in production
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#f0f0f0',
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '16px',
      maxWidth: '300px',
      fontSize: '12px',
      zIndex: 9999,
    }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Auth Debugger</h4>

      <div style={{ marginBottom: '8px' }}>
        <strong>Status:</strong> {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
      </div>

      <div style={{ marginBottom: '8px' }}>
        <strong>User:</strong> {user ? user.email : 'None'}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <strong>Profile:</strong> {profile ? profile.role : 'None'}
      </div>

      {debugInfo && (
        <div style={{ marginBottom: '12px', color: '#666' }}>
          {debugInfo}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={checkLocalStorage}
          style={{ padding: '4px 8px', fontSize: '11px' }}
        >
          Check LocalStorage
        </button>

        <button
          onClick={clearLocalStorage}
          style={{ padding: '4px 8px', fontSize: '11px', background: '#ff6b6b', color: 'white', border: 'none' }}
        >
          Clear LocalStorage
        </button>

        <button
          onClick={simulateAuthError}
          style={{ padding: '4px 8px', fontSize: '11px', background: '#ffa500', color: 'white', border: 'none' }}
        >
          Simulate Auth Error
        </button>

        <button
          onClick={testProfileLoad}
          style={{ padding: '4px 8px', fontSize: '11px', background: '#4dabf7', color: 'white', border: 'none' }}
        >
          Test Profile Load
        </button>
      </div>
    </div>
  );
};

export default AuthDebugger;
