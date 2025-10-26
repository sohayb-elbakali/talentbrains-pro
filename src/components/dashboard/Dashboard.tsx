import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import AdminDashboard from './AdminDashboard'
import CompanyDashboard from '../company/CompanyDashboard'
import TalentDashboard from './TalentDashboard'
import WelcomeDashboard from './WelcomeDashboard'

export default function Dashboard() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please sign in to access your dashboard.</p>
        </div>
      </div>
    )
  }

  // Check if this is a new user (no last_login_at or very recent profile creation)
  const isNewUser = !profile.last_login_at || 
    (profile.created_at && new Date(profile.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50"
    >
      {isNewUser ? (
        <WelcomeDashboard />
      ) : (
        <>
          {profile.role === 'talent' && <TalentDashboard />}
          {profile.role === 'company' && <CompanyDashboard />}
          {profile.role === 'admin' && <AdminDashboard />}
        </>
      )}
    </motion.div>
  )
}
