// This file will aggregate all mock data and mock implementations for tests.
// Move the contents of mockAuth.ts and mockAuthFixed.ts here.

// --- mockAuth.ts content ---
// Mock data storage
const mockUsers: MockUser[] = [];
const mockProfiles: MockProfile[] = [];
let mockJobs: any[] = [];
const mockApplications: any[] = [];
const mockMatches: any[] = [];

const MOCK_DB_KEY = "talentbrains_mock_db";

const loadDataFromStorage = () => {
  try {
    const data = localStorage.getItem(MOCK_DB_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to load mock data from localStorage", error);
  }
  return {};
};

const saveDataToStorage = (data: any) => {
  try {
    const currentData = loadDataFromStorage();
    const newData = { ...currentData, ...data };
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(newData));
  } catch (error) {
    console.error("Failed to save mock data to localStorage", error);
  }
};

// Add some sample data for development
const initializeSampleData = () => {
  // Sample Talent User
  const talentUser = {
    id: "mock_talent_user",
    email: "talent@talentbrains.com",
    password: "talent123",
    user_metadata: { full_name: "Alex Doe", role: "talent" },
  };
  const talentProfile = {
    id: "mock_talent_user",
    email: "talent@talentbrains.com",
    full_name: "Alex Doe",
    role: "talent",
    company_name: undefined,
    avatar_url: null,
    is_verified: true,
    is_active: true,
    preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  };
  mockUsers.push(talentUser);
  mockProfiles.push(talentProfile);
  saveDataToStorage({ mockUsers, mockProfiles });

  // Add sample jobs for the company (skip, since company is removed)
  // Add sample applications and matches (skip, since company is removed)
};

// Initialize sample data
initializeSampleData();

