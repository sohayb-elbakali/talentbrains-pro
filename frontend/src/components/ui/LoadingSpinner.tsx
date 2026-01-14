import { motion, AnimatePresence } from 'framer-motion';
import { CircleNotch } from '@phosphor-icons/react';
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
  variant?: 'default' | 'dots' | 'gradient';
  blur?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text = 'Loading...',
  fullScreen = false,
  className = '',
  variant = 'default',
  blur = true,
}) => {
  const sizeClasses = {
    sm: 16,
    md: 32,
    lg: 48
  };

  const iconSize = sizeClasses[size];

  // Dots variant spinner
  const dotsSpinner = (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
          className={`rounded-full bg-blue-500 ${size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'
            }`}
        />
      ))}
    </div>
  );

  // Gradient ring spinner
  const gradientSpinner = (
    <div className="relative" style={{ width: iconSize, height: iconSize }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, transparent, #3b82f6, transparent)',
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), white calc(100% - 3px))',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), white calc(100% - 3px))',
        }}
      />
    </div>
  );

  // Default spinner
  const defaultSpinner = (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      className="text-blue-500"
    >
      <CircleNotch size={iconSize} weight="regular" />
    </motion.div>
  );

  const spinner = variant === 'dots' ? dotsSpinner : variant === 'gradient' ? gradientSpinner : defaultSpinner;

  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col items-center justify-center ${className}`}
    >
      {spinner}
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-3 text-sm text-slate-500 font-medium"
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`min-h-screen flex items-center justify-center ${blur
              ? 'bg-slate-50/80 backdrop-blur-sm'
              : 'bg-slate-50'
            }`}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    );
  }

  return content;
};

export default LoadingSpinner;
