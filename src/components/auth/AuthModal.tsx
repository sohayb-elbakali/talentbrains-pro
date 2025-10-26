import { AnimatePresence, motion } from 'framer-motion';
import { Building, Eye, EyeOff, Lock, Mail, Sparkles, User, UserCircle, X } from 'lucide-react';
import React, { useEffect, useState } from "react";
import { notificationManager } from '../../utils/notificationManager';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

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

  // Update mode when defaultMode changes (when modal opens with different button)
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
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
        toast.error(result?.error?.message || 'Sign in failed')
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
        toast.error(result?.error?.message || 'Sign up failed. Please try again.')
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
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto max-h-[95vh] overflow-y-auto my-8 border border-purple-100"
        >
          {/* Header with gradient background */}
          <div className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-t-3xl p-8 pb-12">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-all duration-200 backdrop-blur-sm"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-white" />
            </button>
            
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              >
                <Sparkles className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {mode === 'signin' ? 'Welcome Back!' : 'Join TalentBrains'}
              </h2>
              <p className="text-purple-100 text-sm">
                {mode === 'signin' 
                  ? 'Sign in to continue your journey' 
                  : 'Create your account and get started'}
              </p>
            </div>
          </div>

          <div className="p-8 -mt-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">

              {mode === 'signup' && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-purple-600" />
                    I am a...
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <motion.button
                      type="button"
                      onClick={() => setUserType('talent')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-5 border-2 rounded-xl flex flex-col items-center space-y-3 transition-all duration-200 ${
                        userType === 'talent'
                          ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 text-purple-700 shadow-md'
                          : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${
                        userType === 'talent' 
                          ? 'bg-gradient-to-br from-purple-500 to-blue-600' 
                          : 'bg-gray-100'
                      }`}>
                        <User className={`h-6 w-6 ${userType === 'talent' ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <span className="font-semibold">Talent</span>
                      <span className="text-xs text-gray-500">Find opportunities</span>
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => setUserType('company')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-5 border-2 rounded-xl flex flex-col items-center space-y-3 transition-all duration-200 ${
                        userType === 'company'
                          ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 text-purple-700 shadow-md'
                          : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${
                        userType === 'company' 
                          ? 'bg-gradient-to-br from-purple-500 to-blue-600' 
                          : 'bg-gray-100'
                      }`}>
                        <Building className={`h-6 w-6 ${userType === 'company' ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <span className="font-semibold">Company</span>
                      <span className="text-xs text-gray-500">Hire talent</span>
                    </motion.button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-500">
                        <User className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                          errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-purple-300'
                        }`}
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.fullName && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-2 flex items-center gap-1"
                      >
                        <span className="font-medium">⚠</span> {errors.fullName}
                      </motion.p>
                    )}
                  </div>
                )}

                {mode === 'signup' && userType === 'company' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-500">
                        <Building className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                          errors.companyName ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-purple-300'
                        }`}
                        placeholder="Acme Corporation"
                      />
                    </div>
                    {errors.companyName && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-2 flex items-center gap-1"
                      >
                        <span className="font-medium">⚠</span> {errors.companyName}
                      </motion.p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-500">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                        errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-purple-300'
                      }`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm mt-2 flex items-center gap-1"
                    >
                      <span className="font-medium">⚠</span> {errors.email}
                    </motion.p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-500">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                        errors.password ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-purple-300'
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm mt-2 flex items-center gap-1"
                    >
                      <span className="font-medium">⚠</span> {errors.password}
                    </motion.p>
                  )}
                </div>

                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-500">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                          errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-purple-300'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        tabIndex={-1}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-2 flex items-center gap-1"
                      >
                        <span className="font-medium">⚠</span> {errors.confirmPassword}
                      </motion.p>
                    )}
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading || isAuthenticated}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  aria-label={mode === 'signin' ? 'Sign In' : 'Create Account'}
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span aria-live="polite">Please wait...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    </>
                  )}
                </motion.button>
                {isAuthenticated && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-green-600 text-center mt-2 font-medium"
                  >
                    ✓ You are already signed in.
                  </motion.p>
                )}
              </form>

              <div className="mt-6 text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">
                      {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="mt-4 text-purple-600 hover:text-purple-700 font-bold text-base hover:underline transition-all"
                >
                  {mode === 'signin' ? '→ Create an account' : '→ Sign in instead'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
