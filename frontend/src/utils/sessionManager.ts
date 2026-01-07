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

export const sessionManager = {
  clearAllAuthData: () => {
    try {
      const allLocalStorageKeys = Object.keys(localStorage);
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
          // Silently handle errors
        }
      });

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
      // Silently handle errors
    }

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
          // Silently handle errors
        }
      });

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
      // Silently handle errors
    }

    cookieUtils.clear();

    try {
      if ((window as any).queryClient) {
        (window as any).queryClient.clear();
      }
    } catch (e) {
      // Silently handle errors
    }
  },

  setSessionData: (key: string, data: any, useMultipleStorage = true) => {
    const serializedData = JSON.stringify(data);

    try {
      localStorage.setItem(key, serializedData);

      if (useMultipleStorage) {
        sessionStorage.setItem(key, serializedData);
        
        if (serializedData.length < 4000) {
          cookieUtils.set(key, serializedData, 7);
        }
      }
    } catch (error) {
      // Silently handle errors
    }
  },

  getSessionData: (key: string): any | null => {
    try {
      let data = localStorage.getItem(key);
      
      if (!data) {
        data = sessionStorage.getItem(key);
      }
      
      if (!data) {
        data = cookieUtils.get(key);
      }

      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  },

  isCompletelyLoggedOut: (): boolean => {
    const authKeys = [
      'sb-mucwmuqcxqngimiueszx-auth-token',
      'auth-storage',
      'supabase.auth.token'
    ];

    for (const key of authKeys) {
      if (localStorage.getItem(key)) {
        return false;
      }
    }

    for (const key of authKeys) {
      if (sessionStorage.getItem(key)) {
        return false;
      }
    }

    if (cookieUtils.get('sb-mucwmuqcxqngimiueszx-auth-token')) {
      return false;
    }

    return true;
  },

  forceLogout: () => {
    sessionManager.clearAllAuthData();
    
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  },

  preventMultipleUsers: () => {
    const currentUserId = sessionManager.getSessionData('current-user-id');
    
    if (currentUserId) {
      window.addEventListener('storage', (e) => {
        if (e.key === 'current-user-id' && e.newValue !== currentUserId) {
          alert('Another user has logged in. You will be logged out.');
          sessionManager.forceLogout();
        }
      });
    }
  }
};
