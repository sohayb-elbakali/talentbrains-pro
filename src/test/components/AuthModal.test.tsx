import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AuthModal from '../../components/auth/AuthModal'

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: vi.fn().mockResolvedValue({ success: true }),
    signUp: vi.fn().mockResolvedValue({ success: true }),
    loading: false
  })
}))

describe('AuthModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    defaultMode: 'signin' as const
  }

  it('renders sign in form by default', () => {
    render(<AuthModal {...defaultProps} />)
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('switches to sign up mode when button is clicked', async () => {
    render(<AuthModal {...defaultProps} />)
    
    fireEvent.click(screen.getByText('Sign Up'))
    
    await waitFor(() => {
      expect(screen.getByText('Create Account')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument()
    })
  })

  it('shows user type selection in sign up mode', async () => {
    render(<AuthModal {...defaultProps} defaultMode="signup" />)
    
    expect(screen.getByText('I am a...')).toBeInTheDocument()
    expect(screen.getByText('Talent')).toBeInTheDocument()
    expect(screen.getByText('Company')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<AuthModal {...defaultProps} />)
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    render(<AuthModal {...defaultProps} />)
    
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'invalid-email' }
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Email is invalid')).toBeInTheDocument()
    })
  })

  it('validates password length', async () => {
    render(<AuthModal {...defaultProps} />)
    
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: '123' }
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })
  })

  it('closes modal when close button is clicked', () => {
    const onClose = vi.fn()
    render(<AuthModal {...defaultProps} onClose={onClose} />)
    
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    
    expect(onClose).toHaveBeenCalled()
  })

  it('does not render when isOpen is false', () => {
    render(<AuthModal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Welcome Back')).not.toBeInTheDocument()
  })
})