// Generate a mock user
const createMockUser = (
  email: string,
  password: string,
  userData: any
): MockUser => {
  const userId = `mock_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  const user: MockUser = {
    id: userId,
    email,
    password,
    user_metadata: {
      full_name: userData.full_name,
      role: userData.role,
      company_name: userData.company_name,
    },
  };

  mockUsers.push(user);

  // Create corresponding profile
  const profile: MockProfile = {
    id: userId,
    email,
    full_name: userData.full_name,
    role: userData.role,
    company_name: userData.company_name,
    avatar_url: null,
    is_verified: true,
    is_active: true,
    preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  };

  mockProfiles.push(profile);
  saveDataToStorage({ mockUsers, mockProfiles });

  return user;
};

// Mock auth service
export const mockAuth = {
  signUp: async (email: string, password: string, userData: any) => {
    // Check if user already exists
    const existingUser = mockUsers.find((u) => u.email === email);
    if (existingUser) {
      return {
        data: null,
        error: { message: "User already exists" },
      };
    }

    const user = createMockUser(email, password, userData);

    return {
      data: { user },
      error: null,
    };
  },

  signIn: async (email: string, password: string) => {
    // Only allow login if user exists in the mock database and password matches
    const user = mockUsers.find(
      (u) => u.email === email && u.password === password
    );
    if (!user) {
      return {
        data: null,
        error: { message: "Invalid login credentials" },
      };
    }
    // Update last login
    const profile = mockProfiles.find((p) => p.id === user.id);
    if (profile) {
      profile.last_login_at = new Date().toISOString();
    }
    return {
      data: { user },
      error: null,
    };
  },

  signOut: async () => {
    return { error: null };
  },

  getCurrentUser: async () => {
    // For mock purposes, return the last created user
    const user = mockUsers[mockUsers.length - 1];
    return { user, error: null };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    // Mock subscription that simulates auth state changes
    const mockSubscription = {
      unsubscribe: () => {},
    };

    // Simulate initial auth state
    setTimeout(() => {
      const lastUser = mockUsers[mockUsers.length - 1];
      if (lastUser) {
        callback("SIGNED_IN", { user: lastUser });
      }
    }, 100);

    return {
      data: {
        subscription: mockSubscription,
      },
    };
  },
};

import { IDbService } from "../types/db";

// Mock database service
export const mockDb: IDbService = {
  getProfile: async (userId: string) => {
    const profile = mockProfiles.find((p) => p.id === userId);
    return {
      data: profile,
      error: profile
        ? null
        : { message: "Profile not found", code: "PGRST116" },
    };
  },

  createProfile: async (profileData: any) => {
    const profile: MockProfile = {
      ...profileData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    };

    mockProfiles.push(profile);
    saveDataToStorage({ mockProfiles });

    return { data: profile, error: null };
  },

  updateProfile: async (userId: string, updates: any) => {
    const profileIndex = mockProfiles.findIndex((p) => p.id === userId);
    if (profileIndex === -1) {
      return { data: null, error: { message: "Profile not found" } };
    }

    mockProfiles[profileIndex] = {
      ...mockProfiles[profileIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveDataToStorage({ mockProfiles });

    return { data: mockProfiles[profileIndex], error: null };
  },

  getTalent: async (profileId: string) => {
    return {
      data: {
        id: profileId,
        profile_id: profileId,
        title: "Software Engineer",
        summary:
          "Passionate developer with 5+ years of experience in React, Node.js, and cloud technologies.",
        experience_years: 5,
        location: "San Francisco, CA",
        remote_preference: "hybrid",
        salary_expectation: 120000,
        skills: ["React", "Node.js", "TypeScript", "AWS", "Docker"],
      },
      error: null,
    };
  },

  getMatches: async (filters: any) => {
    if (filters.company_id) {
      const companyJobIds = mockJobs
        .filter(
          (job) =>
            job.company_id === filters.company_id && job.status === "open"
        )
        .map((job) => job.id);

      const companyMatches = mockMatches.filter((match) =>
        companyJobIds.includes(match.job_id)
      );

      const enrichedMatches = companyMatches.map((match) => {
        const job = mockJobs.find((j) => j.id === match.job_id);
        const talent = mockProfiles.find((p) => p.id === match.talent_id);
        return {
          ...match,
          job: { title: job?.title || "Unknown Job" },
          talent: {
            id: talent?.id,
            full_name: talent?.full_name || "Unknown Talent",
            avatar_url: talent?.avatar_url,
          },
        };
      });
      return { data: enrichedMatches, error: null };
    }

    if (filters.talent_id) {
      const talentMatches = mockMatches.filter(
        (match) => match.talent_id === filters.talent_id
      );
      const enrichedMatches = talentMatches.map((match) => {
        const job = mockJobs.find((j) => j.id === match.job_id);
        const company = mockProfiles.find((p) => p.id === job?.company_id);
        return {
          ...match,
          job: {
            title: job?.title || "Unknown Job",
            company: company?.company_name || "Unknown Company",
          },
        };
      });
      return { data: enrichedMatches, error: null };
    }

    return { data: [], error: null };
  },

  getApplications: async (filters: any) => {
    if (filters.company_id) {
      const companyJobIds = mockJobs
        .filter((job) => job.company_id === filters.company_id)
        .map((job) => job.id);

      const companyApps = mockApplications.filter((app) =>
        companyJobIds.includes(app.job_id)
      );

      // Enrich with job and talent info for the company view
      const enrichedCompanyApps = companyApps.map((app) => {
        const job = mockJobs.find((j) => j.id === app.job_id);
        const talent = mockProfiles.find((p) => p.id === app.talent_id);
        return {
          ...app,
          job: {
            title: job?.title || "Unknown Job",
          },
          talent: {
            full_name: talent?.full_name || "Unknown Applicant",
            avatar_url: talent?.avatar_url,
          },
        };
      });
      return { data: enrichedCompanyApps, error: null };
    }

    if (filters.talent_id) {
      const talentApps = mockApplications.filter(
        (app) => app.talent_id === filters.talent_id
      );
      // Enrich with job info for the talent view
      const enrichedTalentApps = talentApps.map((app) => {
        const job = mockJobs.find((j) => j.id === app.job_id);
        const company = mockProfiles.find((p) => p.id === job?.company_id);
        return {
          ...app,
          job: {
            title: job?.title || "Unknown Job",
            company: company?.company_name || "Unknown Company",
          },
        };
      });
      return { data: enrichedTalentApps, error: null };
    }

    return { data: [], error: null };
  },

  getAnalytics: async (_userId: string, _type: string) => {
    return {
      data: {
        profileViews: 45,
        applications: 8,
        matches: 12,
        interviews: 3,
        offers: 1,
      },
      error: null,
    };
  },

  createJob: async (jobData: any) => {
    console.log("Mock createJob called with data:", jobData);
    console.log("Creating mock job...");

    const job = {
      id: `mock_job_${Date.now()}`,
      ...jobData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "active",
    };

    console.log("Mock job created:", job);
    console.log("Adding to mockJobs array...");

    mockJobs.push(job);
    saveDataToStorage({ mockJobs });

    console.log("Mock job saved to storage");
    console.log("Mock createJob returning:", { data: job, error: null });

    return { data: job, error: null };
  },

  getJobs: async (filters: any) => {
    if (filters.company_id) {
      const companyJobs = mockJobs.filter(
        (job) => job.company_id === filters.company_id
      );
      return { data: companyJobs, error: null };
    }
    // For the public job board, return all jobs with company info
    const openJobs = mockJobs.filter((j) => j.status === "open");
    const jobsWithCompanyInfo = openJobs.map((job) => {
      const companyProfile = mockProfiles.find((p) => p.id === job.company_id);
      return {
        ...job,
        company_name: companyProfile?.company_name || "Unknown Company",
        avatar_url: companyProfile?.avatar_url,
      };
    });
    return { data: jobsWithCompanyInfo, error: null };
  },

  getJob: async (jobId: string) => {
    const job = mockJobs.find((j) => j.id === jobId);
    return {
      data: job || null,
      error: job ? null : { message: "Job not found" },
    };
  },

  updateJob: async (jobId: string, updates: any) => {
    const jobIndex = mockJobs.findIndex((j) => j.id === jobId);
    if (jobIndex === -1) {
      return { data: null, error: { message: "Job not found" } };
    }

    mockJobs[jobIndex] = {
      ...mockJobs[jobIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveDataToStorage({ mockJobs });

    return { data: mockJobs[jobIndex], error: null };
  },

  createTalent: async (talentData: any) => {
    const talent = {
      id: `talent_${Date.now()}`,
      ...talentData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    // In a real implementation, this would be stored in a talents array
    return { data: talent, error: null };
  },

  updateTalent: async (talentId: string, updates: any) => {
    // Mock implementation - in real app this would update the talents table
    const updatedTalent = {
      id: talentId,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return { data: updatedTalent, error: null };
  },

  getCompany: async (profileId: string) => {
    // Mock company data
    return {
      data: {
        id: `company_${profileId}`,
        profile_id: profileId,
        name: "Mock Company",
        slug: "mock-company",
        description: "A mock company for testing",
      },
      error: null,
    };
  },

  createCompany: async (companyData: any) => {
    const company = {
      id: `company_${Date.now()}`,
      ...companyData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    // In a real implementation, this would be stored in a companies array
    return { data: company, error: null };
  },

  updateCompany: async (profileId: string, updates: any) => {
    // Mock implementation - in real app this would update the companies table
    const updatedCompany = {
      id: `company_${profileId}`,
      profile_id: profileId,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return { data: updatedCompany, error: null };
  },

  deleteJob: async (jobId: string) => {
    // Mock implementation - just return success
    console.log("Mock deleteJob called for:", jobId);
    const initialLength = mockJobs.length;
    mockJobs = mockJobs.filter((j) => j.id !== jobId);
    if (mockJobs.length < initialLength) {
      saveDataToStorage({ mockJobs });
      return { error: null };
    }
    return { error: { message: "Job not found" } };
  },
};

// --- mockAuthFixed.ts content ---
// Mock authentication service for development
import { DbResponse } from "../types/db";

// --- LocalStorage Persistence ---
const MOCK_DB_KEY = "talentbrains_mock_db";

const loadDataFromStorage = () => {
  try {
    const data = localStorage.getItem(MOCK_DB_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to load mock data from localStorage", error);
  }
  return {};
};

const saveDataToStorage = (data: { [key: string]: any }) => {
  try {
    // To ensure we don't overwrite other parts of the db, we load existing first
    const currentData = loadDataFromStorage();
    const newData = { ...currentData, ...data };
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(newData));
  } catch (error) {
    console.error("Failed to save mock data to localStorage", error);
  }
};

// --- Mock Data Storage ---
// Load data from localStorage or initialize as empty arrays
let {
  mockUsers = [],
  mockProfiles = [],
  mockJobs = [],
  mockApplications = [],
  mockMatches = [],
}: { [key: string]: any[] } = loadDataFromStorage();

// --- Sample Data Initialization ---
const initializeSampleData = () => {
  // Sample Talent User
  const talentUser: MockUser = {
    id: "mock_talent_user",
    email: "talent@talentbrains.com",
    user_metadata: { full_name: "Alex Doe", role: "talent" },
  };
  const talentProfile: MockProfile = {
    id: "mock_talent_user",
    email: "talent@talentbrains.com",
    full_name: "Alex Doe",
    role: "talent",
    company_name: undefined,
    avatar_url: null,
    is_verified: true,
    is_active: true,
    preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  };
  mockUsers.push(talentUser);
  mockProfiles.push(talentProfile);

  // Sample Company User
  const companyUser: MockUser = {
    id: "mock_company_user",
    email: "company@talentbrains.com",
    user_metadata: {
      full_name: "Innovate Corp",
      role: "company",
      company_name: "Innovate Corp",
    },
  };
  const companyProfile: MockProfile = {
    id: "mock_company_user",
    email: "company@talentbrains.com",
    full_name: "Innovate Corp",
    role: "company",
    company_name: "Innovate Corp",
    avatar_url: null,
    is_verified: true,
    is_active: true,
    preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  };
  mockUsers.push(companyUser);
  mockProfiles.push(companyProfile);

  // Add sample jobs for the company
  const job1: Job = {
    id: `mock_job_1`,
    company_id: companyUser.id,
    title: "Senior Frontend Engineer",
    status: "open",
    created_at: new Date().toISOString(),
  };
  const job2: Job = {
    id: `mock_job_2`,
    company_id: companyUser.id,
    title: "Backend Go Developer",
    status: "closed",
    created_at: new Date().toISOString(),
  };
  mockJobs.push(job1, job2);

  // Add sample applications for these jobs from the talent
  const app1: Application = {
    id: "mock_app_1",
    job_id: job1.id,
    talent_id: talentUser.id,
    status: "pending",
    applied_at: new Date().toISOString(),
  };
  const app2: Application = {
    id: "mock_app_2",
    job_id: job1.id,
    talent_id: "some_other_talent_id",
    status: "reviewed",
    applied_at: new Date().toISOString(),
  };
  mockApplications.push(app1, app2);

  // Add sample matches for the open job
  const match1: Match = {
    id: "mock_match_1",
    job_id: job1.id,
    talent_id: talentUser.id,
    match_score: 92,
  };
  mockMatches.push(match1);

  // Save all initial data to localStorage
  saveDataToStorage({
    mockUsers,
    mockProfiles,
    mockJobs,
    mockApplications,
    mockMatches,
  });
};

// Initialize sample data ONLY if the database is empty
if (mockUsers.length === 0) {
  initializeSampleData();
}

// --- Mock Auth Service ---
export const mockAuth = {
  signUp: async (
    email: string,
    _password: string,
    userData: any
  ): Promise<DbResponse<any>> => {
    if (mockUsers.find((u: MockUser) => u.email === email)) {
      return { data: null, error: { message: "User already exists" } };
    }
    const userId = `mock_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const user: MockUser = {
      id: userId,
      email,
      user_metadata: {
        full_name: userData.full_name,
        role: userData.role,
        company_name: userData.company_name,
      },
    };
    mockUsers.push(user);

    const profile: MockProfile = {
      id: userId,
      email,
      full_name: userData.full_name,
      role: userData.role,
      company_name: userData.company_name,
      avatar_url: null,
      is_verified: true,
      is_active: true,
      preferences: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    };
    mockProfiles.push(profile);

    saveDataToStorage({ mockUsers, mockProfiles });

    return { data: { user }, error: null };
  },

  signIn: async (
    email: string,
    _password: string
  ): Promise<DbResponse<any>> => {
    const user = mockUsers.find((u: MockUser) => u.email === email);
    if (!user) {
      return { data: null, error: { message: "Invalid login credentials" } };
    }
    const profile = mockProfiles.find((p: MockProfile) => p.id === user.id);
    if (profile) {
      profile.last_login_at = new Date().toISOString();
      saveDataToStorage({ mockProfiles });
    }
    return {
      data: { user, session: { access_token: "mock_token" } },
      error: null,
    };
  },
};

