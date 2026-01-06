import { AnimatePresence, motion } from 'framer-motion';
import { Buildings, Eye, EyeSlash, X, ArrowRight, User, Envelope, Lock, UserCircle } from '@phosphor-icons/react';
import React, { useEffect, useState } from "react";
import { createPortal } from 'react-dom';
import { notify } from "../../utils/notify";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { cn } from '../../lib/utils';

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

  const { signIn, signUp, loading, isAuthenticated, profile } = useAuth()
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
      } else {
        notify.showError(result?.error?.message || 'Sign in failed')
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
        // Always redirect to profile-completion after signup
        // The /profile-completion route will handle role-based redirection
        navigate('/profile-completion')
      } else {
        notify.showError(result?.error?.message || 'Sign up failed. Please try again.')
      }
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
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
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-900"
            aria-label="Close"
          >
            <X size={20} weight="regular" />
          </button>

          <div className="w-full flex-1 overflow-y-auto">
            <div className="p-5">
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
                    />
                  )}

                  <div className="pt-2">
                    <Button
                      type="submit"
                      loading={loading || !!isAuthenticated} // Force boolean
                      fullWidth
                      size="lg"
                    >
                      {mode === 'signin' ? 'Sign In' : 'Create Account'}
                      <ArrowRight size={20} className="ml-2" />
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
                      className="text-primary hover:text-blue-700 font-medium text-sm transition-colors hover:underline"
                    >
                      {mode === 'signin' ? 'Create an account' : 'Sign in instead'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  )
}

