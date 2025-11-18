import { motion } from 'framer-motion';

interface PageLoaderProps {
  text?: string;
}

export default function PageLoader({ text = "Loading..." }: PageLoaderProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
          <div className="relative w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
        <p className="text-lg font-medium text-gray-700">{text}</p>
      </motion.div>
    </div>
  );
}
