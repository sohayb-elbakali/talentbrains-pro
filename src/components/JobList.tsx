import React, { useEffect, useState } from "react";
import { useAuth, useUserData } from "../hooks/useAuth";
import { db } from "../lib/supabase";
import { JobCard, type Job } from "./JobCard";

interface JobListProps {
  jobs?: Job[];
  showSearch?: boolean;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const defaultFilters = {
  job_type: "",
  location: "",
  remote: false,
  experience_level: "",
  salary_min: "",
  salary_max: "",
};

const JobList: React.FC<JobListProps> = ({
  jobs: jobsProp,
  showSearch = true,
  loading: loadingProp,
  error: errorProp,
  className = "",
}) => {
  const { user } = useAuth();
  const { data } = useUserData(user?.id);
  const [jobs, setJobs] = useState<Job[]>(jobsProp || []);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(loadingProp || false);
  const [error, setError] = useState<string | null>(errorProp || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const talent = data?.talent;
  const profile = data?.profile;

  useEffect(() => {
    if (jobsProp) {
      setJobs(jobsProp);
      setLoading(!!loadingProp);
      setError(errorProp || null);
      return;
    }
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const { data, error } = await db.getJobs({});
        if (error) throw error;
        setJobs(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [jobsProp, loadingProp, errorProp]);

  useEffect(() => {
    if (!user || !profile) return;
    const fetchApplications = async () => {
      if (!talent) return;
      const { data, error } = await db.getApplications({
        talent_id: talent.id,
      });
      if (!error && data) setApplications(data);
    };
    fetchApplications();
  }, [user, profile, talent]);

  const handleApply = async (job: Job) => {
    if (!user || profile?.role !== "talent") {
      alert("Please sign in as a talent to apply.");
      return;
    }
    setActionLoading(job.id);
    try {
      if (!talent) {
        alert(
          "Unable to find your talent profile. Please complete your profile first."
        );
        setActionLoading(null);
        return;
      }
      const { data: existingApps } = await db.getApplications({
        job_id: job.id,
        talent_id: talent.id,
      });
      if (existingApps && existingApps.length > 0) {
        alert("You have already applied to this job.");
        setActionLoading(null);
        return;
      }
      const { error } = await db.createApplication({
        job_id: job.id,
        talent_id: talent.id,
        status: "pending",
        applied_at: new Date().toISOString(),
      });
      if (error) {
        alert("Failed to apply: " + (error.message || "Unknown error"));
      } else {
        alert("Applied successfully!");
        // Refresh applications
        const { data } = await db.getApplications({ talent_id: talent.id });
        if (data) setApplications(data);
      }
    } catch (err: any) {
      alert("An unexpected error occurred while applying.");
    }
    setActionLoading(null);
  };

  const handleCancel = async (applicationId: string) => {
    if (!user || !talent) return;
    setActionLoading(applicationId);
    const { error } = await db.updateApplication(applicationId, { status: 'withdrawn' });
    if (error) {
      alert("Failed to cancel application");
    } else {
      alert("Application canceled.");
      // Refresh applications
      const { data } = await db.getApplications({ talent_id: talent.id });
      if (data) setApplications(data);
    }
    setActionLoading(null);
  };

  // Filtering logic
  const filteredJobs = jobs.filter((job) => {
    if (
      filters.job_type &&
      job.job_type &&
      job.job_type.toLowerCase() !== filters.job_type.toLowerCase()
    )
      return false;
    if (
      filters.location &&
      job.location &&
      !job.location.toLowerCase().includes(filters.location.toLowerCase())
    )
      return false;
    // Remote filter - check if location includes "remote"
    if (filters.remote && job.location && !job.location.toLowerCase().includes('remote')) return false;
    // Experience level filter - skip for now as it's not in Job type
    // if (filters.experience_level && job.experience_level) {
    //   if (job.experience_level.toLowerCase() !== filters.experience_level.toLowerCase()) return false;
    // }
    if (
      filters.salary_min &&
      job.salary_min &&
      job.salary_min < Number(filters.salary_min)
    )
      return false;
    if (
      filters.salary_max &&
      job.salary_max &&
      job.salary_max > Number(filters.salary_max)
    )
      return false;
    if (
      searchTerm &&
      !(
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
      return false;
    return true;
  });

  // UI for filters
  const filterUI = (
    <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </h3>
        <button
          onClick={() => setFilters(defaultFilters)}
          className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
        >
          Clear All
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div>
          <label htmlFor="job-type-select" className="block text-sm font-semibold text-gray-700 mb-2">
            Job Type
          </label>
          <select
            id="job-type-select"
            title="Job Type"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            value={filters.job_type}
            onChange={(e) => setFilters((f) => ({ ...f, job_type: e.target.value }))}
          >
            <option value="">All Types</option>
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="freelance">Freelance</option>
          </select>
        </div>
        <div>
          <label htmlFor="location-input" className="block text-sm font-semibold text-gray-700 mb-2">
            Location
          </label>
          <input
            id="location-input"
            title="Location"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            value={filters.location}
            onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
            placeholder="e.g. Remote, Paris"
          />
        </div>
        <div>
          <label htmlFor="experience-select" className="block text-sm font-semibold text-gray-700 mb-2">
            Experience
          </label>
          <select
            id="experience-select"
            title="Experience Level"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            value={filters.experience_level}
            onChange={(e) => setFilters((f) => ({ ...f, experience_level: e.target.value }))}
          >
            <option value="">All Levels</option>
            <option value="entry">Entry</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
          </select>
        </div>
        <div>
          <label htmlFor="salary-min-input" className="block text-sm font-semibold text-gray-700 mb-2">
            Min Salary
          </label>
          <input
            id="salary-min-input"
            title="Minimum Salary"
            type="number"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            value={filters.salary_min}
            onChange={(e) => setFilters((f) => ({ ...f, salary_min: e.target.value }))}
            placeholder="Min"
          />
        </div>
        <div>
          <label htmlFor="salary-max-input" className="block text-sm font-semibold text-gray-700 mb-2">
            Max Salary
          </label>
          <input
            id="salary-max-input"
            title="Maximum Salary"
            type="number"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            value={filters.salary_max}
            onChange={(e) => setFilters((f) => ({ ...f, salary_max: e.target.value }))}
            placeholder="Max"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center space-x-2 cursor-pointer bg-purple-50 hover:bg-purple-100 rounded-xl px-4 py-2.5 transition-colors w-full">
            <input
              id="remote-checkbox"
              title="Remote"
              type="checkbox"
              checked={filters.remote}
              onChange={(e) => setFilters((f) => ({ ...f, remote: e.target.checked }))}
              className="w-5 h-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-sm font-semibold text-gray-700">Remote Only</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className={className}>
      {showSearch && (
        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by job title or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 text-gray-900 placeholder-gray-400 shadow-sm"
            />
          </div>
        </div>
      )}
      {filterUI}
      {loading && (
        <div className="text-center p-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading amazing opportunities...</p>
        </div>
      )}
      {error && (
        <div className="text-center p-12 bg-red-50 rounded-2xl border border-red-200">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 font-semibold">Error: {error}</p>
        </div>
      )}
      {!loading && !error && (
        <>
          {/* Results count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              Found <span className="font-bold text-purple-600">{filteredJobs.length}</span> {filteredJobs.length === 1 ? 'job' : 'jobs'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => {
                const application = applications.find(
                  (app) => app.job_id === job.id
                );
                return (
                  <JobCard
                    key={job.id}
                    job={job}
                    application={application || null}
                    onApply={handleApply}
                    onCancel={handleCancel}
                    actionLoading={
                      actionLoading === (application ? application.id : job.id)
                    }
                  />
                );
              })
            ) : (
              <div className="md:col-span-2 lg:col-span-3 text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  No jobs found
                </h2>
                <p className="text-gray-500 mb-6">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={() => {
                    setFilters(defaultFilters);
                    setSearchTerm("");
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default JobList;
