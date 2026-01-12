import { AnimatePresence, motion } from 'framer-motion';
import { Buildings, Eye, EyeSlash, X, ArrowRight, User, Envelope, Lock, UserCircle, WifiX, ArrowClockwise } from '@phosphor-icons/react';
import React, { useEffect, useState } from "react";
import { createPortal } from 'react-dom';
import { notify } from "../../utils/notify";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNetworkStatus } from '../../hooks/useNetworkResilience';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { cn } from '../../lib/utils';
import { AuthFormLoadingSkeleton } from './AuthModalSkeleton';

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'signin' | 'signup'
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode)
  const [userType, setUserType] = useState<'talent' | 'company'>('talent')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const { signIn, signUp, loading, isAuthenticated, profile } = useAuth()
  const { isOnline, networkStatus } = useNetworkStatus()
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setErrors({});
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    }
  }, [isOpen, defaultMode]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      onClose();
    }
  }, [isAuthenticated, isOpen, onClose]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (mode === 'signup') {
      if (!formData.fullName) {
        newErrors.fullName = 'Full name is required'
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }

      if (userType === 'company' && !formData.companyName) {
        newErrors.companyName = 'Company name is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    // Check network status before attempting submission
    if (!isOnline) {
      setSubmissionError('No internet connection. Please check your network and try again.')
      notify.showError('No internet connection')
      return
    }

    setIsSubmitting(true)
    setSubmissionError(null)

    const maxRetries = 2
    let attempt = 0

    const attemptSubmission = async (): Promise<boolean> => {
      try {
        if (mode === 'signin') {
          const result = await signIn(formData.email, formData.password)
          if (result && result.success) {
            onClose();
            setTimeout(() => {
              if (profile?.role === "company") {
                navigate("/company");
              } else if (profile?.role === "talent") {
                navigate("/talent");
              } else if (profile?.role === "admin") {
                navigate("/admin");
              } else {
                navigate("/dashboard");
              }
            }, 500);
            return true
          } else {
            // Check if it's a network error
            const errorMessage = result?.error?.message || ''
            if (errorMessage.includes('fetch') || errorMessage.includes('network') || !navigator.onLine) {
              throw new Error('Network error')
            }
            notify.showError(errorMessage || 'Sign in failed')
            return false
          }
        } else {
          const userData: any = {
            full_name: formData.fullName,
            role: userType,
          };
          if (userType === 'company') {
            userData.company_name = formData.companyName;
          }

          const result = await signUp(formData.email, formData.password, userData)
          if (result && result.success) {
            onClose()
            navigate('/profile-completion')
            return true
          } else {
            const errorMessage = result?.error?.message || ''
            if (errorMessage.includes('fetch') || errorMessage.includes('network') || !navigator.onLine) {
              throw new Error('Network error')
            }
            notify.showError(errorMessage || 'Sign up failed. Please try again.')
            return false
          }
        }
      } catch (error: any) {
        // If network error and we haven't exceeded retries, try again
        if (attempt < maxRetries && (error.message === 'Network error' || !navigator.onLine)) {
          attempt++
          setRetryCount(attempt)
          console.log(`Auth attempt ${attempt} failed, retrying...`)
          // Wait before retrying with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)))
          if (navigator.onLine) {
            return attemptSubmission()
          }
        }

        // Final failure
        setSubmissionError('Connection error. Please check your network and try again.')
        notify.showError('Connection error. Please try again.')
        return false
      }
    }

    await attemptSubmission()
    setIsSubmitting(false)
    setRetryCount(0)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    // Clear submission error when user starts typing again
    if (submissionError) {
      setSubmissionError(null)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md max-h-[90vh] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative flex flex-col"
          style={{ maxHeight: '90vh' }}
        >
          {/* Offline Banner */}
          <AnimatePresence>
            {!isOnline && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium"
              >
                <WifiX size={18} weight="bold" />
                <span>No internet connection</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-900"
            aria-label="Close"
          >
            <X size={20} weight="regular" />
          </button>

          <div className="w-full flex-1 overflow-y-auto">
            <div className="p-5">
              {/* Show skeleton while in submitting state with retry */}
              {isSubmitting && retryCount > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-8"
                >
                  <AuthFormLoadingSkeleton />
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center text-sm text-slate-500 mt-4"
                  >
                    Retrying... (Attempt {retryCount + 1})
                  </motion.p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h1 className="text-2xl font-bold mb-1 text-slate-900">
                    {mode === 'signin' ? 'Welcome back' : 'Create an account'}
                  </h1>
                  <p className="text-slate-500 mb-5">
                    {mode === 'signin'
                      ? 'Sign in to access your dashboard'
                      : 'Join thousands of professionals and companies'}
                  </p>

                  {/* Submission Error Alert */}
                  <AnimatePresence>
                    {submissionError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3"
                      >
                        <WifiX size={20} className="text-red-500 flex-shrink-0 mt-0.5" weight="bold" />
                        <div className="flex-1">
                          <p className="text-sm text-red-700 font-medium">{submissionError}</p>
                          <button
                            type="button"
                            onClick={() => setSubmissionError(null)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium mt-1 hover:underline"
                          >
                            Dismiss
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                      <div className="mb-4 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setUserType('talent')}
                          className={cn(
                            "p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all duration-200",
                            userType === 'talent'
                              ? "border-primary bg-slate-50 text-primary"
                              : "border-slate-200 hover:border-slate-300 text-slate-500"
                          )}
                        >
                          <UserCircle size={20} weight="regular" className={userType === 'talent' ? "text-primary" : "text-slate-400"} />
                          <span className="font-medium text-sm">Talent</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserType('company')}
                          className={cn(
                            "p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all duration-200",
                            userType === 'company'
                              ? "border-primary bg-slate-50 text-primary"
                              : "border-slate-200 hover:border-slate-300 text-slate-500"
                          )}
                        >
                          <Buildings size={20} weight="regular" className={userType === 'company' ? "text-primary" : "text-slate-400"} />
                          <span className="font-medium text-sm">Company</span>
                        </button>
                      </div>
                    )}

                    {mode === 'signup' && (
                      <Input
                        label="Full Name"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        placeholder="John Doe"
                        error={errors.fullName}
                        leftIcon={<User size={20} className="text-slate-400" />}
                        disabled={isSubmitting}
                      />
                    )}

                    {mode === 'signup' && userType === 'company' && (
                      <Input
                        label="Company Name"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        placeholder="Acme Inc."
                        error={errors.companyName}
                        leftIcon={<Buildings size={20} className="text-slate-400" />}
                        disabled={isSubmitting}
                      />
                    )}

                    <Input
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="you@example.com"
                      error={errors.email}
                      leftIcon={<Envelope size={20} className="text-slate-400" />}
                      disabled={isSubmitting}
                    />

                    <Input
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="••••••••"
                      error={errors.password}
                      leftIcon={<Lock size={20} className="text-slate-400" />}
                      rightIcon={showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                      onRightIconClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitting}
                    />

                    {mode === 'signup' && (
                      <Input
                        label="Confirm Password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="••••••••"
                        error={errors.confirmPassword}
                        leftIcon={<Lock size={20} className="text-slate-400" />}
                        rightIcon={showConfirmPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                        onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isSubmitting}
                      />
                    )}

                    <div className="pt-2">
                      <Button
                        type="submit"
                        loading={loading || isSubmitting || !!isAuthenticated}
                        disabled={!isOnline || isSubmitting}
                        fullWidth
                        size="lg"
                      >
                        {isSubmitting && retryCount > 0 ? (
                          <>
                            <ArrowClockwise size={20} className="mr-2 animate-spin" />
                            Retrying...
                          </>
                        ) : !isOnline ? (
                          <>
                            <WifiX size={20} className="mr-2" />
                            Offline
                          </>
                        ) : (
                          <>
                            {mode === 'signin' ? 'Sign In' : 'Create Account'}
                            <ArrowRight size={20} className="ml-2" />
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="text-center mt-6">
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-slate-500">
                            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                        disabled={isSubmitting}
                        className="text-primary hover:text-blue-700 font-medium text-sm transition-colors hover:underline disabled:opacity-50"
                      >
                        {mode === 'signin' ? 'Create an account' : 'Sign in instead'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  )
}

