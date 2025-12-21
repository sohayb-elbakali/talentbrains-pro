import { motion } from 'framer-motion';
import { BrainCircuit, MapPin, Briefcase, Users, ChevronRight, ExternalLink, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../lib/supabase/index";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

// Simple score bar with blue theme
const ScoreBar = ({ label, score }: { label: string; score: number }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-slate-500 w-20">{label}</span>
    <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-500 rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, score)}%` }}
      />
    </div>
    <span className="text-xs font-medium text-slate-600 w-8 text-right">{Math.round(score)}%</span>
  </div>
);

// Get badge color based on score
const getScoreBadge = (score: number) => {
  if (score >= 80) return "bg-blue-600 text-white";
  if (score >= 60) return "bg-blue-100 text-blue-700 border border-blue-200";
  if (score > 0) return "bg-slate-100 text-slate-600 border border-slate-200";
  return "bg-slate-100 text-slate-400 border border-slate-200";
};

interface Job {
  id: string;
  title: string;
  location?: string;
  status: string;
}

interface Match {
  id: string;
  job_id: string;
  match_score: number;
  skill_match_score: number;
  experience_match_score: number;
  location_match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  talent: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    title?: string;
    location?: string;
    years_of_experience?: number;
  };
}

const CompanyMatchesPage = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(searchParams.get("job_id"));
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Fetch company jobs first
  useEffect(() => {
    if (!profile?.id) return;

    const fetchJobs = async () => {
      try {
        setLoading(true);

        // Get company ID
        const { data: companyData } = await db.getCompany(profile.id);
        if (!companyData) return;

        // Get company jobs
        const { data: jobsData, error: jobsError } = await db.getJobs({ company_id: companyData.id });
        if (jobsError) throw jobsError;

        const activeJobs = (jobsData || []).filter((j: any) => j.status === 'active');
        setJobs(activeJobs);

        // If job_id in URL, select it
        const urlJobId = searchParams.get("job_id");
        if (urlJobId && activeJobs.find((j: Job) => j.id === urlJobId)) {
          setSelectedJobId(urlJobId);
        }
      } catch (err: any) {
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [profile, searchParams]);

  // Fetch matches when job is selected - call backend API for real matching
  useEffect(() => {
    if (!selectedJobId || !profile?.id) {
      setMatches([]);
      return;
    }

    const fetchMatches = async () => {
      try {
        setMatchesLoading(true);

        // Call backend matching API for real-time matching
        const response = await fetch(`http://localhost:8000/api/matching/job/${selectedJobId}/talents?limit=20`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const matchingResults = await response.json();

          // Get talent IDs and fetch their details from Supabase
          const talentIds = matchingResults.map((m: any) => m.talent_id).filter(Boolean);

          // Fetch talent details
          const { supabase } = await import("../../lib/supabase/index");
          const talentsMap: Record<string, any> = {};

          if (talentIds.length > 0) {
            const { data: talents } = await supabase
              .from('talents')
              .select(`
                id,
                title,
                location,
                years_of_experience,
                experience_level,
                profile:profiles(full_name, avatar_url)
              `)
              .in('id', talentIds);

            if (talents) {
              talents.forEach((t: any) => {
                talentsMap[t.id] = {
                  id: t.id,
                  full_name: t.profile?.full_name || 'Candidate',
                  avatar_url: t.profile?.avatar_url,
                  title: t.title || 'Professional',
                  location: t.location,
                  years_of_experience: t.years_of_experience,
                };
              });
            }
          }

          // Transform backend results to our format with talent details
          const realMatches: Match[] = matchingResults.map((m: any) => {
            const talentInfo = talentsMap[m.talent_id] || {};
            return {
              id: `match-${m.talent_id}`,
              job_id: selectedJobId,
              match_score: m.match_score || 0,
              skill_match_score: m.skill_match_score || 0,
              experience_match_score: m.experience_match_score || 0,
              location_match_score: m.location_match_score || 0,
              matched_skills: m.matched_skills || [],
              missing_skills: m.missing_skills || [],
              talent: {
                id: m.talent_id,
                full_name: talentInfo.full_name || 'Candidate',
                avatar_url: talentInfo.avatar_url || null,
                title: talentInfo.title || 'Professional',
                location: talentInfo.location || m.location,
                years_of_experience: talentInfo.years_of_experience,
              },
            };
          });

          realMatches.sort((a, b) => b.match_score - a.match_score);
          setMatches(realMatches);
        } else {
          // API returned error or no results
          setMatches([]);
        }
      } catch (err: any) {
        console.error('Matching error:', err);
        setMatches([]);
      } finally {
        setMatchesLoading(false);
      }
    };

    fetchMatches();
  }, [selectedJobId, profile?.id]);

  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setSearchParams({ job_id: jobId });
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your jobs..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-xl">
              <BrainCircuit className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">AI Talent Matches</h1>
              <p className="text-slate-500">Find the best candidates for your open positions</p>
            </div>
          </div>
        </div>

        {jobs.length === 0 ? (
          // No jobs
          <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
            <Briefcase className="w-14 h-14 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">No Active Jobs</h2>
            <p className="text-slate-500 mb-6">Post a job to start matching with candidates</p>
            <Link to="/company/jobs/create" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700">
              <Briefcase className="w-4 h-4" />
              Post a Job
            </Link>
          </div>
        ) : !selectedJobId ? (
          // Job Selection
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">Select a Job</h2>
              <p className="text-sm text-slate-500">Choose a job to see matching candidates</p>
            </div>
            <div className="divide-y divide-slate-100">
              {jobs.map((job, idx) => (
                <motion.button
                  key={job.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleSelectJob(job.id)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{job.title}</h3>
                      {job.location && (
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          // Show Matches for Selected Job
          <div>
            {/* Selected Job Header */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">{selectedJob?.title}</h2>
                    <p className="text-sm text-slate-500">{matches.length} matching candidates</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedJobId(null);
                    setSearchParams({});
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Change Job
                </button>
              </div>
            </div>

            {/* Matches */}
            {matchesLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner text="Finding matches..." />
              </div>
            ) : matches.length > 0 ? (
              <div className="space-y-4">
                {matches.map((match, idx) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <img
                        src={match.talent.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${match.talent.full_name}&backgroundColor=dbeafe`}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-slate-900">{match.talent.full_name}</h3>
                            <p className="text-blue-600 font-medium">{match.talent.title || 'Professional'}</p>
                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                              {match.talent.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {match.talent.location}
                                </span>
                              )}
                              {match.talent.years_of_experience && (
                                <span>{match.talent.years_of_experience}+ years exp</span>
                              )}
                            </div>
                          </div>

                          {/* Match Score */}
                          <div className="text-center flex-shrink-0">
                            <div className={`px-3 py-2 rounded-xl text-lg font-bold ${getScoreBadge(match.match_score)}`}>
                              {match.match_score > 0 ? `${Math.round(match.match_score)}%` : 'Pending'}
                            </div>
                            {match.match_score > 0 && <p className="text-xs text-slate-400 mt-1">match</p>}
                          </div>
                        </div>

                        {/* Score Breakdown - only show if scores exist */}
                        {match.match_score > 0 && (
                          <div className="bg-slate-50 rounded-xl p-3 mb-3">
                            <div className="space-y-2">
                              <ScoreBar label="Skills" score={match.skill_match_score} />
                              <ScoreBar label="Experience" score={match.experience_match_score} />
                              <ScoreBar label="Location" score={match.location_match_score} />
                            </div>
                          </div>
                        )}

                        {/* Skills - only show if they exist */}
                        {(match.matched_skills.length > 0 || match.missing_skills.length > 0) && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {match.matched_skills.map(skill => (
                              <span key={skill} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                                {skill}
                              </span>
                            ))}
                            {match.missing_skills.map(skill => (
                              <span key={skill} className="px-2.5 py-1 bg-slate-50 text-slate-500 text-xs rounded-lg border border-slate-200">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Link
                            to={`/talents/${match.talent.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Profile
                          </Link>
                          <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
                            <Mail className="w-4 h-4" />
                            Contact
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h2 className="text-lg font-medium text-slate-700 mb-2">No Matches Found</h2>
                <p className="text-slate-500">We're still finding candidates for this position</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyMatchesPage;
