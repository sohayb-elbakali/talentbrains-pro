import type { User } from "@supabase/supabase-js";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Database } from "../types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthState {
  user: User | null;
  profile: Profile | null;
  profileCompletionStatus: {
    needsCompletion: boolean;
    type: string | null;
    lastChecked: number | null;
  };
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setProfileCompletionStatus: (status: {
    needsCompletion: boolean;
    type: string | null;
  }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      profileCompletionStatus: {
        needsCompletion: false,
        type: null,
        lastChecked: null,
      },
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setProfileCompletionStatus: (status) =>
        set({
          profileCompletionStatus: {
            ...status,
            lastChecked: Date.now(),
          },
        }),
      clearAuth: () => {
        console.log("🧹 Clearing auth state from store...");

        // Clear the Zustand state
        set({
          user: null,
          profile: null,
          profileCompletionStatus: {
            needsCompletion: false,
            type: null,
            lastChecked: null,
          },
        });

        // Also clear localStorage manually to ensure complete cleanup
        try {
          localStorage.removeItem("auth-storage");
          // Clear any other auth-related items
          Object.keys(localStorage).forEach((key) => {
            if (
              key.includes("auth") ||
              key.includes("supabase") ||
              key.startsWith("sb-")
            ) {
              localStorage.removeItem(key);
            }
          });
          console.log("✅ Auth storage cleared from localStorage");
        } catch (error) {
          console.warn(
            "Failed to clear auth-storage from localStorage:",
            error
          );
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        profileCompletionStatus: state.profileCompletionStatus,
      }),
    }
  )
);
