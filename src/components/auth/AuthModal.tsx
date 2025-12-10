import { AnimatePresence, motion } from 'framer-motion';
import { Building, Eye, EyeOff, X, ArrowRight, User, Mail, Lock, UserCircle } from 'lucide-react';
import React, { useEffect, useState } from "react";
import { notify } from "../../utils/notify";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input, cn } from '../ui/travel-connect-signin-1';

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
  const [isHovered, setIsHovered] = useState(false)

  const { signIn, signUp, loading, isAuthenticated, profile } = useAuth()
  const navigate = useNavigate()

  // Update mode when defaultMode changes (when modal opens with different button)
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
        // Wait a bit longer for profile to be loaded, then navigate based on actual profile role
        setTimeout(() => {
          if (profile?.role === "company") {
            navigate("/company");
          } else if (profile?.role === "talent") {
            navigate("/talent");
          } else if (profile?.role === "admin") {
            navigate("/admin");
          } else {
            // If profile is still not loaded, navigate to dashboard and let the app handle routing
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
        if (userType === 'company') {
          navigate('/company')
        } else {
          navigate('/talent')
        }
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

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden relative flex flex-col"
          style={{ maxHeight: '90vh' }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-white/80 hover:bg-white rounded-full transition-all duration-200 text-gray-500 hover:text-gray-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Form */}
          <div className="w-full flex-1 overflow-y-auto">
            <div className="p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">
                  {mode === 'signin' ? 'Welcome back' : 'Create an account'}
                </h1>
                <p className="text-gray-500 mb-6">
                  {mode === 'signin'
                    ? 'Sign in to access your dashboard'
                    : 'Join thousands of professionals and companies'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <div className="mb-6 grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setUserType('talent')}
                        className={cn(
                          "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-200",
                          userType === 'talent'
                            ? "border-primary bg-blue-50/50 text-primary"
                            : "border-gray-100 hover:border-gray-200 text-gray-500"
                        )}
                      >
                        <UserCircle className={cn("h-6 w-6", userType === 'talent' ? "text-primary" : "text-gray-400")} />
                        <span className="font-medium text-sm">Talent</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserType('company')}
                        className={cn(
                          "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-200",
                          userType === 'company'
                            ? "border-primary bg-blue-50/50 text-primary"
                            : "border-gray-100 hover:border-gray-200 text-gray-500"
                        )}
                      >
                        <Building className={cn("h-6 w-6", userType === 'company' ? "text-primary" : "text-gray-400")} />
                        <span className="font-medium text-sm">Company</span>
                      </button>
                    </div>
                  )}

                  {mode === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-blue-500">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          placeholder="John Doe"
                          className={cn(
                            "pl-10",
                            errors.fullName && "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      </div>
                      {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                    </div>
                  )}

                  {mode === 'signup' && userType === 'company' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name <span className="text-blue-500">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          value={formData.companyName}
                          onChange={(e) => handleInputChange('companyName', e.target.value)}
                          placeholder="Acme Inc."
                          className={cn(
                            "pl-10",
                            errors.companyName && "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                        <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      </div>
                      {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-blue-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="you@example.com"
                        className={cn(
                          "pl-10",
                          errors.email && "border-red-500 focus-visible:ring-red-500"
                        )}
                      />
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password <span className="text-blue-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="••••••••"
                        className={cn(
                          "pl-10 pr-10",
                          errors.password && "border-red-500 focus-visible:ring-red-500"
                        )}
                      />
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <button
                        type="button"
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  </div>

                  {mode === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password <span className="text-blue-500">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          placeholder="••••••••"
                          className={cn(
                            "pl-10 pr-10",
                            errors.confirmPassword && "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <button
                          type="button"
                          className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                    </div>
                  )}

                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                    className="pt-2"
                  >
                    <Button
                      type="submit"
                      disabled={loading || isAuthenticated}
                      className={cn(
                        "w-full py-6 text-base shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden",
                        isHovered ? "shadow-blue-200" : ""
                      )}
                    >
                      <span className="flex items-center justify-center relative z-10">
                        {loading ? (
                          <span className="animate-pulse">Processing...</span>
                        ) : (
                          <>
                            {mode === 'signin' ? 'Sign In' : 'Create Account'}
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </span>
                      {isHovered && !loading && (
                        <motion.span
                          initial={{ left: "-100%" }}
                          animate={{ left: "100%" }}
                          transition={{ duration: 1, ease: "easeInOut" }}
                          className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent z-0"
                          style={{ filter: "blur(8px)" }}
                        />
                      )}
                    </Button>
                  </motion.div>

                  <div className="text-center mt-6">
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">
                          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                      className="text-primary hover:text-primary-hover font-semibold text-sm transition-colors hover:underline"
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
    </div>
  )
}
