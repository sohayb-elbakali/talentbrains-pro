import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../lib/supabase/index";
import { useAuthStore } from "../stores/authStore";
import { handleError } from "../utils/errorHandling";
import { notify } from "../utils/notify";
import { sessionManager } from "../utils/sessionManager";

// Singleton for auth state listener to prevent multiple subscriptions
let authListenerInitialized = false;
let authListenerUnsubscribe: (() => void) | null = null;
let profileLoadingInProgress = false;
let lastSessionValidation = 0;

// Helper function to detect authentication errors
const isAuthError = (error: any): boolean => {
  if (!error) return false;

  const errorMessage = error.message?.toLowerCase() || "";
  const errorCode = error.code || "";

  // Common authentication error patterns
  return (
    errorCode === "401" ||
    errorCode === "406" || // Not Acceptable - often auth related
    errorCode === "PGRST301" || // JWT expired
    errorMessage.includes("jwt") ||
    errorMessage.includes("token") ||
    errorMessage.includes("unauthorized") ||
    errorMessage.includes("authentication") ||
    errorMessage.includes("session") ||
    errorMessage.includes("expired")
  );
};

// Helper function to handle auth errors consistently
const handleAuthError = async (error: any, clearAuthFn: () => void) => {
  // Don't treat network errors as auth errors
  if (error?.message?.includes('fetch') || error?.message?.includes('network') || !navigator.onLine) {
    console.log("Network error detected, not clearing session:", error);
    return false;
  }

  if (isAuthError(error)) {
    console.log("Authentication error detected, clearing session:", error);
    notify.showError("Your session has expired. Please sign in again.");
    clearAuthFn();
    await auth.signOut();
    return true;
  }
  return false;
};

