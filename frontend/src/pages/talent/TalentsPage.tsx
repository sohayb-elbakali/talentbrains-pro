import { motion } from 'framer-motion';
import TalentProfiles from '../../components/profile/TalentProfiles'

const TalentsPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Discover <span className="text-primary">Talents</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Connect with exceptional professionals who have the skills and experience to bring your vision to life
          </p>
        </div>
      </motion.div>
      <TalentProfiles />
    </div>
  );
};

export default TalentsPage;