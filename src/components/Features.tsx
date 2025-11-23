import { BarChart3, Brain, Clock, MessageSquare, Shield, Target, Users, Zap } from 'lucide-react';
import React from 'react';
import { notify } from "../utils/notify";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './auth/AuthModal';

export default function Features() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Matching',
      description: 'Advanced machine learning algorithms analyze skills, experience, and culture fit to find perfect matches.',
      color: 'purple'
    },
    {
      icon: Shield,
      title: 'Verified Profiles',
      description: 'All talent profiles are verified with skill assessments and background checks for quality assurance.',
      color: 'blue'
    },
    {
      icon: Zap,
      title: 'Instant Connections',
      description: 'Real-time matching and instant notifications when perfect opportunities or talents are found.',
      color: 'green'
    },
    {
      icon: Users,
      title: 'Culture Matching',
      description: 'Our AI considers company culture and values to ensure long-term successful relationships.',
      color: 'indigo'
    },
    {
      icon: Target,
      title: 'Precision Matching',
      description: 'Filter by specific skills, experience levels, location preferences, and salary expectations.',
      color: 'pink'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Comprehensive analytics and insights to track hiring success and talent engagement.',
      color: 'orange'
    },
    {
      icon: MessageSquare,
      title: 'Direct Messaging',
      description: 'Built-in communication tools for seamless interaction between talents and companies.',
      color: 'teal'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Round-the-clock customer support to help with matching, onboarding, and any questions.',
      color: 'red'
    }
  ];

  const { isAuthenticated, profile } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<'signin' | 'signup'>('signin');
  const navigate = useNavigate();

  const handleProtectedAction = (action: () => void) => {
    if (!isAuthenticated) {
      setAuthMode('signin');
      setIsAuthModalOpen(true);
      notify.showInfo('Please sign in to continue.');
      return;
    }
    action();
  };

  const handleStartAsTalent = () => {
    handleProtectedAction(() => {
      if (profile && !profile.full_name) {
        navigate('/profile-completion');
      } else {
        navigate('/dashboard');
      }
    });
  };

  const handlePostJob = () => {
    handleProtectedAction(() => {
      // Assuming /post-job is the route for posting a job
      navigate('/post-job');
    });
  };

  const getColorClasses = (_color: string) => {
    // Simplified to use primary blue for all features to match "simple" request
    return 'bg-primary-light text-primary group-hover:bg-primary group-hover:text-white';
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Why Choose{' '}
            <span className="text-primary">
              TalentBrains?
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform combines cutting-edge AI technology with deep industry expertise to revolutionize how talents and companies connect.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-6 bg-white rounded-xl border border-gray-200 hover:border-primary hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ${getColorClasses(feature.color)}`}>
                  <Icon className="h-6 w-6 transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-primary rounded-2xl p-8 sm:p-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Find Your Perfect Match?
            </h3>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of successful professionals and companies who have found their ideal partnerships through TalentBrains.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                className="px-8 py-4 bg-white text-primary rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200 transform hover:scale-105"
                onClick={handleStartAsTalent}
              >
                Start as a Talent
              </button>
              <button
                className="px-8 py-4 bg-primary-hover text-white rounded-xl font-semibold hover:bg-blue-900 transition-colors duration-200 transform hover:scale-105 border-2 border-white/30"
                onClick={handlePostJob}
              >
                Post a Job
              </button>
            </div>
          </div>
        </div>
      </div>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </section>
  );
}
