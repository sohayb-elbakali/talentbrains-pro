import { motion } from 'framer-motion';
import { ArrowLeft, Users, TrendingUp } from 'lucide-react';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
            <p className="text-red-800 text-lg font-semibold">
              Error loading matches: {error.message}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/company/jobs/${jobId}`)}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Job Details</span>
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Matching Talents
              </h1>
              <p className="text-gray-600">
                AI-powered matching based on skills, experience, location, and salary
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-3xl font-bold text-purple-600">{matches?.length || 0}</p>
                <p className="text-sm text-gray-600">Matches Found</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Bar */}
        {matches && matches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-6 mb-8 text-white"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {matches.filter(m => m.match_score >= 80).length}
                </p>
                <p className="text-purple-100 text-sm font-medium">Excellent Matches (80%+)</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {matches.filter(m => m.match_score >= 60 && m.match_score < 80).length}
                </p>
                <p className="text-purple-100 text-sm font-medium">Good Matches (60-79%)</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {Math.round(matches.reduce((sum, m) => sum + m.match_score, 0) / matches.length)}%
                </p>
                <p className="text-purple-100 text-sm font-medium">Average Match Score</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {Math.max(...matches.map(m => m.matched_skills.length))}
                </p>
                <p className="text-purple-100 text-sm font-medium">Max Skills Matched</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Grid */}
        {matches && matches.length > 0 ? (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                <TrendingUp className="inline h-5 w-5 mr-2" />
                Sorted by match score (highest first)
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match, idx) => (
                <motion.div
                  key={match.talent_id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-12 text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Matches Found</h3>
            <p className="text-gray-600 mb-6">
              No talents match the requirements for this job yet. Try adjusting the job requirements or check back later.
            </p>
            <button
              onClick={() => navigate(`/company/jobs/${jobId}/edit`)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Edit Job Requirements
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
