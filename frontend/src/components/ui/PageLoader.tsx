import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface PageLoaderProps {
  isLoading?: boolean;
  text?: string;
  showLogo?: boolean;
  fullScreen?: boolean;
  transparent?: boolean;
}

/**
 * Premium page loader with glassmorphism and smooth animations
 */
const PageLoader: React.FC<PageLoaderProps> = ({
  isLoading = true,
  text = 'Loading...',
  showLogo = true,
  fullScreen = true,
  transparent = false,
}) => {
  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`
        ${fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0'}
        flex items-center justify-center
        ${transparent
          ? 'bg-white/60 backdrop-blur-md'
          : 'bg-gradient-to-br from-slate-50 via-white to-blue-50/30'
        }
      `}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 15, 0],
            x: [0, -15, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl"
        />
      </div>

      {/* Loader content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        {/* Logo/Icon */}
        {showLogo && (
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl scale-150" />

            {/* Icon container */}
            <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </motion.div>
        )}

        {/* Animated dots loader */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
              className="w-2.5 h-2.5 bg-blue-500 rounded-full"
            />
          ))}
        </div>

        {/* Text */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-medium text-slate-500"
        >
          {text}
        </motion.p>
      </motion.div>
    </motion.div>
  );

  return (
    <AnimatePresence mode="wait">
      {isLoading && content}
    </AnimatePresence>
  );
};

/**
 * Inline loader for sections (not fullscreen)
 */
export const SectionLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-16 gap-4"
    >
      {/* Spinning gradient ring */}
      <div className="relative w-12 h-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-300"
        />
        <div className="absolute inset-1 rounded-full bg-white" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
        </div>
      </div>

      <p className="text-sm text-slate-500 font-medium">{text}</p>
    </motion.div>
  );
};

/**
 * Overlay loader for content that's refreshing
 */
export const RefreshOverlay: React.FC<{ isRefreshing: boolean }> = ({ isRefreshing }) => {
  return (
    <AnimatePresence>
      {isRefreshing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-white/50 backdrop-blur-[2px] rounded-xl flex items-center justify-center z-10"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageLoader;
