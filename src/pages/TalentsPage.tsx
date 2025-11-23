import { motion } from 'framer-motion';
import TalentProfiles from '../components/TalentProfiles'

const TalentsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-block mb-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <h1 className="relative text-5xl sm:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Discover Talents
                </span>
              </h1>
            </div>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            Connect with exceptional professionals who have the skills and experience to bring your vision to life
          </motion.p>
        </div>
      </motion.div>
      <TalentProfiles />
    </div>
  );
};

export default TalentsPage;