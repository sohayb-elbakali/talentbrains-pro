import { motion } from 'framer-motion';
import { ArrowLeft, Users, TrendingUp, BrainCircuit } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useMatchJobToTalents } from '../../hooks/useMatching';
import { MatchScoreCard } from '../../components/matching/MatchScoreCard';
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { supabase } from '../../lib/supabase/client';
import { notify } from '../../utils/notify';

interface TalentInfo {
  id: string;
  full_name: string;
  title: string;
  location?: string;
  avatar_url?: string;
  years_of_experience?: number;
  experience_level?: string;
}

export const JobMatchingResultsPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const limit = Number(searchParams.get('limit')) || 20;

  const { data: matches, isLoading, error } = useMatchJobToTalents(jobId || '', limit);
  const [talentsInfo, setTalentsInfo] = useState<Record<string, TalentInfo>>({});
  const [loadingTalents, setLoadingTalents] = useState(false);

  // Fetch talent details for all matches
  useEffect(() => {
    const fetchTalentsInfo = async () => {
      if (!matches || matches.length === 0) return;

      setLoadingTalents(true);
      const talentIds = matches.map(m => m.talent_id).filter(Boolean) as string[];
      const talentsData: Record<string, TalentInfo> = {};

      try {
        for (const talentId of talentIds) {
          const { data, error } = await supabase
            .from('talents')
            .select(`
              id,
              title,
              location,
              years_of_experience,
              experience_level,
              profile:profiles(full_name, avatar_url)
            `)
            .eq('id', talentId)
            .single();

          if (data && !error) {
            talentsData[talentId] = {
              id: data.id,
              full_name: data.profile?.full_name || 'Unknown',
              title: data.title,
              location: data.location,
              avatar_url: data.profile?.avatar_url,
              years_of_experience: data.years_of_experience,
              experience_level: data.experience_level
            };
          }
        }
        setTalentsInfo(talentsData);
      } catch (err) {
        console.error('Error fetching talents info:', err);
      } finally {
        setLoadingTalents(false);
      }
    };

    fetchTalentsInfo();
  }, [matches]);

  if (isLoading || loadingTalents) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" text="Analyzing matches and profiles..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <p className="text-red-800 text-lg font-semibold">
              Error loading matches: {error.message}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const excellentMatches = matches?.filter(m => m.match_score >= 80).length || 0;
  const goodMatches = matches?.filter(m => m.match_score >= 60 && m.match_score < 80).length || 0;
  const avgScore = matches && matches.length > 0
    ? Math.round(matches.reduce((sum, m) => sum + m.match_score, 0) / matches.length)
    : 0;
  const maxSkills = matches && matches.length > 0
    ? Math.max(...matches.map(m => m.matched_skills?.length || 0))
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/company/jobs/${jobId}`)}
          className="mb-6 flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back to Job Details</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <BrainCircuit className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Matching Talents</h1>
                <p className="text-slate-500">AI-powered matching based on skills, experience, location, and salary</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">{matches?.length || 0}</p>
                <p className="text-sm text-slate-500">Matches Found</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        {matches && matches.length > 0 && (
          <div className="bg-blue-600 rounded-xl p-5 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{excellentMatches}</p>
                <p className="text-blue-100 text-sm">Excellent Matches (80%+)</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{goodMatches}</p>
                <p className="text-blue-100 text-sm">Good Matches (60-79%)</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{avgScore}%</p>
                <p className="text-blue-100 text-sm">Average Match Score</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{maxSkills}</p>
                <p className="text-blue-100 text-sm">Max Skills Matched</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {matches && matches.length > 0 ? (
          <div>
            <div className="mb-4 flex items-center gap-2 text-slate-500">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Sorted by match score (highest first)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match, idx) => (
                <motion.div
                  key={match.talent_id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <MatchScoreCard
                    match={match}
                    type="job"
                    talentInfo={match.talent_id ? talentsInfo[match.talent_id] : undefined}
                    onViewDetails={() => {
                      navigate(`/talents/${match.talent_id}`);
                    }}
                    onSendMessage={() => {
                      notify.showInfo('Messaging feature coming soon!');
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Matches Found</h3>
            <p className="text-slate-500 mb-6">
              No talents match the requirements for this job yet. Try adjusting the job requirements or check back later.
            </p>
            <button
              onClick={() => navigate(`/company/jobs/${jobId}/edit`)}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Edit Job Requirements
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
