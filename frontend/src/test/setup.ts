import { vi } from "vitest";

const mockResponse = { data: {}, error: null };

vi.mock("../lib/supabase", () => ({
  db: {
    getProfile: vi.fn().mockResolvedValue(mockResponse),
    updateProfile: vi.fn().mockResolvedValue(mockResponse),
    getCompany: vi.fn().mockResolvedValue(mockResponse),
    createCompany: vi.fn().mockResolvedValue(mockResponse),
    getTalent: vi.fn().mockResolvedValue(mockResponse),
    createTalent: vi.fn().mockResolvedValue(mockResponse),
    getJobs: vi.fn().mockResolvedValue(mockResponse),
    getJob: vi.fn().mockResolvedValue(mockResponse),
    createJob: vi.fn().mockResolvedValue(mockResponse),
    getApplications: vi.fn().mockResolvedValue(mockResponse),
    createApplication: vi.fn().mockResolvedValue(mockResponse),
    getMatches: vi.fn().mockResolvedValue(mockResponse),
    getSkills: vi.fn().mockResolvedValue(mockResponse),
    getMessages: vi.fn().mockResolvedValue(mockResponse),
    sendMessage: vi.fn().mockResolvedValue(mockResponse),
    getNotifications: vi.fn().mockResolvedValue(mockResponse),
    createNotification: vi.fn().mockResolvedValue(mockResponse),
    getAnalytics: vi.fn().mockResolvedValue(mockResponse),
    logActivity: vi.fn().mockResolvedValue(mockResponse),
  },
}));
