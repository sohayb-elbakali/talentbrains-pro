import { motion } from 'framer-motion';
import { ArrowRight, Bookmark, BookmarkCheck, Briefcase, Building, Clock, DollarSign, Filter, MapPin, Search, Sparkles, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { notificationManager } from "../utils/notificationManager";
import { Link } from 'react-router-dom';
import { useAuth } from "../hooks/useAuth";
import { db } from '../lib/supabase';
import AuthModal from './auth/AuthModal';

export default function JobListings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real jobs from database
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const { data, error } = await db.getJobs({});
        if (error) {
          toast.error('Failed to load jobs');
          console.error('Error fetching jobs:', error);
        } else if (data) {
          // Transform database jobs and fetch skills for each
          const transformedJobs = await Promise.all(
            data.map(async (job: any) => {
              // Fetch skills for this job
              const { data: skillsData } = await db.getJobSkills(job.id);
              const skills = skillsData?.map((s: any) => s.name) || [];

              return {
                id: job.id,
                title: job.title,
                company: job.company_name || 'Company',
                location: job.location || 'Not specified',
                type: formatEmploymentType(job.employment_type),
                salary: formatSalary(job.salary_min, job.salary_max, job.currency),
                postedTime: getTimeAgo(job.created_at),
                skills: skills,
                matchScore: Math.floor(Math.random() * 20) + 80, // Mock for now, can be calculated
                employees: 'N/A',
                description: job.description || 'No description available.'
              };
            })
          );
          setJobs(transformedJobs);
        }
      } catch (err) {
        console.error('Error:', err);
        toast.error('An error occurred while loading jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Helper function to format employment type
  const formatEmploymentType = (type: string) => {
    const typeMap: Record<string, string> = {
      'full_time': 'Full-time',
      'part_time': 'Part-time',
      'contract': 'Contract',
      'freelance': 'Freelance',
      'internship': 'Internship'
    };
    return typeMap[type] || type;
  };

  // Helper function to format salary
  const formatSalary = (min?: number, max?: number, currency: string = 'USD') => {
    const symbol = currency === 'USD' ? '$' : currency;
    if (min && max) {
      return `${symbol}${(min / 1000).toFixed(0)}k - ${symbol}${(max / 1000).toFixed(0)}k`;
    } else if (min) {
      return `${symbol}${(min / 1000).toFixed(0)}k+`;
    } else if (max) {
      return `Up to ${symbol}${(max / 1000).toFixed(0)}k`;
    }
    return 'Competitive';
  };

  // Helper function to get time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const filters = [
    { id: 'all', label: 'All Jobs' },
    { id: 'full-time', label: 'Full-time' },
    { id: 'contract', label: 'Contract' },
    { id: 'remote', label: 'Remote' },
    { id: 'high-match', label: 'High Match (90%+)' }
  ];

  const filteredJobs = jobs.filter((job: any) => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.skills && job.skills.some((skill: string) => skill.toLowerCase().includes(searchTerm.toLowerCase())));

    if (!matchesSearch) return false;

    switch (selectedFilter) {
      case 'full-time':
        return job.type === 'Full-time';
      case 'contract':
        return job.type === 'Contract';
      case 'remote':
        return job.location && job.location.toLowerCase().includes('remote');
      case 'high-match':
        return job.matchScore >= 90;
      default:
        return true;
    }
  });

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    return 'text-orange-600 bg-orange-100';
  };

  const [savedJobs, setSavedJobs] = useState<Set<number>>(new Set());

  const handleProtectedAction = (action: () => void) => {
    if (!user) {
      setAuthMode("signup");
      setIsAuthModalOpen(true);
      toast("Please sign in to continue.");
      return;
    }
    action();
  };

  const handleSaveJob = (jobId: number) => {
    handleProtectedAction(() => {
      setSavedJobs(prev => {
        const newSet = new Set(prev);
        if (newSet.has(jobId)) {
          newSet.delete(jobId);
          toast.success('Job removed from saved');
        } else {
          newSet.add(jobId);
          toast.success('Job saved successfully!');
        }
        return newSet;
      });
    });
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Discover Amazing{' '}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Job Opportunities
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our AI matches you with jobs that perfectly align with your skills, experience, and career goals.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search jobs, companies, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto">
            <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${selectedFilter === filter.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600'
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Job Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{filteredJobs.length}</span> jobs
            {searchTerm && (
              <span> for "<span className="font-semibold">{searchTerm}</span>"</span>
            )}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="col-span-full flex flex-col items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full mb-4"
            />
            <p className="text-gray-600 font-medium">Loading amazing opportunities...</p>
          </div>
        )}

        {/* No Jobs State */}
        {!loading && jobs.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-lg border border-gray-100">
            <Briefcase className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Jobs Available</h3>
            <p className="text-gray-500">Check back soon for new opportunities!</p>
          </div>
        )}

        {/* Job Listings */}
        {!loading && jobs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map((job, index) => {
              const isSaved = savedJobs.has(job.id);
              return (
                <Link
                  to={`/jobs/${job.id}`}
                  key={job.id}
                  className="block"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -8, boxShadow: "0px 20px 40px rgba(124, 58, 237, 0.15)" }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:border-purple-200 transition-all duration-300 group cursor-pointer"
                  >
                  {/* Header with gradient */}
                  <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-400 rounded-xl blur opacity-30"></div>
                          <div className="relative w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md border-2 border-white">
                            <Building className="h-7 w-7 text-purple-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-purple-700 transition-colors line-clamp-2">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-semibold">{job.company}</span>
                            <span className="text-gray-400">•</span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {job.employees}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSaveJob(job.id);
                        }}
                        className={`p-2 rounded-lg transition-all ${isSaved
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-white text-gray-400 hover:bg-gray-50 hover:text-purple-600'
                          }`}
                      >
                        {isSaved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                      </button>
                    </div>

                    {/* Match Score Badge */}
                    <div className="flex items-center gap-2">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${getMatchColor(job.matchScore)}`}>
                        <TrendingUp className="h-4 w-4" />
                        {job.matchScore}% Match
                      </div>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {job.postedTime}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <p className="text-gray-600 leading-relaxed line-clamp-3">
                      {job.description}
                    </p>

                    {/* Job Details */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                        <MapPin className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700 truncate">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                        <Briefcase className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700 truncate">{job.type}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-3 py-2">
                        <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm font-bold text-green-700">{job.salary}</span>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2">
                      {job.skills && job.skills.length > 0 ? (
                        <>
                          {job.skills.slice(0, 4).map((skill: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-100"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 4 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                              +{job.skills.length - 4} more
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No skills listed</span>
                      )}
                    </div>
                  </div>

                  {/* Footer with Action Button */}
                  <div className="px-6 pb-6">
                    <div className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-blue-700 transition-all">
                      <Sparkles className="h-5 w-5" />
                      View Details
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="px-8 py-4 bg-white text-purple-600 border-2 border-purple-200 rounded-xl font-semibold">
            Load More Jobs
          </button>
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
