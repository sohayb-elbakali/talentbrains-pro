import { motion } from 'framer-motion';
import { Star, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../lib/supabase/index";

// Define data structures
interface Match {
  id: string;
  job_id: string;
  match_score: number;
  job: {
    title: string;
  };
  talent: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface GroupedMatches {
  [key: string]: {
    jobTitle: string;
    matches: Match[];
  };
}

const CompanyMatchesPage = () => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [matches, setMatches] = useState<GroupedMatches>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchMatches = async () => {
      try {
        setLoading(true);

        // Check if we need to filter by specific job
        const jobId = searchParams.get("job_id");
        const filters: any = { company_id: profile.id };
        if (jobId) {
          filters.job_id = jobId;
        }

        const { data, error } = await db.getMatches(filters);
        if (error) throw error;

        // Group matches by job
        const grouped = (data || []).reduce(
          (acc: GroupedMatches, match: Match) => {
            const { job_id, job } = match;
            if (!acc[job_id]) {
              acc[job_id] = {
                jobTitle: job.title,
                matches: [],
              };
            }
            acc[job_id].matches.push(match);
            return acc;
          },
          {} as GroupedMatches
        );

        // Sort talents within each job by match score
        for (const jobId in grouped) {
          grouped[jobId].matches.sort(
            (a: Match, b: Match) => b.match_score - a.match_score
          );
        }

        setMatches(grouped);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [profile, searchParams]);

  const getScoreColor = (score: number) => {
    if (score > 90) return "text-green-500";
    if (score > 75) return "text-yellow-500";
    return "text-orange-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-7xl mx-auto"
    >
      <div className="flex items-center mb-8">
        <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-800">
          AI-Powered Candidate Matches
        </h1>
      </div>

      {loading ? (
        <div className="text-center p-8">Loading matches...</div>
      ) : error ? (
        <div className="text-center p-8 text-red-500">Error: {error}</div>
      ) : Object.keys(matches).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(matches).map(([jobId, { jobTitle, matches }]) => (
            <div
              key={jobId}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <h2 className="px-6 py-4 text-xl font-semibold text-gray-800 bg-gray-50 border-b">
                {jobTitle}
              </h2>
              <ul className="divide-y divide-gray-200">
                {matches.map((match) => (
                  <li
                    key={match.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <img
                        className="h-12 w-12 rounded-full"
                        src={
                          match.talent.avatar_url ||
                          `https://api.dicebear.com/6.x/initials/svg?seed=${match.talent.full_name}`
                        }
                        alt=""
                      />
                      <div className="ml-4">
                        <p className="text-md font-medium text-gray-900">
                          {match.talent.full_name}
                        </p>
                        <Link
                          to={`/talent/${match.talent.id}`}
                          className="text-sm text-purple-600 hover:underline"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Star
                        className={`w-5 h-5 ${getScoreColor(
                          match.match_score
                        )}`}
                      />
                      <p
                        className={`text-lg font-bold ml-2 ${getScoreColor(
                          match.match_score
                        )}`}
                      >
                        {match.match_score}%
                      </p>
                      <p className="text-sm text-gray-500 ml-1"> match</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-white rounded-2xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700">
            No Matches Found
          </h2>
          <p className="text-gray-500 mt-2">
            Our AI is working hard to find great candidates for your open roles.
            Check back soon!
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default CompanyMatchesPage;
