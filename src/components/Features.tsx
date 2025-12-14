import { ChartBar, Brain, Clock, ChatCircle, Shield, Crosshair, Users, Lightning } from '@phosphor-icons/react';
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
    },
    {
      icon: Shield,
      title: 'Verified Profiles',
      description: 'All talent profiles are verified with skill assessments and background checks for quality assurance.',
    },
    {
      icon: Lightning,
      title: 'Instant Connections',
      description: 'Real-time matching and instant notifications when perfect opportunities or talents are found.',
    },
    {
      icon: Users,
      title: 'Culture Matching',
      description: 'Our AI considers company culture and values to ensure long-term successful relationships.',
    },
    {
      icon: Crosshair,
      title: 'Precision Matching',
      description: 'Filter by specific skills, experience levels, location preferences, and salary expectations.',
    },
    {
      icon: ChartBar,
      title: 'Analytics Dashboard',
      description: 'Comprehensive analytics and insights to track hiring success and talent engagement.',
    },
    {
      icon: ChatCircle,
      title: 'Direct Messaging',
      description: 'Built-in communication tools for seamless interaction between talents and companies.',
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Round-the-clock customer support to help with matching, onboarding, and any questions.',
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
      navigate('/post-job');
    });
  };

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Why Choose{' '}
            <span className="text-primary">TalentBrains?</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Our platform combines cutting-edge AI technology with deep industry expertise to revolutionize how talents and companies connect.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-slate-50 border border-slate-200 group-hover:bg-primary group-hover:border-primary transition-all duration-200">
                  <Icon size={20} weight="regular" className="text-primary group-hover:text-white transition-colors duration-200" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-primary transition-colors duration-200">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA Section - Classic style with solid blue */}
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
                className="px-8 py-4 bg-white text-primary rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                onClick={handleStartAsTalent}
              >
                Start as a Talent
              </button>
              <button
                className="px-8 py-4 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors border border-blue-600"
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
