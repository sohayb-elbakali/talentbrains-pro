import React from 'react';
import { motion } from 'framer-motion';
import TalentProfiles from '../components/TalentProfiles'

const TalentsPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Discover Talents</h1>
      <p className="text-gray-600 mb-6">Find and manage exceptional talent for your projects.</p>
      <div className="pt-8">
        <TalentProfiles />
      </div>
    </motion.div>
  );
};

export default TalentsPage;