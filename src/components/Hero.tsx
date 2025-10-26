import { ArrowRight, Target, TrendingUp, Users, Zap } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './auth/AuthModal';

export default function Hero() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const { isAuthenticated } = useAuth();

  const handleAuthClick = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <section className="pt-24 pb-16 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm border border-purple-200">
                <Zap className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-600">AI-Powered Matching</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Connect{' '}
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Top Talent
                </span>{' '}
                with{' '}
                <span className="bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
                  Great Companies
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
                Our advanced AI algorithms analyze skills, culture fit, and career goals to create perfect matches between talented professionals and innovative companies.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <a
                    href="/dashboard"
                    className="group flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <span className="font-semibold mr-2">Go to Dashboard</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                ) : (
                  <>
                    <button
                      onClick={() => handleAuthClick('signup')}
                      className="group flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <span className="font-semibold mr-2">Get Started</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    <button
                      onClick={() => handleAuthClick('signin')}
                      className="flex items-center justify-center px-8 py-4 bg-white text-gray-700 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:text-purple-600 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                    >
                      <span className="font-semibold">Sign In</span>
                    </button>
                  </>
                )}
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">10K+</div>
                  <div className="text-sm text-gray-600">Active Talents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">500+</div>
                  <div className="text-sm text-gray-600">Companies</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <div className="text-sm text-gray-600">Match Success</div>
                </div>
              </div>
            </div>
            
            {/* Visual */}
            <div className="relative">
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">AI Matching Process</h3>
                    <div className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Active
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Analyzing Profiles</div>
                        <div className="w-48 h-2 bg-gray-200 rounded-full">
                          <div className="w-full h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Target className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Finding Matches</div>
                        <div className="w-48 h-2 bg-gray-200 rounded-full">
                          <div className="w-3/4 h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Optimizing Results</div>
                        <div className="w-48 h-2 bg-gray-200 rounded-full">
                          <div className="w-1/2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">Match Confidence</div>
                    <div className="text-2xl font-bold text-green-600">92%</div>
                  </div>
                </div>
              </div>
              
              {/* Background decorations */}
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-purple-200 rounded-full opacity-50"></div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-blue-200 rounded-full opacity-30"></div>
              <div className="absolute top-1/2 -right-8 w-16 h-16 bg-green-200 rounded-full opacity-40"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </>
  );
}
