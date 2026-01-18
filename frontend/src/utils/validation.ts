import { z } from 'zod'

// User validation schemas
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['talent', 'company']),
  companyName: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === 'company') {
    return data.companyName && data.companyName.length >= 2
  }
  return true
}, {
  message: "Company name is required for company accounts",
  path: ["companyName"],
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

// Profile validation schemas
export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  avatar_url: z.string().url().optional().or(z.literal('')),
  preferences: z.record(z.any()).optional()
})

// Company validation schemas
export const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  slug: z.string().min(2, 'Company slug must be at least 2 characters'),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  location: z.string().optional(),
  founded_year: z.number().min(1800).max(new Date().getFullYear()).optional(),
  culture_values: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional()
})

// Talent validation schemas
export const talentSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  bio: z.string().optional(),
  location: z.string().optional(),
  remote_preference: z.boolean().default(true),
  experience_level: z.enum(['entry', 'junior', 'mid', 'senior', 'lead', 'executive']),
  years_of_experience: z.number().min(0).max(50),
  hourly_rate_min: z.number().min(0).optional(),
  hourly_rate_max: z.number().min(0).optional(),
  salary_expectation_min: z.number().min(0).optional(),
  salary_expectation_max: z.number().min(0).optional(),
  portfolio_url: z.string().url().optional().or(z.literal('')),
  resume_url: z.string().url().optional().or(z.literal('')),
  github_url: z.string().url().optional().or(z.literal('')),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  languages: z.array(z.string()).default(['English']),
  timezone: z.string().default('UTC'),
  work_authorization: z.string().optional()
})

// Job validation schemas
export const jobSchema = z.object({
  title: z.string().min(2, 'Job title must be at least 2 characters'),
  slug: z.string().min(2, 'Job slug must be at least 2 characters'),
  description: z.string().min(50, 'Job description must be at least 50 characters'),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'freelance', 'internship']),
  experience_level: z.enum(['entry', 'junior', 'mid', 'senior', 'lead', 'executive']),
  location: z.string().optional(),
  remote_allowed: z.boolean().default(false),
  salary_min: z.number().min(0).optional(),
  salary_max: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  benefits: z.array(z.string()).optional(),
  application_deadline: z.string().optional()
})

// Application validation schemas
export const applicationSchema = z.object({
  job_id: z.string().uuid(),
  talent_id: z.string().uuid(),
  cover_letter: z.string().optional(),
  custom_resume_url: z.string().url().optional().or(z.literal(''))
})

// Message validation schemas
export const messageSchema = z.object({
  recipient_id: z.string().uuid(),
  subject: z.string().optional(),
  content: z.string().min(1, 'Message content is required'),
  thread_id: z.string().uuid().optional(),
  parent_message_id: z.string().uuid().optional()
})

// Validation helper functions
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      return { success: false, errors }
    }
    return { success: false, errors: ['Validation failed'] }
  }
}

/**
 * Comprehensive input sanitization to prevent XSS attacks.
 * Removes HTML tags, script content, event handlers, and dangerous patterns.
 * 
 * @param input - The string to sanitize
 * @returns Sanitized string safe for display
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove HTML comments
  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove all HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove event handlers (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/\bon\w+\s*=/gi, '');

  // Remove javascript: and data: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');

  // Remove HTML entities that could be used for XSS
  sanitized = sanitized.replace(/&lt;/gi, '<').replace(/</g, '');
  sanitized = sanitized.replace(/&gt;/gi, '>').replace(/>/g, '');
  sanitized = sanitized.replace(/&quot;/gi, '"');
  sanitized = sanitized.replace(/&#x27;/gi, "'");
  sanitized = sanitized.replace(/&#x2F;/gi, '/');

  // Remove null bytes
  sanitized = sanitized.replace(/\x00/g, '');

  // Trim and normalize whitespace
  sanitized = sanitized.trim().replace(/\s+/g, ' ');

  return sanitized;
};

/**
 * Sanitize HTML content while preserving safe tags (for rich text).
 * Removes dangerous scripts, styles, event handlers, and dangerous URLs.
 * 
 * Note: For production use with rich text, consider using a library like DOMPurify.
 * Safe tags that could be allowed: p, br, b, i, u, strong, em, ul, ol, li, a, span
 * Safe attributes that could be allowed: href, class
 * 
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  let sanitized = html;

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove event handlers (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: URLs from href
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');

  // Remove data: URLs from href
  sanitized = sanitized.replace(/href\s*=\s*["']data:[^"']*["']/gi, 'href="#"');

  // Remove vbscript: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']vbscript:[^"']*["']/gi, 'href="#"');

  return sanitized;
};

/**
 * Escape special characters for safe display in HTML context.
 * Use this when you need to display user input as text, not HTML.
 * 
 * @param text - Text to escape
 * @returns HTML-escaped text
 */
export const escapeHtml = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  return text.replace(/[&<>"'`=/]/g, char => escapeMap[char] || char);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateFileUpload = (file: File, allowedTypes: string[], maxSize: number): { isValid: boolean; error?: string } => {
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size too large. Maximum size: ${maxSize / 1024 / 1024}MB`
    }
  }

  return { isValid: true }
}