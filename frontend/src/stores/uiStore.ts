import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    // Sidebar
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;

    // Modals
    activeModal: string | null;
    openModal: (modal: string) => void;
    closeModal: () => void;

    // Theme
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;

    // Loading states
    isGlobalLoading: boolean;
    setGlobalLoading: (loading: boolean) => void;

    // Notifications
    showNotifications: boolean;
    toggleNotifications: () => void;
    setShowNotifications: (show: boolean) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            // Sidebar
            isSidebarOpen: true,
            toggleSidebar: () =>
                set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            setSidebarOpen: (open) => set({ isSidebarOpen: open }),

            // Modals
            activeModal: null,
            openModal: (modal) => set({ activeModal: modal }),
            closeModal: () => set({ activeModal: null }),

            // Theme
            theme: 'light',
            setTheme: (theme) => set({ theme }),

            // Loading
            isGlobalLoading: false,
            setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),

            // Notifications
            showNotifications: false,
            toggleNotifications: () =>
                set((state) => ({ showNotifications: !state.showNotifications })),
            setShowNotifications: (show) => set({ showNotifications: show }),
        }),
        {
            name: 'ui-storage',
            partialize: (state) => ({
                theme: state.theme,
                isSidebarOpen: state.isSidebarOpen,
            }),
        }
    )
);
