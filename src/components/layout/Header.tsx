import {
  Bell,
  Brain,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
  X,
  Home,
  Briefcase,
  Users,
  Shield,
  Zap,
  Eye,
  MessageSquare,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth, useUserData } from "../../hooks/useAuth";
import { sessionManager } from "../../utils/sessionManager";

import { AnimatePresence, motion } from "framer-motion";
import AuthModal from "../auth/AuthModal";
import CompanyLogo from "../CompanyLogo";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const location = useLocation();

  // Enhanced notifications with more details
  const notifications = [
    {
      id: 1,
      type: 'match',
      title: "New Job Match",
      text: "Senior Frontend Developer at TechCorp matches your profile",
      time: "2 minutes ago",
      unread: true,
      avatar: "https://api.dicebear.com/6.x/initials/svg?seed=TechCorp"
    },
    {
      id: 2,
      type: 'application',
      title: "Application Viewed",
      text: "Your application for UI/UX Designer was reviewed by the hiring team",
      time: "1 hour ago",
      unread: true,
      avatar: "https://api.dicebear.com/6.x/initials/svg?seed=Company"
    },
    {
      id: 3,
      type: 'message',
      title: "Interview Request",
      text: 'Acme Inc wants to schedule an interview for the Full Stack position',
      time: "3 hours ago",
      unread: false,
      avatar: "https://api.dicebear.com/6.x/initials/svg?seed=Acme"
    },
    {
      id: 4,
      type: 'system',
      title: "Profile Update",
      text: "Your profile has been successfully updated and is now live",
      time: "1 day ago",
      unread: false,
      avatar: null
    }
  ];

  const { isAuthenticated, profile, signOut, user } = useAuth();
  const { data: userData } = useUserData(user?.id);

  // Get display name based on role
  const getDisplayName = () => {
    if (!profile) return 'User';
    
    // For company users, ONLY show company name (not full_name from profile)
    if (profile.role === 'company') {
      return userData?.company?.name || 'Company';
    }
    
    return profile.full_name || 'User';
  };

  const displayName = getDisplayName();

  // Get the appropriate home URL based on user role
  const getHomeUrl = () => {
    if (!isAuthenticated || !profile) {
      return "/";
    }

    switch (profile.role) {
      case "talent":
        return "/talent";
      case "company":
        return "/company";
      case "admin":
        return "/admin";
      default:
        return "/";
    }
  };

  // Get navigation items based on user role
  const getNavigationItems = () => {
    if (!isAuthenticated || !profile) {
      return []; // No navigation items for public users - they'll use the cards instead
    }

    switch (profile.role) {
      case "talent":
        return [
          { name: "Dashboard", path: "/talent", icon: Home },
          { name: "Find Jobs", path: "/jobs", icon: Briefcase },
          { name: "My Applications", path: "/talent/applications", icon: User },
        ];
      case "company":
        return [
          { name: "Dashboard", path: "/company", icon: Home },
          { name: "My Jobs", path: "/company/jobs", icon: Briefcase },
          { name: "Find Talent", path: "/talents", icon: Users },
          { name: "Applicants", path: "/company/applicants", icon: User },
        ];
      case "admin":
        return [
          { name: "Dashboard", path: "/admin", icon: Shield },
          { name: "All Jobs", path: "/jobs", icon: Briefcase },
          { name: "All Talent", path: "/talents", icon: Users },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  const handleAuthClick = (mode: "signin" | "signup") => {
    if (isAuthenticated) return; // Prevent opening modal if already signed in
    sessionManager.clearAllAuthData();
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsProfileMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Smart Home Redirect */}
            <Link
              to={getHomeUrl()}
              className="flex items-center space-x-2 group transition-all duration-300 hover:scale-105"
            >
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg group-hover:shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300">
                <Brain className="h-6 w-6 text-white group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:to-blue-700 transition-all duration-300">
                TalentBrains
              </span>
            </Link>

            {/* Desktop Navigation */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center space-x-6">
                {/* Navigation Menu */}
                <nav className="flex items-center space-x-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path ||
                      (item.path !== "/" && location.pathname.startsWith(item.path));

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                          ? "bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 shadow-sm"
                          : "text-gray-600 hover:text-purple-600 hover:bg-gray-50"
                          }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="h-6 w-px bg-gray-200"></div>

                <button className="p-2 text-gray-600 hover:text-purple-600 transition-colors">
                  <Search className="h-5 w-5" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="relative p-2 text-gray-600 hover:text-purple-600 transition-all duration-200 hover:bg-purple-50 rounded-lg group"
                  >
                    <Bell className="h-5 w-5 group-hover:animate-pulse" />
                    {notifications.filter(n => n.unread).length > 0 && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full border-2 border-white shadow-lg animate-pulse">
                        {notifications.filter(n => n.unread).length}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl z-20 border border-gray-100 overflow-hidden"
                      >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-lg font-bold text-white">Notifications</h3>
                              <p className="text-purple-100 text-sm">
                                {notifications.filter(n => n.unread).length} unread notifications
                              </p>
                            </div>
                            <button
                              onClick={() => setIsNotificationsOpen(false)}
                              className="p-2 rounded-xl hover:bg-white/20 transition-colors text-white"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                              {notifications.map((notif) => {
                                const getNotificationIcon = (type: string) => {
                                  switch (type) {
                                    case 'match':
                                      return <Zap className="h-5 w-5 text-yellow-500" />;
                                    case 'application':
                                      return <Eye className="h-5 w-5 text-blue-500" />;
                                    case 'message':
                                      return <MessageSquare className="h-5 w-5 text-green-500" />;
                                    case 'system':
                                      return <CheckCircle className="h-5 w-5 text-purple-500" />;
                                    default:
                                      return <Bell className="h-5 w-5 text-gray-500" />;
                                  }
                                };

                                const getNotificationBg = (type: string) => {
                                  switch (type) {
                                    case 'match':
                                      return 'bg-yellow-50';
                                    case 'application':
                                      return 'bg-blue-50';
                                    case 'message':
                                      return 'bg-green-50';
                                    case 'system':
                                      return 'bg-purple-50';
                                    default:
                                      return 'bg-gray-50';
                                  }
                                };

                                return (
                                  <motion.div
                                    key={notif.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: notif.id * 0.1 }}
                                    className={`relative p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${notif.unread ? 'bg-purple-50/50' : ''
                                      }`}
                                  >
                                    {notif.unread && (
                                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                                    )}

                                    <div className="flex items-start space-x-3 ml-4">
                                      {/* Icon */}
                                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${getNotificationBg(notif.type)} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                                        {getNotificationIcon(notif.type)}
                                      </div>

                                      {/* Content */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                          <p className="text-sm font-semibold text-gray-900 truncate">
                                            {notif.title}
                                          </p>
                                          <div className="flex items-center text-xs text-gray-500 ml-2">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {notif.time}
                                          </div>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                          {notif.text}
                                        </p>
                                      </div>

                                      {/* Avatar */}
                                      {notif.avatar && (
                                        <div className="flex-shrink-0">
                                          <img
                                            src={notif.avatar}
                                            alt="Company"
                                            className="w-8 h-8 rounded-lg border border-gray-200"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-8 text-center">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell className="h-8 w-8 text-gray-400" />
                              </div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h4>
                              <p className="text-gray-500">We'll notify you when something important happens.</p>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                          <div className="border-t border-gray-100 p-4 bg-gray-50">
                            <div className="flex justify-between items-center">
                              <button className="text-sm text-purple-600 hover:text-purple-700 font-semibold transition-colors">
                                Mark all as read
                              </button>
                              <button className="text-sm text-gray-600 hover:text-gray-700 font-semibold transition-colors">
                                View all notifications
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div className="relative">
                      {profile?.role === 'company' ? (
                        <div className="w-9 h-9 rounded-lg overflow-hidden border-2 border-purple-200 group-hover:border-purple-400 transition-colors">
                          <CompanyLogo
                            avatarUrl={profile?.avatar_url}
                            companyName={displayName}
                            size="sm"
                            className="w-full h-full"
                          />
                        </div>
                      ) : (
                          <img
                          src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                          alt={displayName}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm group-hover:ring-purple-500 transition-all"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8B5CF6&color=fff&size=128&bold=true`;
                          }}
                        />
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <span className="text-base font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                      {displayName}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                      >
                        {/* Header with gradient */}
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              {profile?.role === 'company' ? (
                                <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
                                  <CompanyLogo
                                    avatarUrl={profile?.avatar_url}
                                    companyName={displayName}
                                    size="md"
                                    className="w-full h-full"
                                  />
                                </div>
                              ) : (
                                <img
                                  src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                                  alt={displayName}
                                  className="w-16 h-16 rounded-full object-cover shadow-lg ring-4 ring-white"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8B5CF6&color=fff&size=128&bold=true`;
                                  }}
                                />
                              )}
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div>
                              <p className="text-base font-bold text-white">
                                {displayName || 'User'}
                              </p>
                              <p className="text-xs text-purple-100 capitalize font-medium">
                                {profile?.role} Account
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="py-2">
                          <Link
                            to="/profile"
                            className="flex items-center w-full text-left px-6 py-3 text-base text-gray-700 hover:bg-purple-50 transition-colors group"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mr-3 group-hover:bg-purple-200 transition-colors">
                              <User className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900">My Profile</span>
                              <p className="text-xs text-gray-500">View and edit profile</p>
                            </div>
                          </Link>
                          <Link
                            to="/settings"
                            className="flex items-center w-full text-left px-6 py-3 text-base text-gray-700 hover:bg-blue-50 transition-colors group"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                              <Settings className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900">Settings</span>
                              <p className="text-xs text-gray-500">Preferences & privacy</p>
                            </div>
                          </Link>
                        </div>

                        {/* Sign out */}
                        <div className="border-t border-gray-100 p-2">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center w-full text-left px-6 py-3 text-base text-red-600 hover:bg-red-50 rounded-xl transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center mr-3 group-hover:bg-red-200 transition-colors">
                              <LogOut className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <span className="font-semibold">Sign Out</span>
                              <p className="text-xs text-red-500">End your session</p>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                {/* Public Navigation */}
                <nav className="flex items-center space-x-1 mr-4">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                          ? "bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 shadow-sm"
                          : "text-gray-600 hover:text-purple-600 hover:bg-gray-50"
                          }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>

                <button
                  onClick={() => handleAuthClick("signin")}
                  className="px-4 py-2 text-gray-600 hover:text-purple-600 transition-colors font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleAuthClick("signup")}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-purple-600 transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden py-4 border-t border-gray-200 bg-gradient-to-br from-purple-50 to-blue-50"
              >
                {isAuthenticated ? (
                  <div className="space-y-3 px-4">
                    {/* User info card */}
                    <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          {profile?.role === 'company' ? (
                            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-purple-200 shadow-md">
                              <CompanyLogo
                                avatarUrl={profile?.avatar_url}
                                companyName={displayName}
                                size="lg"
                                className="w-full h-full"
                              />
                            </div>
                          ) : (
                              <img
                              src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                              alt={displayName}
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8B5CF6&color=fff&size=128&bold=true`;
                              }}
                            />
                          )}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {displayName || 'User'}
                          </p>
                          <p className="text-sm text-gray-500 capitalize">
                            {profile?.role} Account
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Navigation items */}
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path ||
                        (item.path !== "/" && location.pathname.startsWith(item.path));

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center space-x-3 px-4 py-3 transition-colors rounded-xl shadow-sm border ${isActive
                            ? "bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border-purple-200"
                            : "bg-white text-gray-700 hover:bg-gray-50 border-gray-100"
                            }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? "bg-purple-100" : "bg-gray-100"
                            }`}>
                            <Icon className={`h-5 w-5 ${isActive ? "text-purple-600" : "text-gray-600"}`} />
                          </div>
                          <div>
                            <span className="font-semibold">{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}

                    <div className="border-t border-gray-200 pt-3">
                      {/* Profile and Settings */}
                      <Link
                        to="/profile"
                        className="flex items-center space-x-3 px-4 py-3 bg-white text-gray-700 hover:bg-purple-50 transition-colors rounded-xl shadow-sm border border-gray-100 mb-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <span className="font-semibold">My Profile</span>
                          <p className="text-xs text-gray-500">View and edit</p>
                        </div>
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center space-x-3 px-4 py-3 bg-white text-gray-700 hover:bg-blue-50 transition-colors rounded-xl shadow-sm border border-gray-100 mb-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Settings className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <span className="font-semibold">Settings</span>
                          <p className="text-xs text-gray-500">Preferences</p>
                        </div>
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-3 px-4 py-3 bg-white text-red-600 hover:bg-red-50 transition-colors rounded-xl shadow-sm border border-gray-100"
                      >
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                          <LogOut className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="text-left">
                          <span className="font-semibold">Sign Out</span>
                          <p className="text-xs text-red-500">End session</p>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 px-4">
                    {/* Public Navigation */}
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center space-x-3 px-4 py-3 transition-colors rounded-xl shadow-sm border ${isActive
                            ? "bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border-purple-200"
                            : "bg-white text-gray-700 hover:bg-gray-50 border-gray-100"
                            }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? "bg-purple-100" : "bg-gray-100"
                            }`}>
                            <Icon className={`h-5 w-5 ${isActive ? "text-purple-600" : "text-gray-600"}`} />
                          </div>
                          <div>
                            <span className="font-semibold">{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}

                    <div className="border-t border-gray-200 pt-3 space-y-2">
                      <button
                        onClick={() => {
                          handleAuthClick("signin");
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors rounded-xl border border-gray-200 font-medium"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => {
                          handleAuthClick("signup");
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg"
                      >
                        Get Started
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </>
  );
}
