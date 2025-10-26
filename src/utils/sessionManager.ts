/**
 * Enhanced session management utility
 * Provides better control over user sessions and storage
 */

// Cookie utilities
export const cookieUtils = {
  set: (name: string, value: string, days: number = 7) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure=${location.protocol === 'https:'}`;
  },

  get: (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },

  delete: (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  },

  clear: () => {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name.startsWith('sb-') || name.includes('auth') || name.includes('session')) {
        cookieUtils.delete(name);
      }
    }
  }
};

// Session management
export const sessionManager = {
  /**
   * Completely clear all authentication data
   */
  clearAllAuthData: () => {
    // Clear all localStorage items that might contain auth data
    try {
      // Get all keys first to avoid modifying while iterating
      const allLocalStorageKeys = Object.keys(localStorage);

      // Clear specific known keys
      const localStorageKeys = [
        'sb-mucwmuqcxqngimiueszx-auth-token',
        'auth-storage',
        'supabase.auth.token',
        'sb-auth-token',
        'supabase-auth-token',
        'user-session',
        'profile-data'
      ];

      localStorageKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove localStorage key: ${key}`, e);
        }
      });

      // Clear any keys that start with 'sb-' (Supabase keys)
      allLocalStorageKeys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('auth') || key.includes('supabase')) {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            // Silently fail
          }
        }
      });
    } catch (e) {
      console.warn("Failed to clear localStorage:", e);
    }

    // 2. Clear sessionStorage
    try {
      const allSessionStorageKeys = Object.keys(sessionStorage);

      const sessionStorageKeys = [
        'sb-mucwmuqcxqngimiueszx-auth-token',
        'auth-storage',
        'user-session',
        'temp-auth-data'
      ];

      sessionStorageKeys.forEach(key => {
        try {
          sessionStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove sessionStorage key: ${key}`, e);
        }
      });

      // Clear any keys that start with 'sb-' (Supabase keys)
      allSessionStorageKeys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('auth') || key.includes('supabase')) {
          try {
            sessionStorage.removeItem(key);
          } catch (e) {
            // Silently fail
          }
        }
      });
    } catch (e) {
      console.warn("Failed to clear sessionStorage:", e);
    }

    // 3. Clear auth-related cookies
    cookieUtils.clear();

    // 4. Clear any cached data in memory
    try {
      // Clear React Query cache if available
      if ((window as any).queryClient) {
        (window as any).queryClient.clear();
      }
    } catch (e) {
      console.warn("Failed to clear query cache:", e);
    }
  },

  /**
   * Set session data with multiple storage methods for redundancy
   */
  setSessionData: (key: string, data: any, useMultipleStorage = true) => {
    const serializedData = JSON.stringify(data);

    try {
      // Primary: localStorage
      localStorage.setItem(key, serializedData);

      if (useMultipleStorage) {
        // Backup: sessionStorage
        sessionStorage.setItem(key, serializedData);
        
        // Backup: cookie (for smaller data)
        if (serializedData.length < 4000) { // Cookie size limit
          cookieUtils.set(key, serializedData, 7);
        }
      }
    } catch (error) {
      console.error(`Failed to set session data for key: ${key}`, error);
    }
  },

  /**
   * Get session data with fallback to multiple storage methods
   */
  getSessionData: (key: string): any | null => {
    try {
      // Try localStorage first
      let data = localStorage.getItem(key);
      
      // Fallback to sessionStorage
      if (!data) {
        data = sessionStorage.getItem(key);
      }
      
      // Fallback to cookies
      if (!data) {
        data = cookieUtils.get(key);
      }

      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Failed to get session data for key: ${key}`, error);
      return null;
    }
  },

  /**
   * Check if user is properly logged out
   */
  isCompletelyLoggedOut: (): boolean => {
    const authKeys = [
      'sb-mucwmuqcxqngimiueszx-auth-token',
      'auth-storage',
      'supabase.auth.token'
    ];

    // Check localStorage
    for (const key of authKeys) {
      if (localStorage.getItem(key)) {
        return false;
      }
    }

    // Check sessionStorage
    for (const key of authKeys) {
      if (sessionStorage.getItem(key)) {
        return false;
      }
    }

    // Check cookies
    if (cookieUtils.get('sb-mucwmuqcxqngimiueszx-auth-token')) {
      return false;
    }

    return true;
  },

  /**
   * Force logout with complete cleanup
   */
  forceLogout: () => {
    sessionManager.clearAllAuthData();
    
    // Force page reload to ensure clean state
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  },

  /**
   * Prevent multiple users on same browser
   */
  preventMultipleUsers: () => {
    // Set a flag when user logs in
    const currentUserId = sessionManager.getSessionData('current-user-id');
    
    if (currentUserId) {
      // Check if another user tries to log in
      window.addEventListener('storage', (e) => {
        if (e.key === 'current-user-id' && e.newValue !== currentUserId) {
          alert('Another user has logged in. You will be logged out.');
          sessionManager.forceLogout();
        }
      });
    }
  }
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).sessionManager = sessionManager;
  (window as any).cookieUtils = cookieUtils;
}
