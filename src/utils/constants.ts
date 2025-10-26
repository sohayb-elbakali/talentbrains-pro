// Application constants
export const APP_CONFIG = {
  name: 'TalentBrains',
  version: '1.0.0',
  description: 'AI-Powered Talent Matching Platform',
  url: 'https://talentbrains.com',
  supportEmail: 'support@talentbrains.com'
}

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    signUp: '/auth/signup',
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    refresh: '/auth/refresh',
    resetPassword: '/auth/reset-password'
  },
  profiles: '/profiles',
  companies: '/companies',
  talents: '/talents',
  jobs: '/jobs',
  applications: '/applications',
  matches: '/matches',
  messages: '/messages',
  notifications: '/notifications',
  skills: '/skills',
  analytics: '/analytics'
}

// User roles
export const USER_ROLES = {
  TALENT: 'talent',
  COMPANY: 'company',
  ADMIN: 'admin'
} as const

// Employment types
export const EMPLOYMENT_TYPES = {
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  CONTRACT: 'contract',
  FREELANCE: 'freelance',
  INTERNSHIP: 'internship'
} as const

// Experience levels
export const EXPERIENCE_LEVELS = {
  ENTRY: 'entry',
  JUNIOR: 'junior',
  MID: 'mid',
  SENIOR: 'senior',
  LEAD: 'lead',
  EXECUTIVE: 'executive'
} as const

// Application statuses
export const APPLICATION_STATUSES = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  INTERVIEW: 'interview',
  OFFER: 'offer',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
} as const

// Match statuses
export const MATCH_STATUSES = {
  PENDING: 'pending',
  VIEWED: 'viewed',
  INTERESTED: 'interested',
  NOT_INTERESTED: 'not_interested',
  CONTACTED: 'contacted'
} as const

// Job statuses
export const JOB_STATUSES = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  CLOSED: 'closed',
  EXPIRED: 'expired'
} as const

// Notification types
export const NOTIFICATION_TYPES = {
  MATCH: 'match',
  APPLICATION: 'application',
  MESSAGE: 'message',
  SYSTEM: 'system',
  REMINDER: 'reminder'
} as const

// File upload constants
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ALL: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  }
}

// Pagination constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1
}

// Search constants
export const SEARCH = {
  MIN_QUERY_LENGTH: 2,
  DEBOUNCE_DELAY: 300,
  MAX_RESULTS: 50
}

// Validation constants
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  BIO_MAX_LENGTH: 1000,
  DESCRIPTION_MAX_LENGTH: 5000,
  TITLE_MAX_LENGTH: 200
}

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
  API: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'
}

// Currency constants
export const CURRENCIES = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  CAD: 'CAD',
  AUD: 'AUD'
}

// Timezone constants
export const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney'
]

// Language constants
export const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
  'Hindi'
]

// Company size options
export const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5000+'
]

// Industry options
export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Manufacturing',
  'Construction',
  'Transportation',
  'Entertainment',
  'Government',
  'Non-profit',
  'Other'
]

// Skill categories
export const SKILL_CATEGORIES = [
  'Programming Languages',
  'Frontend',
  'Backend',
  'Database',
  'Cloud & DevOps',
  'Design',
  'Data Science & AI',
  'Mobile',
  'Tools',
  'Methodologies',
  'APIs',
  'Quality Assurance',
  'Management'
]

// Match score thresholds
export const MATCH_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 80,
  FAIR: 70,
  POOR: 60
}

export const MATCHING_WEIGHTS = {
  SKILLS: 0.4,
  EXPERIENCE: 0.25,
  LOCATION: 0.2,
  SALARY: 0.15
}

// Rate limiting
export const RATE_LIMITS = {
  API_REQUESTS_PER_MINUTE: 60,
  LOGIN_ATTEMPTS_PER_HOUR: 5,
  PASSWORD_RESET_PER_HOUR: 3,
  MESSAGE_SENDS_PER_HOUR: 20
}

// Cache durations (in milliseconds)
export const CACHE_DURATIONS = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 2 * 60 * 60 * 1000, // 2 hours
  VERY_LONG: 24 * 60 * 60 * 1000 // 24 hours
}

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
}

// Success messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully!',
  APPLICATION_SUBMITTED: 'Application submitted successfully!',
  MESSAGE_SENT: 'Message sent successfully!',
  JOB_POSTED: 'Job posted successfully!',
  ACCOUNT_CREATED: 'Account created successfully!',
  PASSWORD_RESET: 'Password reset email sent!',
  EMAIL_VERIFIED: 'Email verified successfully!'
}

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  VALIDATION: 'Please check your input and try again.',
  AUTHENTICATION: 'Authentication failed. Please sign in again.',
  AUTHORIZATION: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  RATE_LIMIT: 'Too many requests. Please wait before trying again.',
  FILE_UPLOAD: 'File upload failed. Please try again.',
  EMAIL_TAKEN: 'This email is already registered.',
  INVALID_CREDENTIALS: 'Invalid email or password.'
}

export default {
  APP_CONFIG,
  API_ENDPOINTS,
  USER_ROLES,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  APPLICATION_STATUSES,
  MATCH_STATUSES,
  JOB_STATUSES,
  NOTIFICATION_TYPES,
  FILE_UPLOAD,
  PAGINATION,
  SEARCH,
  VALIDATION,
  DATE_FORMATS,
  CURRENCIES,
  TIMEZONES,
  LANGUAGES,
  COMPANY_SIZES,
  INDUSTRIES,
  SKILL_CATEGORIES,
  MATCH_THRESHOLDS,
  MATCHING_WEIGHTS,
  RATE_LIMITS,
  CACHE_DURATIONS,
  ERROR_CODES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES
}