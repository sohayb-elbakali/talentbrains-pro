import { motion } from "framer-motion";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { JobCard, type Job } from "../components/JobCard";
import { db } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";

const JobsPage: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data, error } = await db.getJobs({ showAll: true });

        if (error) throw error;

        setJobs(data || []);

        if (user?.id) {
          try {
            const { data: talentData } = await db.getTalent(user.id);

            if (talentData?.id) {
              const { data: applicationsData } = await db.getApplications({
                talent_id: talentData.id
              });

              if (applicationsData) {
                const appMap = new Map();
                applicationsData.forEach((app: any) => {
                  appMap.set(app.job_id, app);
                });
                setApplications(appMap);
              }
            }
          } catch (appErr) {
            // Silently handle application fetch errors
          }
        }
      } catch (err: any) {
        if (
          err.status === 304 ||
          err.statusCode === 304 ||
          (err.message && (err.message.includes("304") || err.message.includes("Not Modified")))
        ) {
          // 304 Not Modified - using cached data
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3">
            Find Your Next <span className="text-primary">Opportunity</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Browse through open positions from top companies and find your perfect match
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by job title or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-base"
              />
              <MagnifyingGlass
                weight="regular"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner text="Loading amazing opportunities..." size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-md mx-auto">
            <div className="bg-white border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-red-600 font-semibold">Error: {error}</p>
            </div>
          </div>
        )}

        {/* Jobs Grid */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {filteredJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job, index) => {
                  const application = applications.get(job.id);
                  return (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <JobCard
                        job={job}
                        linkTo={`/jobs/${job.id}`}
                        application={application}
                      />
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MagnifyingGlass size={48} weight="regular" className="text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                  No Jobs Found
                </h2>
                <p className="text-slate-600 mb-6">
                  Try adjusting your search or check back later for new opportunities!
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default JobsPage;
