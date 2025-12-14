import React from 'react';
import { motion } from 'framer-motion';
import AIMatching from "../../components/matching/AIMatching";

const AIMatchingPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <h1 className="text-3xl font-bold text-gray-800 mb-4">AI-Powered Matching</h1>
      <p className="text-gray-600 mb-6">Discover the perfect candidates with our advanced AI matching technology.</p>
      <div className="pt-8">
        <AIMatching />
      </div>
    </motion.div>
  );
};

export default AIMatchingPage;