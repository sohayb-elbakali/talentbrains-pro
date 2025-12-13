import { ArrowRight, Crosshair, TrendUp, Users, Lightning } from '@phosphor-icons/react';
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
      <section className="pt-24 pb-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center px-4 py-2 bg-slate-50 rounded-full border border-slate-200">
                <Lightning size={16} weight="regular" className="text-primary mr-2" />
                <span className="text-sm font-medium text-primary">AI-Powered Matching</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                Connect{' '}
                <span className="text-primary">Top Talent</span>{' '}
                with{' '}
                <span className="text-slate-700">Great Companies</span>
              </h1>

              <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
                Our advanced AI algorithms analyze skills, culture fit, and career goals to create perfect matches between talented professionals and innovative companies.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <a
                    href="/dashboard"
                    className="group flex items-center justify-center px-8 py-4 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <span className="font-semibold mr-2">Go to Dashboard</span>
                    <ArrowRight size={20} weight="regular" className="group-hover:translate-x-1 transition-transform" />
                  </a>
                ) : (
                  <>
                    <button
                      onClick={() => handleAuthClick('signup')}
                      className="group flex items-center justify-center px-8 py-4 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <span className="font-semibold mr-2">Get Started</span>
                      <ArrowRight size={20} weight="regular" className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => handleAuthClick('signin')}
                      className="flex items-center justify-center px-8 py-4 bg-white text-slate-700 rounded-lg border border-slate-200 hover:border-primary hover:text-primary transition-colors"
                    >
                      <span className="font-semibold">Sign In</span>
                    </button>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">10K+</div>
                  <div className="text-sm text-slate-500">Active Talents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">500+</div>
                  <div className="text-sm text-slate-500">Companies</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <div className="text-sm text-slate-500">Match Success</div>
                </div>
              </div>
            </div>

            {/* Visual - Classic Card */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-8 hover:shadow-lg transition-shadow duration-200">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">
                      AI <span className="text-orange-500">Matching</span> Process
                    </h3>
                    <div className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full border border-orange-200">
                      Active
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200">
                        <Users size={16} weight="regular" className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">Analyzing Profiles</div>
                        <div className="w-full h-2 bg-slate-100 rounded-full mt-1">
                          <div className="w-full h-2 bg-primary rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center border border-orange-200">
                        <Crosshair size={16} weight="regular" className="text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">Finding Matches</div>
                        <div className="w-full h-2 bg-slate-100 rounded-full mt-1">
                          <div className="w-3/4 h-2 bg-orange-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200">
                        <TrendUp size={16} weight="regular" className="text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">Optimizing Results</div>
                        <div className="w-full h-2 bg-slate-100 rounded-full mt-1">
                          <div className="w-1/2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <div className="text-sm text-slate-600">Match Confidence</div>
                    <div className="text-2xl font-bold text-green-600">92%</div>
                  </div>
                </div>
              </div>
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
