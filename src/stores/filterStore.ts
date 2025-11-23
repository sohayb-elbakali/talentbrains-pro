import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface JobFilters {
    search: string;
    location: string;
    jobType: string[];
    experienceLevel: string[];
    salaryRange: [number, number];
    remote: boolean | null;
    sortBy: 'recent' | 'salary' | 'relevance';
}

interface ApplicationFilters {
    search: string;
    status: string[];
    dateRange: [Date | null, Date | null];
    sortBy: 'recent' | 'oldest' | 'status';
}

interface TalentFilters {
    search: string;
    skills: string[];
    experienceLevel: string[];
    availability: string[];
    location: string;
    sortBy: 'recent' | 'relevance' | 'experience';
}

interface FilterState {
    // Job Filters
    jobFilters: JobFilters;
    setJobFilters: (filters: Partial<JobFilters>) => void;
    resetJobFilters: () => void;

    // Application Filters
    applicationFilters: ApplicationFilters;
    setApplicationFilters: (filters: Partial<ApplicationFilters>) => void;
    resetApplicationFilters: () => void;

    // Talent Filters
    talentFilters: TalentFilters;
    setTalentFilters: (filters: Partial<TalentFilters>) => void;
    resetTalentFilters: () => void;

    // Reset all filters
    resetAllFilters: () => void;
}

const defaultJobFilters: JobFilters = {
    search: '',
    location: '',
    jobType: [],
    experienceLevel: [],
    salaryRange: [0, 200000],
    remote: null,
    sortBy: 'recent',
};

const defaultApplicationFilters: ApplicationFilters = {
    search: '',
    status: [],
    dateRange: [null, null],
    sortBy: 'recent',
};

const defaultTalentFilters: TalentFilters = {
    search: '',
    skills: [],
    experienceLevel: [],
    availability: [],
    location: '',
    sortBy: 'relevance',
};

export const useFilterStore = create<FilterState>()(
    persist(
        (set) => ({
            // Job Filters
            jobFilters: defaultJobFilters,
            setJobFilters: (filters) =>
                set((state) => ({
                    jobFilters: { ...state.jobFilters, ...filters },
                })),
            resetJobFilters: () => set({ jobFilters: defaultJobFilters }),

            // Application Filters
            applicationFilters: defaultApplicationFilters,
            setApplicationFilters: (filters) =>
                set((state) => ({
                    applicationFilters: { ...state.applicationFilters, ...filters },
                })),
            resetApplicationFilters: () =>
                set({ applicationFilters: defaultApplicationFilters }),

            // Talent Filters
            talentFilters: defaultTalentFilters,
            setTalentFilters: (filters) =>
                set((state) => ({
                    talentFilters: { ...state.talentFilters, ...filters },
                })),
            resetTalentFilters: () => set({ talentFilters: defaultTalentFilters }),

            // Reset all
            resetAllFilters: () =>
                set({
                    jobFilters: defaultJobFilters,
                    applicationFilters: defaultApplicationFilters,
                    talentFilters: defaultTalentFilters,
                }),
        }),
        {
            name: 'filter-storage',
        }
    )
);
