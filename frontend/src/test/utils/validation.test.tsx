import { describe, it, expect } from 'vitest'
import { 
  validateData, 
  validateEmail, 
  validatePassword, 
  validateFileUpload,
  signInSchema,
  signUpSchema 
} from '../../utils/validation'

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('user+tag@example.org')).toBe(true)
    })

    it('rejects invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('test.example.com')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('validates strong passwords', () => {
      const result = validatePassword('StrongPass123')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rejects weak passwords', () => {
      const result = validatePassword('weak')
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('requires minimum length', () => {
      const result = validatePassword('123')
      expect(result.errors).toContain('Password must be at least 6 characters long')
    })

    it('requires uppercase letter', () => {
      const result = validatePassword('lowercase123')
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
    })

    it('requires lowercase letter', () => {
      const result = validatePassword('UPPERCASE123')
      expect(result.errors).toContain('Password must contain at least one lowercase letter')
    })

    it('requires number', () => {
      const result = validatePassword('NoNumbers')
      expect(result.errors).toContain('Password must contain at least one number')
    })
  })

  describe('validateFileUpload', () => {
    const createMockFile = (name: string, type: string, size: number) => {
      return new File([''], name, { type }) as File & { size: number }
    }

    it('validates allowed file types', () => {
      const file = createMockFile('test.pdf', 'application/pdf', 1024)
      file.size = 1024
      
      const result = validateFileUpload(file, ['application/pdf'], 2048)
      expect(result.isValid).toBe(true)
    })

    it('rejects disallowed file types', () => {
      const file = createMockFile('test.exe', 'application/exe', 1024)
      file.size = 1024
      
      const result = validateFileUpload(file, ['application/pdf'], 2048)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('File type not allowed')
    })

    it('rejects files that are too large', () => {
      const file = createMockFile('test.pdf', 'application/pdf', 3072)
      file.size = 3072
      
      const result = validateFileUpload(file, ['application/pdf'], 2048)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('File size too large')
    })
  })

  describe('validateData', () => {
    it('validates correct sign in data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123'
      }
      
      const result = validateData(signInSchema, data)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(data)
    })

    it('rejects invalid sign in data', () => {
      const data = {
        email: 'invalid-email',
        password: ''
      }
      
      const result = validateData(signInSchema, data)
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it('validates correct sign up data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'John Doe',
        role: 'talent'
      }
      
      const result = validateData(signUpSchema, data)
      expect(result.success).toBe(true)
    })

    it('rejects sign up data with mismatched passwords', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different',
        fullName: 'John Doe',
        role: 'talent'
      }
      
      const result = validateData(signUpSchema, data)
      expect(result.success).toBe(false)
      expect(result.errors).toContain('confirmPassword: Passwords don\'t match')
    })

    it('requires company name for company accounts', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'John Doe',
        role: 'company'
      }
      
      const result = validateData(signUpSchema, data)
      expect(result.success).toBe(false)
      expect(result.errors).toContain('companyName: Company name is required for company accounts')
    })
  })
})