import { motion } from 'framer-motion';
import React from 'react';

const SettingsPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8"
    >
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600 mb-8">Manage your account and app preferences.</p>

        <div className="space-y-6">
          {/* Future settings can be added here */}
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
