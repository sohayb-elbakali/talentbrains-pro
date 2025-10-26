import { describe, it, expect } from 'vitest';
import { validateCompanyProfile, validateTalentProfile, isValidUrl } from '../../utils/profileValidation';

describe('Profile Validation', () => {
  describe('URL Validation', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://subdomain.example.com/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('Company Profile Validation', () => {
    it('should validate required fields', () => {
      const invalidData = {
        name: '',
        description: '',
        industry: '',
        company_size: '',
        location: '',
      };

      const result = validateCompanyProfile(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('Company name is required');
      expect(result.errors.description).toBe('Company description is required');
      expect(result.errors.industry).toBe('Industry is required');
      expect(result.errors.company_size).toBe('Company size is required');
      expect(result.errors.location).toBe('Location is required');
    });

    it('should validate field lengths', () => {
      const invalidData = {
        name: 'A', // Too short
        description: 'Short', // Too short
        industry: 'Technology',
        company_size: '1-10',
        location: 'A'.repeat(101), // Too long
      };

      const result = validateCompanyProfile(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('Company name must be at least 2 characters');
      expect(result.errors.description).toBe('Description must be at least 10 characters');
      expect(result.errors.location).toBe('Location must be less than 100 characters');
    });

    it('should validate URLs', () => {
      const invalidData = {
        name: 'Test Company',
        description: 'A great company for testing',
        industry: 'Technology',
        company_size: '1-10',
        location: 'San Francisco',
        website: 'invalid-url',
        social_links: {
          linkedin: 'not-a-url',
          twitter: 'also-not-a-url',
        },
      };

      const result = validateCompanyProfile(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.website).toBe('Please enter a valid website URL');
      expect(result.errors['social_links.linkedin']).toBe('Please enter a valid linkedin URL');
      expect(result.errors['social_links.twitter']).toBe('Please enter a valid twitter URL');
    });

    it('should validate founded year range', () => {
      const currentYear = new Date().getFullYear();
      
      const invalidData = {
        name: 'Test Company',
        description: 'A great company for testing',
        industry: 'Technology',
        company_size: '1-10',
        location: 'San Francisco',
        founded_year: currentYear + 1, // Future year
      };

      const result = validateCompanyProfile(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.founded_year).toBe(`Founded year must be between 1800 and ${currentYear}`);
    });

    it('should validate culture values limit', () => {
      const invalidData = {
        name: 'Test Company',
        description: 'A great company for testing',
        industry: 'Technology',
        company_size: '1-10',
        location: 'San Francisco',
        culture_values: ['Value1', 'Value2', 'Value3', 'Value4', 'Value5', 'Value6'], // Too many
      };

      const result = validateCompanyProfile(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.culture_values).toBe('Please select up to 5 culture values');
    });

    it('should pass validation with valid data', () => {
      const validData = {
        name: 'Test Company',
        description: 'A great company for testing purposes',
        industry: 'Technology',
        company_size: '1-10',
        location: 'San Francisco, CA',
        website: 'https://example.com',
        founded_year: 2020,
        culture_values: ['Innovation', 'Collaboration'],
        benefits: ['Health insurance', 'Remote work'],
        social_links: {
          linkedin: 'https://linkedin.com/company/test',
          twitter: 'https://twitter.com/test',
        },
      };

      const result = validateCompanyProfile(validData);
      
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });
  });

  describe('Talent Profile Validation', () => {
    it('should validate required fields', () => {
      const invalidData = {
        title: '',
        bio: '',
        location: '',
        years_of_experience: undefined,
      };

      const result = validateTalentProfile(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBe('Job title is required');
      expect(result.errors.bio).toBe('Professional bio is required');
      expect(result.errors.location).toBe('Location is required');
      expect(result.errors.years_of_experience).toBe('Years of experience is required and must be 0 or greater');
    });

    it('should validate field lengths', () => {
      const invalidData = {
        title: 'A', // Too short
        bio: 'Short', // Too short
        location: 'A'.repeat(101), // Too long
        years_of_experience: 0,
      };

      const result = validateTalentProfile(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBe('Job title must be at least 2 characters');
      expect(result.errors.bio).toBe('Bio must be at least 10 characters');
      expect(result.errors.location).toBe('Location must be less than 100 characters');
    });

    it('should validate years of experience range', () => {
      const invalidData = {
        title: 'Software Engineer',
        bio: 'Experienced software engineer',
        location: 'San Francisco',
        years_of_experience: 51, // Too high
      };

      const result = validateTalentProfile(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.years_of_experience).toBe('Years of experience must be 50 or less');
    });

    it('should validate rate ranges', () => {
      const invalidData = {
        title: 'Software Engineer',
        bio: 'Experienced software engineer',
        location: 'San Francisco',
        years_of_experience: 5,
        hourly_rate_min: 100,
        hourly_rate_max: 50, // Max less than min
        salary_expectation_min: 120000,
        salary_expectation_max: 80000, // Max less than min
      };

      const result = validateTalentProfile(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.hourly_rate_max).toBe('Maximum rate must be greater than minimum rate');
      expect(result.errors.salary_expectation_max).toBe('Maximum salary must be greater than minimum salary');
    });

    it('should validate URLs', () => {
      const invalidData = {
        title: 'Software Engineer',
        bio: 'Experienced software engineer',
        location: 'San Francisco',
        years_of_experience: 5,
        portfolio_url: 'invalid-url',
        github_url: 'not-a-url',
        linkedin_url: 'also-not-a-url',
      };

      const result = validateTalentProfile(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.portfolio_url).toBe('Please enter a valid URL');
      expect(result.errors.github_url).toBe('Please enter a valid URL');
      expect(result.errors.linkedin_url).toBe('Please enter a valid URL');
    });

    it('should validate empty languages array', () => {
      const invalidData = {
        title: 'Software Engineer',
        bio: 'Experienced software engineer',
        location: 'San Francisco',
        years_of_experience: 5,
        languages: [], // Empty array
      };

      const result = validateTalentProfile(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.languages).toBe('Please select at least one language');
    });

    it('should pass validation with valid data', () => {
      const validData = {
        title: 'Senior Software Engineer',
        bio: 'Experienced software engineer with expertise in React and Node.js',
        location: 'San Francisco, CA',
        years_of_experience: 5,
        remote_preference: true,
        experience_level: 'senior' as const,
        availability_status: 'available' as const,
        hourly_rate_min: 75,
        hourly_rate_max: 125,
        salary_expectation_min: 120000,
        salary_expectation_max: 180000,
        portfolio_url: 'https://portfolio.example.com',
        github_url: 'https://github.com/user',
        linkedin_url: 'https://linkedin.com/in/user',
        languages: ['English', 'Spanish'],
        timezone: 'PST',
        work_authorization: 'US Citizen',
        education: [],
        certifications: [],
      };

      const result = validateTalentProfile(validData);
      
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });
  });
});
