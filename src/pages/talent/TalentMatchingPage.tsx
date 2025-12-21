import { motion } from 'framer-motion';
import { BrainCircuit, MapPin, Building2, DollarSign, Clock, ExternalLink, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useUserData } from "../../hooks/useAuth";
import { db } from "../../lib/supabase/index";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

// Simple score bar
const ScoreBar = ({ label, score }: { label: string; score: number }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-slate-500 w-20">{label}</span>
    <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, score)}%` }} />
    </div>
    <span className="text-xs font-medium text-slate-600 w-8 text-right">{Math.round(score)}%</span>
  </div>
);

interface JobMatch {
  id: string;
  job_id: string;
  match_score: number;
  skill_match_score: number;
  experience_match_score: number;
  location_match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  job: {
    id: string;
    title: string;
    location?: string;
    employment_type?: string;
    salary_min?: number;
    salary_max?: number;
    companies?: { name: string; logo_url?: string };
  };
}

export const TalentMatchingPage = () => {
  const { user } = useAuth();
  const { data: userData } = useUserData(user?.id);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, excellent: 0, good: 0, avgScore: 0 });

  const talent = userData?.talent;

  useEffect(() => {
    if (!user?.id || !talent?.id) return;

    const fetchRealMatches = async () => {
      try {
        setLoading(true);

        // Call backend matching API for real-time matching
        const response = await fetch(`http://localhost:8000/api/matching/talent/${talent.id}/jobs?limit=20`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const matchingResults = await response.json();

          // Get job details for each match
          const { data: jobs } = await db.getJobs({ status: 'active' });
          const jobsMap = new Map(jobs?.map((j: any) => [j.id, j]) || []);

          // Transform backend results to our format
          const allMatches: JobMatch[] = matchingResults.map((m: any) => {
            const jobData: any = jobsMap.get(m.job_id) || {};
            return {
              id: `match-${m.job_id}`,
              job_id: m.job_id,
              match_score: m.match_score || 0,
              skill_match_score: m.skill_match_score || 0,
              experience_match_score: m.experience_match_score || 0,
              location_match_score: m.location_match_score || 0,
              matched_skills: m.matched_skills || [],
              missing_skills: m.missing_skills || [],
              job: {
                id: m.job_id,
                title: jobData.title || m.job_title || 'Position',
                location: jobData.location || m.location,
                employment_type: jobData.employment_type,
                salary_min: jobData.salary_min,
                salary_max: jobData.salary_max,
                companies: jobData.companies || { name: m.company || 'Company' },
              },
            };
          });

          allMatches.sort((a, b) => b.match_score - a.match_score);
          setMatches(allMatches);

          // Calculate real stats
          const excellent = allMatches.filter(m => m.match_score >= 80).length;
          const good = allMatches.filter(m => m.match_score >= 60 && m.match_score < 80).length;
          const avg = allMatches.length > 0
            ? Math.round(allMatches.reduce((s, m) => s + m.match_score, 0) / allMatches.length)
            : 0;
          setStats({ total: allMatches.length, excellent, good, avgScore: avg });
        } else {
          // Fallback: if backend is not available, check for stored matches
          const { data: storedMatches } = await db.getMatches({ talent_id: user.id });
          if (storedMatches && storedMatches.length > 0) {
            const allMatches = storedMatches.map((m: any) => ({
              ...m,
              match_score: m.match_score || 0,
              skill_match_score: m.skill_match_score || 0,
              experience_match_score: m.experience_match_score || 0,
              location_match_score: m.location_match_score || 0,
              matched_skills: m.matched_skills || [],
              missing_skills: m.missing_skills || [],
            }));
            allMatches.sort((a: JobMatch, b: JobMatch) => b.match_score - a.match_score);
            setMatches(allMatches);

            const excellent = allMatches.filter((m: JobMatch) => m.match_score >= 80).length;
            const good = allMatches.filter((m: JobMatch) => m.match_score >= 60 && m.match_score < 80).length;
            const avg = allMatches.length > 0
              ? Math.round(allMatches.reduce((s: number, m: JobMatch) => s + m.match_score, 0) / allMatches.length)
              : 0;
            setStats({ total: allMatches.length, excellent, good, avgScore: avg });
          }
        }
      } catch (err) {
        console.error('Matching error:', err);
        // Try stored matches as fallback
        try {
          const { data: storedMatches } = await db.getMatches({ talent_id: user.id });
          if (storedMatches && storedMatches.length > 0) {
            setMatches(storedMatches);
          }
        } catch (e) {
          console.error('Fallback error:', e);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRealMatches();
  }, [user?.id, talent?.id]);

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    const fmt = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}k` : n;
    if (min && max) return `$${fmt(min)} - $${fmt(max)}`;
    if (min) return `From $${fmt(min)}`;
    return `Up to $${fmt(max!)}`;
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-blue-600 text-white';
    if (score >= 60) return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Calculating your matches..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-xl">
              <BrainCircuit className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">AI Job Matches</h1>
              <p className="text-slate-500">Jobs matched to your skills and experience</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-blue-50 rounded-xl">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Matches</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.excellent}</p>
              <p className="text-xs text-blue-600 font-medium">Excellent (80%+)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-700">{stats.good}</p>
              <p className="text-xs text-slate-500">Good (60-79%)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.avgScore}%</p>
              <p className="text-xs text-slate-500">Avg Score</p>
            </div>
          </div>
        </div>

        {/* Matches List */}
        {matches.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Sorted by match score (highest first)
            </p>

            {matches.map((match, idx) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    {match.job?.companies?.logo_url ? (
                      <img src={match.job.companies.logo_url} alt="" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <Building2 className="w-5 h-5 text-blue-500" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900">{match.job?.title}</h3>
                        <p className="text-blue-600 font-medium text-sm">{match.job?.companies?.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          {match.job?.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {match.job.location}
                            </span>
                          )}
                          {match.job?.employment_type && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {match.job.employment_type}
                            </span>
                          )}
                          {formatSalary(match.job?.salary_min, match.job?.salary_max) && (
                            <span className="flex items-center gap-1 text-green-600">
                              <DollarSign className="w-3 h-3" />
                              {formatSalary(match.job?.salary_min, match.job?.salary_max)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${getScoreBadge(match.match_score)}`}>
                        {Math.round(match.match_score)}%
                      </span>
                    </div>

                    {/* Score Breakdown */}
                    <div className="bg-slate-50 rounded-lg p-3 mb-3 space-y-1.5">
                      <ScoreBar label="Skills" score={match.skill_match_score} />
                      <ScoreBar label="Experience" score={match.experience_match_score} />
                      <ScoreBar label="Location" score={match.location_match_score} />
                    </div>

                    {/* Skills */}
                    {(match.matched_skills.length > 0 || match.missing_skills.length > 0) && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {match.matched_skills.map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                            ✓ {skill}
                          </span>
                        ))}
                        {match.missing_skills.slice(0, 3).map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-xs rounded-full border border-slate-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action */}
                    <Link
                      to={`/jobs/${match.job?.id || match.job_id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Job
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
            <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-slate-700 mb-2">No Matches Yet</h2>
            <p className="text-slate-500 mb-4">
              {talent ? 'No matching jobs found for your profile.' : 'Complete your profile to get matched'}
            </p>
            {!talent && (
              <Link to="/talent-profile" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Complete Profile
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TalentMatchingPage;
