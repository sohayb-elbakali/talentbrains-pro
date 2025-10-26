import { CompanyUpdateData, TalentUpdateData } from '../types/database';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Company profile validation
export const validateCompanyProfile = (data: CompanyUpdateData): ValidationResult => {
  const errors: Record<string, string> = {};

  // Required fields
  if (!data.name?.trim()) {
    errors.name = 'Company name is required';
  } else if (data.name.length < 2) {
    errors.name = 'Company name must be at least 2 characters';
  } else if (data.name.length > 100) {
    errors.name = 'Company name must be less than 100 characters';
  }

  if (!data.description?.trim()) {
    errors.description = 'Company description is required';
  } else if (data.description.length < 10) {
    errors.description = 'Description must be at least 10 characters';
  } else if (data.description.length > 2000) {
    errors.description = 'Description must be less than 2000 characters';
  }

  if (!data.industry) {
    errors.industry = 'Industry is required';
  }

  if (!data.company_size) {
    errors.company_size = 'Company size is required';
  }

  if (!data.location?.trim()) {
    errors.location = 'Location is required';
  } else if (data.location.length > 100) {
    errors.location = 'Location must be less than 100 characters';
  }

  // Optional field validations
  if (data.website && !isValidUrl(data.website)) {
    errors.website = 'Please enter a valid website URL';
  }

  if (data.founded_year) {
    const currentYear = new Date().getFullYear();
    if (data.founded_year < 1800 || data.founded_year > currentYear) {
      errors.founded_year = `Founded year must be between 1800 and ${currentYear}`;
    }
  }

  // Social links validation
  if (data.social_links) {
    const socialFields = ['linkedin', 'twitter', 'facebook', 'website'] as const;
    socialFields.forEach(field => {
      const url = data.social_links?.[field];
      if (url && !isValidUrl(url)) {
        errors[`social_links.${field}`] = `Please enter a valid ${field} URL`;
      }
    });
  }

  // Culture values limit
  if (data.culture_values && data.culture_values.length > 5) {
    errors.culture_values = 'Please select up to 5 culture values';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Talent profile validation
export const validateTalentProfile = (data: TalentUpdateData): ValidationResult => {
  const errors: Record<string, string> = {};

  // Required fields
  if (!data.title?.trim()) {
    errors.title = 'Job title is required';
  } else if (data.title.length < 2) {
    errors.title = 'Job title must be at least 2 characters';
  } else if (data.title.length > 100) {
    errors.title = 'Job title must be less than 100 characters';
  }

  if (!data.bio?.trim()) {
    errors.bio = 'Professional bio is required';
  } else if (data.bio.length < 10) {
    errors.bio = 'Bio must be at least 10 characters';
  } else if (data.bio.length > 2000) {
    errors.bio = 'Bio must be less than 2000 characters';
  }

  if (!data.location?.trim()) {
    errors.location = 'Location is required';
  } else if (data.location.length > 100) {
    errors.location = 'Location must be less than 100 characters';
  }

  if (data.years_of_experience === undefined || data.years_of_experience < 0) {
    errors.years_of_experience = 'Years of experience is required and must be 0 or greater';
  } else if (data.years_of_experience > 50) {
    errors.years_of_experience = 'Years of experience must be 50 or less';
  }

  // Optional field validations
  const urlFields = ['portfolio_url', 'resume_url', 'github_url', 'linkedin_url'] as const;
  urlFields.forEach(field => {
    const url = data[field] as string;
    if (url && !isValidUrl(url)) {
      errors[field] = 'Please enter a valid URL';
    }
  });

  // Rate validations
  if (data.hourly_rate_min !== undefined) {
    if (data.hourly_rate_min < 0) {
      errors.hourly_rate_min = 'Hourly rate must be 0 or greater';
    } else if (data.hourly_rate_min > 1000) {
      errors.hourly_rate_min = 'Hourly rate must be less than $1000';
    }
  }

  if (data.hourly_rate_max !== undefined) {
    if (data.hourly_rate_max < 0) {
      errors.hourly_rate_max = 'Hourly rate must be 0 or greater';
    } else if (data.hourly_rate_max > 1000) {
      errors.hourly_rate_max = 'Hourly rate must be less than $1000';
    }
  }

  if (data.hourly_rate_min !== undefined && data.hourly_rate_max !== undefined) {
    if (data.hourly_rate_min > data.hourly_rate_max) {
      errors.hourly_rate_max = 'Maximum rate must be greater than minimum rate';
    }
  }

  // Salary validations
  if (data.salary_expectation_min !== undefined) {
    if (data.salary_expectation_min < 0) {
      errors.salary_expectation_min = 'Salary must be 0 or greater';
    } else if (data.salary_expectation_min > 1000000) {
      errors.salary_expectation_min = 'Salary must be less than $1,000,000';
    }
  }

  if (data.salary_expectation_max !== undefined) {
    if (data.salary_expectation_max < 0) {
      errors.salary_expectation_max = 'Salary must be 0 or greater';
    } else if (data.salary_expectation_max > 1000000) {
      errors.salary_expectation_max = 'Salary must be less than $1,000,000';
    }
  }

  if (data.salary_expectation_min !== undefined && data.salary_expectation_max !== undefined) {
    if (data.salary_expectation_min > data.salary_expectation_max) {
      errors.salary_expectation_max = 'Maximum salary must be greater than minimum salary';
    }
  }

  // Languages validation
  if (data.languages && data.languages.length === 0) {
    errors.languages = 'Please select at least one language';
  }

  // Education validation
  if (data.education) {
    data.education.forEach((edu, index) => {
      if (edu.degree && !edu.degree.trim()) {
        errors[`education.${index}.degree`] = 'Degree is required';
      }
      if (edu.institution && !edu.institution.trim()) {
        errors[`education.${index}.institution`] = 'Institution is required';
      }
      if (edu.year && !edu.year.trim()) {
        errors[`education.${index}.year`] = 'Year is required';
      }
    });
  }

  // Certifications validation
  if (data.certifications) {
    data.certifications.forEach((cert, index) => {
      if (cert.name && !cert.name.trim()) {
        errors[`certifications.${index}.name`] = 'Certification name is required';
      }
      if (cert.issuer && !cert.issuer.trim()) {
        errors[`certifications.${index}.issuer`] = 'Issuer is required';
      }
      if (cert.year && !cert.year.trim()) {
        errors[`certifications.${index}.year`] = 'Year is required';
      }
      if (cert.url && !isValidUrl(cert.url)) {
        errors[`certifications.${index}.url`] = 'Please enter a valid URL';
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Generic field validation helpers
export const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateMinLength = (value: string, minLength: number, fieldName: string): string | null => {
  if (value && value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return null;
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): string | null => {
  if (value && value.length > maxLength) {
    return `${fieldName} must be less than ${maxLength} characters`;
  }
  return null;
};

export const validateUrl = (value: string, fieldName: string): string | null => {
  if (value && !isValidUrl(value)) {
    return `Please enter a valid ${fieldName} URL`;
  }
  return null;
};

export const validateRange = (value: number, min: number, max: number, fieldName: string): string | null => {
  if (value !== undefined && (value < min || value > max)) {
    return `${fieldName} must be between ${min} and ${max}`;
  }
  return null;
};