export const useAuth = () => {
  const [loading, setLoading] = useState(true);
  const {
    user,
    profile,
    profileCompletionStatus,
    setUser,
    setProfile,
    setProfileCompletionStatus,
    clearAuth,
  } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle automatic redirects when authenticated
  useEffect(() => {
    if (user && profile && location.pathname === "/") {
      if (profile.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (profile.role === "company") {
        navigate("/company", { replace: true });
      } else if (profile.role === "talent") {
        navigate("/talent", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, profile, location.pathname, navigate]);

  // Prevent multiple users on same browser
  useEffect(() => {
    if (user) {
      sessionManager.setSessionData("current-user-id", user.id);
      sessionManager.preventMultipleUsers();
    }
  }, [user]);

  // Force cleanup on page load if no valid session
  useEffect(() => {
    if (!user) {
      sessionManager.clearAllAuthData();
      if (clearAuth) clearAuth();
    }
  }, [user, clearAuth]);

  // REMOVED: Duplicate session validation listeners
  // The main auth listener below already handles session validation

  useEffect(() => {
    // Set up SINGLE window focus/visibility event handler with throttling
    let lastValidation = 0;
    const VALIDATION_THROTTLE = 30000; // Only validate once per 30 seconds

    const handleWindowFocus = async () => {
      const now = Date.now();
      if (now - lastValidation < VALIDATION_THROTTLE) {
        console.log("🔍 Validation throttled, skipping...");
        return;
      }
      lastValidation = now;
      console.log("🔄 Window focused, validating session...");
      await validateSession();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleWindowFocus();
      }
    };

    // Add event listeners
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Set up global auth error handler
    // setGlobalAuthErrorHandler(async (error) => {
    //   console.log('Global auth error handler called:', error);
    //   toast.error("Your session has expired. Please sign in again.");
    //   clearAuth();
    //   await auth.signOut();
    // });

    // We only want to set up the auth listener once.
    if (!authListenerInitialized) {
      authListenerInitialized = true;

      // onAuthStateChange fires an 'INITIAL_SESSION' event on page load,
      // and 'SIGNED_IN' or 'SIGNED_OUT' events when auth state changes.
      const {
        data: { subscription },
      } = auth.onAuthStateChange(async (event, session) => {
        console.log(
          "Auth state change:",
          event,
          session ? "session exists" : "no session"
        );

        try {
          if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
            if (session?.user) {
              setUser(session.user);
              // Reset profile completion status to avoid stale redirects
              setProfileCompletionStatus({ needsCompletion: false, type: null });
              // For auth state listener, don't show error notifications to avoid duplicates
              await loadUserProfile(
                session.user.id,
                event === "INITIAL_SESSION"
              );
              // Don't show sign-in notification - it's disruptive to UX
            } else {
              // No user session found.
              console.log("No session found, clearing auth state");
              clearAuth();
            }
          } else if (event === "SIGNED_OUT") {
            console.log("User signed out, clearing auth state");
            clearAuth();
            // Don't show sign-out notification - it's disruptive to UX
            // Reset persistent sign-in notification tracker
            if (typeof window !== "undefined") {
              // @ts-ignore
              window.lastSignedInUserId = null;
            }
          } else if (event === "TOKEN_REFRESHED" && session?.user) {
            // Just update the user object, profile is likely the same.
            console.log("Token refreshed successfully");
            setUser(session.user);
          } else if (event === "TOKEN_REFRESH_FAILED") {
            // Token refresh failed - check if it's a network issue first
            console.log("Token refresh failed, checking if network issue");
            if (!navigator.onLine) {
              console.log("Offline - not signing out");
              return;
            }
            // Only sign out if we're online (real auth issue)
            console.log("Online - signing out user");
            notify.showError("Your session has expired. Please sign in again.");
            clearAuth();
            await auth.signOut();
          }
        } catch (error) {
          console.error("Critical error in auth state change handler:", error);
          // Clear everything to be safe
          clearAuth();
        } finally {
          // Once the initial auth state is determined, stop loading.
          setLoading(false);
        }
      });

      authListenerUnsubscribe = () => {
        subscription?.unsubscribe();
        authListenerInitialized = false;
        // Clean up event listeners
        window.removeEventListener("focus", handleWindowFocus);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    } else {
      // If the listener is already active (e.g., due to hot-reloading),
      // the auth state is already known. We just need to stop the loading indicator.
      setLoading(false);
    }

    // Cleanup function for component unmount
    return () => {
      if (!authListenerInitialized) {
        window.removeEventListener("focus", handleWindowFocus);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      }
    };
  }, [setUser, setProfile, clearAuth, user, profile]);

  // Fetch user profile with React Query
  useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () =>
      user
        ? db.getProfile(user.id)
        : Promise.resolve({ data: null, error: null }),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const loadUserProfile = async (
    userId: string,
    showErrors: boolean = true
  ) => {
    // Prevent duplicate profile loading
    if (profileLoadingInProgress) {
      return;
    }

    try {
      profileLoadingInProgress = true;
      // Replace all direct db.getProfile calls with profileData from useQuery
      const { data: profileData, error } = await db.getProfile(userId);

      if (error) {
        console.error("Profile fetch error:", error);

        // Check if this is an authentication error
        const wasAuthError = await handleAuthError(error, clearAuth);
        if (wasAuthError) {
          return; // Auth error handled, exit early
        }

        if (showErrors) {
          throw new Error(`Failed to fetch profile: ${error.message}`);
        }
        return;
      }

      if (profileData) {
        setProfile(profileData);
        return;
      }

      // If no profile exists, this is a critical error - profiles should be created during signup
      // We should not auto-create profiles here as we don't know the intended role
      const { user: currentUser } = await auth.getCurrentUser();
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }

      // Check if user has role in metadata from signup
      const userRole = currentUser.user_metadata?.role;
      if (!userRole) {
        throw new Error(
          "Profile not found and no role information available. Please contact support."
        );
      }

      // Create profile with the role from user metadata
      const newProfile = {
        id: userId,
        email: currentUser.email || "unknown@example.com",
        full_name: currentUser.user_metadata?.full_name || "",
        role: userRole,
        is_verified: false,
        is_active: true,
        preferences: {},
      };

      const { data: createdProfile, error: createError } =
        await db.createProfile(newProfile);
      if (createError || !createdProfile) {
        throw new Error(
          `Failed to create profile: ${createError?.message || "Unknown error"}`
        );
      }

      // Create corresponding table entry based on role
      if (userRole === "talent") {
        const talentData = {
          profile_id: userId,
          title: "New Talent", // Required field
        };
        const { error: talentError } = await db.createTalent(talentData);
        if (talentError) {
          console.error("Failed to create talent entry:", talentError);
          // Don't throw here, profile is created, just log the error
        }
      } else if (userRole === "company") {
        const companyData = {
          profile_id: userId,
          name: currentUser.user_metadata?.company_name || "New Company",
          slug: (currentUser.user_metadata?.company_name || `company-${userId}`)
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, ""),
        };
        const { error: companyError } = await db.createCompany(companyData);
        if (companyError) {
          console.error("Failed to create company entry:", companyError);
          // Don't throw here, profile is created, just log the error
        }
      }

      setProfile(createdProfile);
    } catch (criticalError: any) {
      console.error(
        "A critical error occurred in loadUserProfile:",
        criticalError
      );

      // Only show error notifications if showErrors is true AND not a network error
      if (showErrors && navigator.onLine) {
        // Don't show errors for network issues
        if (criticalError.message?.includes('fetch') || criticalError.message?.includes('network')) {
          console.log("Network error in profile load, not showing notification");
          return;
        }

        if (criticalError.message.includes("Failed to fetch profile")) {
          notify.showError(
            "Unable to load your profile. Please try refreshing the page."
          );
        } else if (criticalError.message.includes("Failed to create profile")) {
          notify.showError(
            "Unable to create your profile. Please try signing out and back in."
          );
        } else if (criticalError.message.includes("No authenticated user")) {
          notify.showError("Authentication error. Please sign in again.");
          await auth.signOut();
        } else if (
          criticalError.message.includes(
            "Profile not found and no role information"
          )
        ) {
          notify.showError(
            "Your account setup is incomplete. Please contact support."
          );
          await auth.signOut();
        } else {
          notify.showError("An unexpected error occurred. Please try again later.");
        }

        // Clear the profile state to trigger re-authentication
        clearAuth();
      }
    } finally {
      profileLoadingInProgress = false;
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
      // 1. Sign up with Supabase Auth
      const { data, error } = await auth.signUp(email, password, userData);

      if (error) {
        handleError(error, "Sign Up");
        return { success: false, error };
      }

      // 2. Only after sign up succeeds, the database trigger will automatically create the profile
      if (data?.user) {
        // If user is created but needs to confirm email, show a special message
        if (data.user?.confirmation_sent_at) {
          notify.showSuccess("Please check your email and confirm your account.");
          return { success: true, data, needsConfirmation: true };
        }

        const userId = data.user.id;

        // Wait a moment for the trigger to create the profile
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Get the automatically created profile
        const { data: profile, error: profileError } = await db.getProfile(
          userId
        );
        if (profileError || !profile) {
          console.error("Profile not found after signup:", profileError);
          // Profile creation might have failed, let's try to create it manually
          const profileData = {
            id: userId,
            email: data.user.email!,
            full_name: userData.full_name || userData.company_name || "",
            role: userData.role,
            avatar_url: null,
            is_verified: false,
            is_active: true,
            preferences: {},
          };
          const { data: createdProfile, error: createError } =
            await db.createProfile(profileData);
          if (createError) {
            handleError(createError, "Profile Creation");
            return { success: false, error: createError };
          }
          setUser(data.user);
          setProfile(createdProfile);
        } else {
          setUser(data.user);
          setProfile(profile);
        }

        // Create the role-specific record if needed
        if (userData.role === "talent") {
          // Check if talent record already exists
          const { data: existingTalent } = await db.getTalent(userId);
          if (!existingTalent) {
            const talentData = {
              profile_id: userId,
              title: "New Talent", // Required, can be updated later
            };
            const { error: talentError } = await db.createTalent(talentData);
            if (talentError) {
              console.warn("Failed to create talent record:", talentError);
              // Don't fail the signup for this
            }
          }
        } else if (userData.role === "company") {
          // Check if company record already exists
          const { data: existingCompany } = await db.getCompany(userId);
          if (!existingCompany) {
            const companyData = {
              profile_id: userId,
              name: userData.company_name || "New Company",
              slug: userData.company_name
                ? userData.company_name
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[^a-z0-9-]/g, "")
                : `company-${userId}`,
            };
            const { error: companyError } = await db.createCompany(companyData);
            if (companyError) {
              console.warn("Failed to create company record:", companyError);
              // Don't fail the signup for this
            }
          }
        }
        // Do not run profile/job validation here. Only sign up schema is validated.
        notify.showSignUpSuccess();
        return { success: true, data };
      }
      // If error is about email confirmation, show a special message
      if (error?.message && error.message.toLowerCase().includes("confirm")) {
        notify.showSuccess("Please check your email and confirm your account.");
        return {
          success: false,
          error: {
            message: "Please check your email and confirm your account.",
          },
        };
      }
    } catch (error: any) {
      handleError(error, "Sign Up");
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await auth.signIn(email, password);

      if (error) {
        handleError(error, "Sign In");
        return { success: false, error };
      }

      if (data?.user) {
        // Don't call setUser or loadUserProfile here - the auth state listener will handle it
        // This prevents duplicate profile loading and error notifications
      }

      return { success: true, data };
    } catch (error: any) {
      handleError(error, "Sign In");
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log("🚪 Starting instant sign out...");

      // INSTANT: Clear local state immediately (no await)
      clearAuth();

      // INSTANT: Navigate immediately (don't wait for anything)
      navigate("/", { replace: true });

      // BACKGROUND: Do cleanup asynchronously (don't block UI)
      Promise.all([
        // Clear React Query cache
        (async () => {
          try {
            const queryClient = (window as any).queryClient;
            if (queryClient) {
              console.log("🗑️ Clearing React Query cache...");
              queryClient.clear();
            }
          } catch (error) {
            console.warn("Failed to clear query cache:", error);
          }
        })(),

        // Clear Supabase session
        (async () => {
          try {
            await auth.signOut();
          } catch (error) {
            console.warn("Supabase sign out failed:", error);
          }
        })(),

        // Clear storage
        (async () => {
          try {
            sessionManager.clearAllAuthData();

            // Clear auth-related storage
            Object.keys(localStorage).forEach((key) => {
              if (
                key.includes("auth") ||
                key.includes("supabase") ||
                key.startsWith("sb-")
              ) {
                localStorage.removeItem(key);
              }
            });

            Object.keys(sessionStorage).forEach((key) => {
              if (
                key.includes("auth") ||
                key.includes("supabase") ||
                key.startsWith("sb-")
              ) {
                sessionStorage.removeItem(key);
              }
            });
          } catch (error) {
            console.warn("Storage cleanup failed:", error);
          }
        })(),
      ]).then(() => {
        console.log("✅ Background cleanup completed");
      });

      return { success: true };
    } catch (error: any) {
      console.error("Sign out error:", error);
      clearAuth();
      sessionManager.forceLogout();
      navigate("/", { replace: true });
      return { success: false, error };
    }
  };

  const updateProfile = async (updates: any) => {
    if (!user) return { success: false, error: "No user logged in" };

    try {
      setLoading(true);
      const { data, error } = await db.updateProfile(user.id, updates);

      if (error) {
        // Check if this is an authentication error first
        const wasAuthError = await handleAuthError(error, clearAuth);
        if (wasAuthError) {
          return { success: false, error: "Authentication expired" };
        }

        // If database update fails, update local profile
        console.warn("Database update failed, updating local profile:", error);
        if (profile) {
          const updatedProfile = { ...profile, ...updates };
          setProfile(updatedProfile);
          notify.showProfileUpdateSuccess();
          return { success: true, data: updatedProfile };
        }
        notify.showError("Failed to update profile");
        return { success: false, error };
      }

      if (data) {
        setProfile(data);
        notify.showProfileUpdateSuccess();
        return { success: true, data };
      }
    } catch (error: any) {
      console.error("Update profile error:", error);
      // Try to update local profile as fallback
      if (profile) {
        const updatedProfile = { ...profile, ...updates };
        setProfile(updatedProfile);
        notify.showProfileUpdateSuccess();
        return { success: true, data: updatedProfile };
      }
      notify.showError("An error occurred while updating profile");
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Session validation function
  const validateSession = async () => {
    // Throttle: only allow once per 30 seconds (increased from 2s)
    const now = Date.now();
    if (now - lastSessionValidation < 30000) {
      console.log("⏭️ Session validation throttled");
      return true;
    }
    lastSessionValidation = now;
    try {
      console.log("🔍 Validating current session...");

      const { user: currentUser, error } = await auth.getCurrentUser();

      if (error) {
        console.error("Session validation error:", error);
        // Don't clear auth on network errors
        if (!error?.message?.includes('fetch') && !error?.message?.includes('network') && navigator.onLine) {
          clearAuth();
        }
        return false;
      }

      if (!currentUser) {
        console.log("No valid session found");
        // Don't clear auth if it's just a network issue
        if (user && navigator.onLine) {
          clearAuth();
          notify.showError("Your session has expired. Please sign in again.");
        }
        return false;
      }

      // Session is valid
      if (!user || user.id !== currentUser.id) {
        console.log("Session valid but user state mismatch, updating...");
        setUser(currentUser);
        if (!profile) {
          await loadUserProfile(currentUser.id, false);
        }
      }

      console.log("✅ Session validation successful");
      return true;
    } catch (error) {
      console.error("Session validation failed:", error);
      clearAuth();
      return false;
    }
  };

  // Profile completion detection with caching
  const checkProfileCompletion = async (forceRefresh = false) => {
    if (!user || !profile) return { needsCompletion: false, type: null };

    // Check cache first (cache for 5 minutes)
    const cacheAge = profileCompletionStatus.lastChecked
      ? Date.now() - profileCompletionStatus.lastChecked
      : Infinity;

    if (!forceRefresh && cacheAge < 5 * 60 * 1000) {
      return {
        needsCompletion: profileCompletionStatus.needsCompletion,
        type: profileCompletionStatus.type,
      };
    }

    try {
      let needsCompletion = false;
      let type = null;

      if (profile.role === "company") {
        const { data: companyData, error } = await db.getCompany(profile.id);

        // Check for auth errors
        if (error && (await handleAuthError(error, clearAuth))) {
          return { needsCompletion: false, type: null };
        }

        needsCompletion = !companyData || !companyData.name;
        type = "company";
      } else if (profile.role === "talent") {
        const { data: talentData, error } = await db.getTalent(profile.id);

        // Check for auth errors
        if (error && (await handleAuthError(error, clearAuth))) {
          return { needsCompletion: false, type: null };
        }

        needsCompletion = !talentData || !talentData.title || !talentData.bio;
        type = "talent";
      } else if (profile.role === "admin") {
        // Admin users don't need additional profile completion beyond basic profile
        // Just check if they have a full_name (which should be set during signup)
        needsCompletion = !profile.full_name;
        type = "admin";
      }

      const result = { needsCompletion, type };

      // Update cache
      setProfileCompletionStatus(result);

      return result;
    } catch (error) {
      console.error("Error checking profile completion:", error);

      // Check if this is an authentication error
      await handleAuthError(error, clearAuth);

      return { needsCompletion: false, type: null };
    }
  };

  return {
    user,
    profile,
    profileCompletionStatus,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    checkProfileCompletion,
    validateSession,
    isAuthenticated: !!user,
    isCompany: profile?.role === "company",
    isTalent: profile?.role === "talent",
    isAdmin: profile?.role === "admin",
    canPerformAction: (roles: string[]) => roles.includes(profile?.role || ""),
    // Cleanup function for app unmount
    cleanup: authListenerUnsubscribe,
  };
};

export function useUserData(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-data", userId],
    queryFn: async () => {
      if (!userId) return { profile: null, company: null, talent: null };
      // Fetch profile
      const { data: profile, error: profileError } = await db.getProfile(
        userId
      );
      if (profileError) throw profileError;
      // Fetch company or talent info based on role
      let company = null;
      let talent = null;
      if (profile?.role === "company") {
        const { data: companyData, error: companyError } = await db.getCompany(
          profile.id
        );
        if (companyError && companyError.code !== "PGRST116") throw companyError;
        company = companyData;
      } else if (profile?.role === "talent") {
        const { data: talentData, error: talentError } = await db.getTalent(
          profile.id
        );
        if (talentError && talentError.code !== "PGRST116") throw talentError;
        talent = talentData;
      }
      return { profile, company, talent };
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
