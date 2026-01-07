import { mockDb } from "@/test/mocks";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CompanyProfileUpdateModal from "../../components/company/CompanyProfileUpdateModal";
import TalentProfileUpdateModal from "../../components/talent/TalentProfileUpdateModal";
import {
  validateCompanyProfile,
  validateTalentProfile,
} from "../../utils/profileValidation";

// Mock the auth hook
vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user-id", email: "test@example.com" },
    profile: { id: "test-user-id", role: "company", full_name: "Test User" },
  }),
}));

// Mock the database
vi.mock("../../lib/supabase", () => ({
  db: {
    getCompany: vi.fn(),
    updateCompany: vi.fn(),
    getTalent: vi.fn(),
    updateTalent: vi.fn(),
    createTalent: vi.fn(),
  },
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
    <Toaster />
  </BrowserRouter>
);

describe("Profile Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Company Profile Validation", () => {
    it("should validate required fields", () => {
      const invalidData = {
        name: "",
        description: "",
        industry: "",
        company_size: "",
        location: "",
      };

      const result = validateCompanyProfile(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe("Company name is required");
      expect(result.errors.description).toBe("Company description is required");
      expect(result.errors.industry).toBe("Industry is required");
      expect(result.errors.company_size).toBe("Company size is required");
      expect(result.errors.location).toBe("Location is required");
    });

    it("should validate field lengths", () => {
      const invalidData = {
        name: "A", // Too short
        description: "Short", // Too short
        industry: "Technology",
        company_size: "1-10",
        location: "A".repeat(101), // Too long
      };

      const result = validateCompanyProfile(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe(
        "Company name must be at least 2 characters"
      );
      expect(result.errors.description).toBe(
        "Description must be at least 10 characters"
      );
      expect(result.errors.location).toBe(
        "Location must be less than 100 characters"
      );
    });

    it("should validate URLs", () => {
      const invalidData = {
        name: "Test Company",
        description: "A great company for testing",
        industry: "Technology",
        company_size: "1-10",
        location: "San Francisco",
        website: "invalid-url",
        social_links: {
          linkedin: "not-a-url",
          twitter: "also-not-a-url",
        },
      };

      const result = validateCompanyProfile(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.website).toBe("Please enter a valid website URL");
      expect(result.errors["social_links.linkedin"]).toBe(
        "Please enter a valid linkedin URL"
      );
      expect(result.errors["social_links.twitter"]).toBe(
        "Please enter a valid twitter URL"
      );
    });

    it("should pass validation with valid data", () => {
      const validData = {
        name: "Test Company",
        description: "A great company for testing purposes",
        industry: "Technology",
        company_size: "1-10",
        location: "San Francisco, CA",
        website: "https://example.com",
        founded_year: 2020,
        culture_values: ["Innovation", "Collaboration"],
        benefits: ["Health insurance", "Remote work"],
        social_links: {
          linkedin: "https://linkedin.com/company/test",
          twitter: "https://twitter.com/test",
        },
      };

      const result = validateCompanyProfile(validData);

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });
  });

  describe("Talent Profile Validation", () => {
    it("should validate required fields", () => {
      const invalidData = {
        title: "",
        bio: "",
        location: "",
        years_of_experience: undefined,
      };

      const result = validateTalentProfile(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBe("Job title is required");
      expect(result.errors.bio).toBe("Professional bio is required");
      expect(result.errors.location).toBe("Location is required");
      expect(result.errors.years_of_experience).toBe(
        "Years of experience is required and must be 0 or greater"
      );
    });

    it("should validate field lengths", () => {
      const invalidData = {
        title: "A", // Too short
        bio: "Short", // Too short
        location: "A".repeat(101), // Too long
        years_of_experience: 0,
      };

      const result = validateTalentProfile(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBe(
        "Job title must be at least 2 characters"
      );
      expect(result.errors.bio).toBe("Bio must be at least 10 characters");
      expect(result.errors.location).toBe(
        "Location must be less than 100 characters"
      );
    });

    it("should validate rate ranges", () => {
      const invalidData = {
        title: "Software Engineer",
        bio: "Experienced software engineer",
        location: "San Francisco",
        years_of_experience: 5,
        hourly_rate_min: 100,
        hourly_rate_max: 50, // Max less than min
        salary_expectation_min: 120000,
        salary_expectation_max: 80000, // Max less than min
      };

      const result = validateTalentProfile(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.hourly_rate_max).toBe(
        "Maximum rate must be greater than minimum rate"
      );
      expect(result.errors.salary_expectation_max).toBe(
        "Maximum salary must be greater than minimum salary"
      );
    });

    it("should validate URLs", () => {
      const invalidData = {
        title: "Software Engineer",
        bio: "Experienced software engineer",
        location: "San Francisco",
        years_of_experience: 5,
        portfolio_url: "invalid-url",
        github_url: "not-a-url",
        linkedin_url: "also-not-a-url",
      };

      const result = validateTalentProfile(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.portfolio_url).toBe("Please enter a valid URL");
      expect(result.errors.github_url).toBe("Please enter a valid URL");
      expect(result.errors.linkedin_url).toBe("Please enter a valid URL");
    });

    it("should pass validation with valid data", () => {
      const validData = {
        title: "Senior Software Engineer",
        bio: "Experienced software engineer with expertise in React and Node.js",
        location: "San Francisco, CA",
        years_of_experience: 5,
        remote_preference: true,
        experience_level: "senior" as const,
        availability_status: "available" as const,
        hourly_rate_min: 75,
        hourly_rate_max: 125,
        salary_expectation_min: 120000,
        salary_expectation_max: 180000,
        portfolio_url: "https://portfolio.example.com",
        github_url: "https://github.com/user",
        linkedin_url: "https://linkedin.com/in/user",
        languages: ["English", "Spanish"],
        timezone: "PST",
        work_authorization: "US Citizen",
        education: [],
        certifications: [],
      };

      const result = validateTalentProfile(validData);

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });
  });

  describe("Company Profile Update Modal", () => {
    it("should render and load existing data", async () => {
      const mockCompanyData = {
        id: "company-id",
        profile_id: "test-user-id",
        name: "Test Company",
        slug: "test-company",
        description: "A test company",
        industry: "Technology",
        company_size: "1-10",
        location: "San Francisco",
        culture_values: ["Innovation"],
        benefits: ["Health insurance"],
        social_links: {},
        is_verified: false,
        created_at: "2023-01-01",
        updated_at: "2023-01-01",
      };

      mockDb.getCompany.mockResolvedValue({
        data: mockCompanyData,
        error: null,
      });

      render(
        <TestWrapper>
          <CompanyProfileUpdateModal isOpen={true} onClose={() => { }} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Company")).toBeInTheDocument();
        expect(screen.getByDisplayValue("A test company")).toBeInTheDocument();
      });
    });

    it("should show validation errors on invalid submission", async () => {
      mockDb.getCompany.mockResolvedValue({ data: null, error: null });

      render(
        <TestWrapper>
          <CompanyProfileUpdateModal isOpen={true} onClose={() => { }} />
        </TestWrapper>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText("Update Company Profile")).toBeInTheDocument();
      });

      // Try to save without filling required fields
      const saveButton = screen.getByText("Save Changes");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("Company name is required")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Company description is required")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Talent Profile Update Modal", () => {
    it("should render and load existing data", async () => {
      const mockTalentData = {
        id: "talent-id",
        profile_id: "test-user-id",
        title: "Software Engineer",
        bio: "Experienced developer",
        location: "San Francisco",
        remote_preference: true,
        experience_level: "mid" as const,
        years_of_experience: 3,
        availability_status: "available" as const,
        languages: ["English"],
        timezone: "PST",
        education: [],
        certifications: [],
        created_at: "2023-01-01",
        updated_at: "2023-01-01",
      };

      mockDb.getTalent.mockResolvedValue({ data: mockTalentData, error: null });

      render(
        <TestWrapper>
          <TalentProfileUpdateModal isOpen={true} onClose={() => { }} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByDisplayValue("Software Engineer")
        ).toBeInTheDocument();
        expect(
          screen.getByDisplayValue("Experienced developer")
        ).toBeInTheDocument();
      });
    });

    it("should show validation errors on invalid submission", async () => {
      mockDb.getTalent.mockResolvedValue({ data: null, error: null });

      render(
        <TestWrapper>
          <TalentProfileUpdateModal isOpen={true} onClose={() => { }} />
        </TestWrapper>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText("Update Talent Profile")).toBeInTheDocument();
      });

      // Clear required fields and try to save
      const titleInput = screen.getByPlaceholderText(
        "e.g., Senior Software Engineer"
      );
      fireEvent.change(titleInput, { target: { value: "" } });

      const saveButton = screen.getByText("Save Changes");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Job title is required")).toBeInTheDocument();
      });
    });
  });
});
