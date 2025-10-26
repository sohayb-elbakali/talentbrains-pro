import { motion } from 'framer-motion'
import { Edit, Mail, Shield, User, Calendar, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { notificationManager } from '../utils/notificationManager'
import { db } from '../lib/supabase'

export default function AdminProfilePage() {
  const { profile, user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || ''
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      const { error } = await db.updateProfile(user.id, {
        full_name: editData.full_name,
        email: editData.email
      })

      if (error) {
        toast.error('Failed to update profile')
        return
      }

      toast.success('Profile updated successfully!')
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditData({
      full_name: profile?.full_name || '',
      email: profile?.email || ''
    })
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
                <p className="text-gray-600">System Administrator</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
          </div>
        </motion.div>

        {/* Profile Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {profile?.full_name || 'Not provided'}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-2" />
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {profile?.email || 'Not provided'}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="h-4 w-4 inline mr-2" />
                Role
              </label>
              <p className="text-gray-900 bg-red-50 px-3 py-2 rounded-lg flex items-center">
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full mr-2">
                  ADMIN
                </span>
                System Administrator
              </p>
            </div>

            {/* Account Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CheckCircle className="h-4 w-4 inline mr-2" />
                Account Status
              </label>
              <p className="text-gray-900 bg-green-50 px-3 py-2 rounded-lg flex items-center">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full mr-2">
                  ACTIVE
                </span>
                Account Active
              </p>
            </div>

            {/* Created Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-2" />
                Account Created
              </label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {profile?.created_at 
                  ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Unknown'
                }
              </p>
            </div>

            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <p className="text-gray-600 bg-gray-50 px-3 py-2 rounded-lg font-mono text-sm">
                {profile?.id || 'Unknown'}
              </p>
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          {isEditing && (
            <div className="mt-6 flex space-x-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </motion.div>

        {/* Admin Privileges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Administrator Privileges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-red-600" />
              <span className="text-gray-900">Full System Access</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-red-600" />
              <span className="text-gray-900">User Management</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-red-600" />
              <span className="text-gray-900">Content Moderation</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-red-600" />
              <span className="text-gray-900">System Analytics</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
