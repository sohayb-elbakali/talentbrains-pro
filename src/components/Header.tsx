import { Bell, Brain, Briefcase, SignOut, List, MagnifyingGlass, Gear, User, X } from '@phosphor-icons/react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './auth/AuthModal';

interface HeaderProps {
  activeSection?: string;
  setActiveSection?: (section: string) => void;
}

export default function Header({ activeSection, setActiveSection }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { isAuthenticated, profile, signOut } = useAuth();

  const navigation = [
    { name: 'Home', id: 'home' },
    { name: 'Find Talent', id: 'talent' },
    { name: 'Find Jobs', id: 'jobs' },
    ...(isAuthenticated ? [{ name: 'AI Match', id: 'match' }] : []),
    { name: 'About', id: 'about' },
  ];

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <Brain size={20} weight="regular" className="text-white" />
              </div>
              <span className="text-xl font-bold text-primary">
                TalentBrains
              </span>
            </div>

            {/* Desktop Navigation */}
            {setActiveSection && (
              <nav className="hidden md:flex items-center gap-8">
                {navigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${activeSection === item.id
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-slate-600 hover:text-primary'
                      }`}
                  >
                    {item.name}
                  </button>
                ))}
              </nav>
            )}

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <button
                className="p-2 text-slate-500 hover:text-primary transition-colors"
                aria-label="Search"
              >
                <MagnifyingGlass size={20} weight="regular" />
              </button>
              <button
                className="p-2 text-slate-500 hover:text-primary transition-colors relative"
                aria-label="Notifications"
              >
                <Bell size={20} weight="regular" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-orange-500 rounded-full"></span>
              </button>

              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <User size={20} weight="regular" />
                    <span className="text-sm font-medium">
                      {profile?.full_name || 'Dashboard'}
                    </span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-sm border border-slate-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-900">{profile?.full_name}</p>
                        <p className="text-xs text-slate-500">{profile?.email}</p>
                      </div>
                      <a
                        href="/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Briefcase size={16} weight="regular" className="mr-2" />
                        Dashboard
                      </a>
                      <a
                        href={profile?.role === 'company' ? '/company-profile' : '/talent-profile'}
                        className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User size={16} weight="regular" className="mr-2" />
                        Profile
                      </a>
                      <a
                        href="/settings"
                        className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Gear size={16} weight="regular" className="mr-2" />
                        Settings
                      </a>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <SignOut size={16} weight="regular" className="mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <User size={20} weight="regular" />
                  <span className="text-sm font-medium">Sign In</span>
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-primary transition-colors"
            >
              {isMenuOpen ? <X size={20} weight="regular" /> : <List size={20} weight="regular" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-200 bg-white">
              <div className="flex flex-col gap-2">
                {setActiveSection && navigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`px-4 py-2 text-left text-sm font-medium transition-colors duration-200 rounded-lg ${activeSection === item.id
                        ? 'text-primary bg-slate-50'
                        : 'text-slate-600 hover:text-primary hover:bg-slate-50'
                      }`}
                  >
                    {item.name}
                  </button>
                ))}
                <div className="px-4 py-2 border-t border-slate-200 mt-2">
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <div className="px-4 py-2">
                        <p className="text-sm font-medium text-slate-900">{profile?.full_name}</p>
                        <p className="text-xs text-slate-500">{profile?.email}</p>
                      </div>
                      <a
                        href="/dashboard"
                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </a>
                      <a
                        href={profile?.role === 'company' ? '/company-profile' : '/talent-profile'}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Profile
                      </a>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setIsAuthModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <User size={20} weight="regular" />
                      <span className="text-sm font-medium">Sign In</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode="signin"
      />
    </>
  );
}
