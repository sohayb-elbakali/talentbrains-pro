import { motion } from 'framer-motion';
import { ArrowRight, BookmarkSimple, Briefcase, Buildings, Clock, CurrencyDollar, Funnel, MapPin, MagnifyingGlass, TrendUp, Users } from '@phosphor-icons/react';
import { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { notify } from "../utils/notify";
import { Link } from 'react-router-dom';
import { useAuth } from "../hooks/useAuth";
import AuthModal from './auth/AuthModal';
import { fetchJobs, CACHE_CONFIG, prefetchNextPage } from '../services/dataFetchingService';
import LoadingSpinner from './LoadingSpinner';

export default function JobListings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Helper function to get filters based on selection
  function getFiltersForSelectedFilter(filter: string): Record<string, unknown> {
    switch (filter) {
      case 'full-time':
        return { employment_type: 'full_time' };
      case 'contract':
        return { employment_type: 'contract' };
      case 'remote':
        return { location: 'Remote' };
      default:
        return {};
    }
  }

  // Use infinite query for pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['jobs', selectedFilter, searchTerm],
    queryFn: ({ pageParam = 0 }) => fetchJobs({
      page: pageParam,
      searchTerm,
      filters: getFiltersForSelectedFilter(selectedFilter),
    }),
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    staleTime: CACHE_CONFIG.STALE_TIME.JOBS,
    gcTime: CACHE_CONFIG.GC_TIME.DEFAULT,
    refetchOnWindowFocus: false,
    initialPageParam: 0,
  });

  // Flatten all pages of jobs
  const allJobs = data?.pages.flatMap(page => page.jobs) || [];

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();

          // Prefetch next page for smoother experience
          if (data?.pages) {
            const currentPage = data.pages.length;
            prefetchNextPage(
              queryClient,
              ['jobs', selectedFilter, searchTerm],
              fetchJobs,
              currentPage,
              getFiltersForSelectedFilter(selectedFilter)
            );
          }
        }
      },
      {
        rootMargin: '200px', // Start loading 200px before reaching the element
        threshold: 0.1,
      }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [loadMoreRef, hasNextPage, isFetchingNextPage, fetchNextPage, data, selectedFilter, searchTerm, queryClient]);

  const filters = [
    { id: 'all', label: 'All Jobs' },
    { id: 'full-time', label: 'Full-time' },
    { id: 'contract', label: 'Contract' },
    { id: 'remote', label: 'Remote' },
  ];

  // Apply additional client-side filters
  const filteredJobs = allJobs.filter((job) => {
    if (selectedFilter === 'high-match') {
      return job.matchScore >= 90;
    }
    return true;
  });

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-700 bg-green-100';
    if (score >= 80) return 'text-blue-700 bg-blue-100';
    return 'text-slate-700 bg-slate-100';
  };

  const handleProtectedAction = (action: () => void) => {
    if (!user) {
      setAuthMode("signup");
      setIsAuthModalOpen(true);
      notify.showInfo("Please sign in to continue.");
      return;
    }
    action();
  };

  const handleSaveJob = (jobId: string) => {
    handleProtectedAction(() => {
      setSavedJobs(prev => {
        const newSet = new Set(prev);
        if (newSet.has(jobId)) {
          newSet.delete(jobId);
          notify.showSuccess('Job removed from saved');
        } else {
          newSet.add(jobId);
          notify.showSuccess('Job saved successfully!');
        }
        return newSet;
      });
    });
  };

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Discover Amazing{' '}
            <span className="text-primary">Job Opportunities</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Our AI matches you with jobs that perfectly align with your skills, experience, and career goals.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass size={20} weight="regular" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search jobs, companies, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <Funnel size={20} weight="regular" className="text-slate-400 flex-shrink-0" />
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedFilter === filter.id
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-primary'
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Job Results Count */}
        <div className="mb-6">
          <p className="text-slate-600">
            Showing <span className="font-semibold">{filteredJobs.length}</span> jobs
            {searchTerm && (
              <span> for "<span className="font-semibold">{searchTerm}</span>"</span>
            )}
            {hasNextPage && <span className="text-sm text-slate-500"> (scroll for more)</span>}
          </p>
        </div>

        {/* Loading State - Initial Load */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner text="Loading amazing opportunities..." size="lg" />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-red-200">
            <h3 className="text-2xl font-bold text-red-900 mb-2">Failed to Load Jobs</h3>
            <p className="text-red-600">{error?.message || 'An error occurred'}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* No Jobs State */}
        {!isLoading && !isError && filteredJobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
            <Briefcase size={48} weight="regular" className="text-slate-300 mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Jobs Available</h3>
            <p className="text-slate-500">
              {searchTerm ? 'Try different search terms or filters' : 'Check back soon for new opportunities!'}
            </p>
          </div>
        )}

        {/* Job Listings */}
        {!isLoading && !isError && filteredJobs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map((job, index) => {
              const isSaved = savedJobs.has(job.id);
              return (
                <Link
                  to={`/jobs/${job.id}`}
                  key={`${job.id}-${index}`}
                  className="block"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.3) }}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-primary transition-all duration-200 group cursor-pointer"
                  >
                    {/* Header */}
                    <div className="bg-slate-50 p-6 border-b border-slate-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-200">
                            <Buildings size={28} weight="regular" className="text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-slate-900 mb-1 group-hover:text-primary transition-colors line-clamp-2">
                              {job.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <span className="font-medium">{job.company}</span>
                              <span className="text-slate-300">•</span>
                              <span className="flex items-center gap-1">
                                <Users size={16} weight="regular" />
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
                          className={`p-2 rounded-lg transition-colors ${isSaved
                            ? 'bg-blue-100 text-primary'
                            : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-primary border border-slate-200'
                            }`}
                        >
                          <BookmarkSimple size={20} weight={isSaved ? "fill" : "regular"} />
                        </button>
                      </div>

                      {/* Match Score Badge */}
                      <div className="flex items-center gap-2">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getMatchColor(job.matchScore)}`}>
                          <TrendUp size={16} weight="regular" />
                          {job.matchScore}% Match
                        </div>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock size={16} weight="regular" />
                          {job.postedTime}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                      <p className="text-slate-600 leading-relaxed line-clamp-3">
                        {job.description}
                      </p>

                      {/* Job Details */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                          <MapPin size={16} weight="regular" className="text-primary flex-shrink-0" />
                          <span className="text-sm font-medium text-slate-700 truncate">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                          <Briefcase size={16} weight="regular" className="text-primary flex-shrink-0" />
                          <span className="text-sm font-medium text-slate-700 truncate">{job.type}</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                          <CurrencyDollar size={16} weight="regular" className="text-green-600 flex-shrink-0" />
                          <span className="text-sm font-semibold text-green-700">{job.salary}</span>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2">
                        {job.skills && job.skills.length > 0 ? (
                          <>
                            {job.skills.slice(0, 4).map((skill: string, skillIndex: number) => (
                              <span
                                key={`${job.id}-skill-${skillIndex}`}
                                className="px-3 py-1 bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.skills.length > 4 && (
                              <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-lg">
                                +{job.skills.length - 4} more
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No skills listed</span>
                        )}
                      </div>
                    </div>

                    {/* Footer with Action Button */}
                    <div className="px-6 pb-6">
                      <div className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        View Details
                        <ArrowRight size={20} weight="regular" className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Infinite Scroll Trigger & Loading More Indicator */}
        {!isLoading && filteredJobs.length > 0 && (
          <div ref={loadMoreRef} className="text-center mt-12">
            {isFetchingNextPage ? (
              <div className="flex flex-col items-center py-8">
                <LoadingSpinner text="Loading more jobs..." />
              </div>
            ) : hasNextPage ? (
              <button
                onClick={() => fetchNextPage()}
                className="px-8 py-4 bg-white text-primary border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 hover:border-primary transition-colors"
              >
                Load More Jobs
              </button>
            ) : (
              <p className="text-slate-500 py-8">
                You've reached the end of the list
              </p>
            )}
          </div>
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </section>
  );
}