// --- Mock Database Service ---
export const mockDb: IDbService = {
  getProfile: async (userId: string): Promise<DbResponse<any>> => {
    const profile = mockProfiles.find((p: MockProfile) => p.id === userId);
    if (!profile) {
      return {
        data: null,
        error: { message: "Profile not found", code: "PGRST116" },
      };
    }
    return { data: profile, error: null };
  },

  createProfile: async (profileData: any): Promise<DbResponse<any>> => {
    // This is largely handled by signUp in the mock setup
    const existing = mockProfiles.find(
      (p: MockProfile) => p.id === profileData.id
    );
    if (existing) return { data: existing, error: null };

    const profile: MockProfile = {
      ...profileData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    };
    mockProfiles.push(profile);
    saveDataToStorage({ mockProfiles });
    return { data: profile, error: null };
  },

  updateProfile: async (
    userId: string,
    updates: any
  ): Promise<DbResponse<any>> => {
    const profileIndex = mockProfiles.findIndex(
      (p: MockProfile) => p.id === userId
    );
    if (profileIndex === -1) {
      return { data: null, error: { message: "Profile not found" } };
    }
    mockProfiles[profileIndex] = {
      ...mockProfiles[profileIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveDataToStorage({ mockProfiles });
    return { data: mockProfiles[profileIndex], error: null };
  },

  getTalent: async (profileId: string): Promise<DbResponse<any>> => {
    const profile = mockProfiles.find(
      (p: MockProfile) => p.id === profileId && p.role === "talent"
    );
    if (!profile) {
      return { data: null, error: { message: "Talent not found" } };
    }
    // Create a mock talent object based on the profile
    const talent = {
      id: profile.id, // Use profile ID as talent ID for mock
      profile_id: profile.id,
      title: profile.full_name,
      bio: "",
      location: "",
      remote_preference: true,
      experience_level: "mid",
      years_of_experience: 0,
      hourly_rate_min: null,
      hourly_rate_max: null,
      salary_expectation_min: null,
      salary_expectation_max: null,
      availability_status: "available",
      portfolio_url: null,
      resume_url: null,
      github_url: null,
      linkedin_url: null,
      languages: ["English"],
      timezone: "UTC",
      work_authorization: null,
      education: [],
      certifications: [],
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
    return { data: talent, error: null };
  },

  getMatches: async (filters: any): Promise<DbResponse<any[]>> => {
    if (filters.company_id) {
      const companyJobIds = mockJobs
        .filter(
          (job: Job) =>
            job.company_id === filters.company_id && job.status === "open"
        )
        .map((job: Job) => job.id);

      const companyMatches = mockMatches.filter((match: Match) =>
        companyJobIds.includes(match.job_id)
      );

      const enrichedMatches = companyMatches.map((match: Match) => {
        const job = mockJobs.find((j: Job) => j.id === match.job_id);
        const talent = mockProfiles.find(
          (p: MockProfile) => p.id === match.talent_id
        );
        return {
          ...match,
          job: { title: job?.title || "Unknown Job" },
          talent: {
            id: talent?.id,
            full_name: talent?.full_name || "Unknown Talent",
            avatar_url: talent?.avatar_url,
          },
        };
      });
      return { data: enrichedMatches, error: null };
    }

    if (filters.talent_id) {
      const talentMatches = mockMatches.filter(
        (match: Match) => match.talent_id === filters.talent_id
      );
      const enrichedMatches = talentMatches.map((match: Match) => {
        const job = mockJobs.find((j: Job) => j.id === match.job_id);
        const company = mockProfiles.find(
          (p: MockProfile) => p.id === job?.company_id
        );
        return {
          ...match,
          job: {
            title: job?.title || "Unknown Job",
            company: company?.company_name || "Unknown Company",
          },
        };
      });
      return { data: enrichedMatches, error: null };
    }

    return { data: [], error: null };
  },

  getApplications: async (filters: any): Promise<DbResponse<any[]>> => {
    if (filters.company_id) {
      const companyJobIds = mockJobs
        .filter((job: Job) => job.company_id === filters.company_id)
        .map((job: Job) => job.id);

      const companyApps = mockApplications.filter((app: Application) =>
        companyJobIds.includes(app.job_id)
      );

      const enrichedCompanyApps = companyApps.map((app: Application) => {
        const job = mockJobs.find((j: Job) => j.id === app.job_id);
        const talent = mockProfiles.find(
          (p: MockProfile) => p.id === app.talent_id
        );
        return {
          ...app,
          job: { title: job?.title || "Unknown Job" },
          talent: {
            full_name: talent?.full_name || "Unknown Applicant",
            avatar_url: talent?.avatar_url,
          },
        };
      });
      return { data: enrichedCompanyApps, error: null };
    }

    if (filters.talent_id) {
      const talentApps = mockApplications.filter(
        (app: Application) => app.talent_id === filters.talent_id
      );
      const enrichedTalentApps = talentApps.map((app: Application) => {
        const job = mockJobs.find((j: Job) => j.id === app.job_id);
        const company = mockProfiles.find(
          (p: MockProfile) => p.id === job?.company_id
        );
        return {
          ...app,
          job: {
            title: job?.title || "Unknown Job",
            company: company?.company_name || "Unknown Company",
          },
        };
      });
      return { data: enrichedTalentApps, error: null };
    }

    return { data: [], error: null };
  },

  getAnalytics: async (
    _userId: string,
    _type: string
  ): Promise<DbResponse<any>> => {
    return {
      data: {
        profileViews: 45,
        applications: 8,
        matches: 12,
        interviews: 3,
        offers: 1,
      },
      error: null,
    };
  },

  createJob: async (jobData: any): Promise<DbResponse<any>> => {
    const job = {
      id: `mock_job_${Date.now()}`,
      ...jobData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "open",
    };
    mockJobs.push(job);
    saveDataToStorage({ mockJobs });
    return { data: job, error: null };
  },

  getJobs: async (filters: any): Promise<DbResponse<any[]>> => {
    if (filters.company_id) {
      const companyJobs = mockJobs.filter(
        (job: Job) => job.company_id === filters.company_id
      );
      return { data: companyJobs, error: null };
    }
    // For the public job board, return all jobs with company info
    const openJobs = mockJobs.filter((j: Job) => j.status === "open");
    const jobsWithCompanyInfo = openJobs.map((job: Job) => {
      const companyProfile = mockProfiles.find(
        (p: MockProfile) => p.id === job.company_id
      );
      return {
        ...job,
        company_name: companyProfile?.company_name || "Unknown Company",
        avatar_url: companyProfile?.avatar_url,
      };
    });
    return { data: jobsWithCompanyInfo, error: null };
  },

  // Companies
  getCompany: async (profileId: string): Promise<DbResponse<any>> => {
    const profile = mockProfiles.find(
      (p: MockProfile) => p.id === profileId && p.role === "company"
    );
    if (!profile) {
      return { data: null, error: { message: "Company not found" } };
    }
    // Create a mock company object based on the profile
    const company = {
      id: profile.id, // Use profile ID as company ID for mock
      profile_id: profile.id,
      name: profile.company_name || profile.full_name,
      slug: (profile.company_name || profile.full_name)
        .toLowerCase()
        .replace(/\s+/g, "-"),
      description: "",
      website: "",
      logo_url: null,
      industry: "",
      company_size: "",
      location: "",
      founded_year: null,
      culture_values: [],
      benefits: [],
      social_links: {},
      is_verified: false,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
    return { data: company, error: null };
  },

  createCompany: async (companyData: any): Promise<DbResponse<any>> => {
    const company = {
      ...companyData,
      id: companyData.profile_id, // Use profile_id as company ID for mock
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return { data: company, error: null };
  },

  updateCompany: async (
    companyId: string,
    updates: any
  ): Promise<DbResponse<any>> => {
    // For mock, just return success
    return { data: { id: companyId, ...updates }, error: null };
  },

  // Talents
  createTalent: async (talentData: any): Promise<DbResponse<any>> => {
    const talent = {
      ...talentData,
      id: talentData.profile_id, // Use profile_id as talent ID for mock
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return { data: talent, error: null };
  },

  updateTalent: async (
    talentId: string,
    updates: any
  ): Promise<DbResponse<any>> => {
    // For mock, just return success
    return { data: { id: talentId, ...updates }, error: null };
  },

  // Skills
  getSkills: async (): Promise<DbResponse<any[]>> => {
    const mockSkills = [
      { id: "1", name: "JavaScript", category: "Programming", is_active: true },
      { id: "2", name: "React", category: "Frontend", is_active: true },
      { id: "3", name: "Node.js", category: "Backend", is_active: true },
      { id: "4", name: "Python", category: "Programming", is_active: true },
      { id: "5", name: "TypeScript", category: "Programming", is_active: true },
    ];
    return { data: mockSkills, error: null };
  },

  // Messages
  getMessages: async (userId: string): Promise<DbResponse<any[]>> => {
    return { data: [], error: null };
  },

  sendMessage: async (messageData: any): Promise<DbResponse<any>> => {
    return { data: { id: `msg_${Date.now()}`, ...messageData }, error: null };
  },

  // Activity logging
  logActivity: async (activityData: any): Promise<DbResponse<any>> => {
    return {
      data: { id: `activity_${Date.now()}`, ...activityData },
      error: null,
    };
  },
};
