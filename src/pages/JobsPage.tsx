import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { JobCard, type Job } from "../components/JobCard";
import { db } from "../lib/supabase";

const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        console.log("🔍 Fetching jobs for talent view...");

        // Simplified debug: Check if db functions exist
        console.log("🔍 Checking db object:", typeof db);
        console.log("🔍 getAllJobsDebug exists:", typeof db.getAllJobsDebug);
        console.log(
          "🔍 activateAllDraftJobs exists:",
          typeof db.activateAllDraftJobs
        );
        console.log("🔍 getJobs exists:", typeof db.getJobs);

        console.log("📡 Fetching jobs with showAll: true...");

        // Test simple function call first
        try {
          console.log("🧪 Testing simple db call...");
          const result = await db.getAllJobsDebug();
          console.log("🧪 getAllJobsDebug result:", result);
        } catch (simpleErr) {
          console.error("🧪 Simple db call error:", simpleErr);
        }

        const { data, error } = await db.getJobs({ showAll: true }); // Show all jobs for debugging

        console.log("📊 Jobs response:", { data, error, count: data?.length });

        if (error) {
          console.error("❌ Error fetching jobs:", error);
          throw error;
        }

        setJobs(data || []);
        console.log("✅ Jobs set successfully:", data?.length || 0, "jobs");
      } catch (err: any) {
        console.error("💥 Exception in fetchJobs:", err);
        // Check if this is a 304 Not Modified response (cached data)
        if (
          err.status === 304 ||
          err.statusCode === 304 ||
          (err.message &&
            (err.message.includes("304") ||
              err.message.includes("Not Modified")))
        ) {
          console.log("304 response detected - using cached data");
          // Don't set error for 304 responses
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            Find Your Next <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Opportunity</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Browse through open positions from top companies and find your perfect match
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
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
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm text-base"
              />
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading amazing opportunities...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-md mx-auto">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
              <p className="text-red-800 font-semibold">Error: {error}</p>
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
                {filteredJobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <JobCard job={job} linkTo={`/jobs/${job.id}`} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Search className="h-12 w-12 text-purple-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  No Jobs Found
                </h2>
                <p className="text-gray-600 mb-6">
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
