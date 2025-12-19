import { Mail, User, MapPin, Briefcase, Calendar } from 'lucide-react';
import { MatchResult } from '../../services/matchingService';

interface TalentInfo {
  id: string;
  full_name: string;
  title: string;
  location?: string;
  avatar_url?: string;
  years_of_experience?: number;
  experience_level?: string;
}

interface MatchScoreCardProps {
  match: MatchResult;
  type: 'talent' | 'job';
  talentInfo?: TalentInfo;
  onViewDetails?: () => void;
  onSendMessage?: () => void;
}

export const MatchScoreCard = ({ match, type, talentInfo, onViewDetails, onSendMessage }: MatchScoreCardProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-gray-100 overflow-hidden">
      {/* Talent Profile Header (if talent info provided) */}
      {talentInfo && type === 'job' && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 border-b-2 border-gray-100">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative flex-shrink-0">
                {talentInfo.avatar_url ? (
                  <img
                    src={talentInfo.avatar_url}
                    alt={talentInfo.full_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center border-2 border-white shadow-md">
                    <User className="h-8 w-8 text-white" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-gray-900 truncate">
                  {talentInfo.full_name}
                </h3>
                <p className="text-sm font-medium text-purple-600 truncate flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  {talentInfo.title}
                </p>
              </div>
            </div>
            <div className={`flex flex-col items-center justify-center px-4 py-2 rounded-2xl ${getScoreColor(match.match_score)} border-2 border-white shadow-sm flex-shrink-0`}>
              <span className="text-2xl font-black">{Math.round(match.match_score)}%</span>
              <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">Match</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {talentInfo.location && (
              <div className="text-xs text-gray-500 flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                <span className="truncate">{talentInfo.location}</span>
              </div>
            )}
            {talentInfo.years_of_experience !== undefined && (
              <div className="text-xs text-gray-500 flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span className="truncate">{talentInfo.years_of_experience}y Exp • {talentInfo.experience_level}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Overall Match Score (for non-talent cards or without profile) */}
        {(!talentInfo || type === 'talent') && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {type === 'talent' ? 'Job Match' : 'Talent Match'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{match.reason}</p>
            </div>
            <div className={`ml-4 px-4 py-2 rounded-full ${getScoreColor(match.match_score)}`}>
              <span className="text-2xl font-bold">{Math.round(match.match_score)}%</span>
            </div>
          </div>
        )}

        {/* Match Reason for talent cards */}
        {talentInfo && type === 'job' && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">{match.reason}</p>
          </div>
        )}

        {/* Score Breakdown */}
        <div className="space-y-3 mb-4">
          <ScoreBar
            label="Skills"
            score={match.skill_match_score}
            color={getScoreBgColor(match.skill_match_score)}
          />
          <ScoreBar
            label="Experience"
            score={match.experience_match_score}
            color={getScoreBgColor(match.experience_match_score)}
          />
          <ScoreBar
            label="Location"
            score={match.location_match_score}
            color={getScoreBgColor(match.location_match_score)}
          />
          {match.salary_match_score !== null && match.salary_match_score !== undefined && (
            <ScoreBar
              label="Salary"
              score={match.salary_match_score}
              color={getScoreBgColor(match.salary_match_score)}
            />
          )}
        </div>

        {/* Skills */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Matched Skills</h4>
          <div className="flex flex-wrap gap-2">
            {match.matched_skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
          {match.missing_skills.length > 0 && (
            <>
              <h4 className="text-sm font-medium text-gray-700 mb-2 mt-3">Missing Skills</h4>
              <div className="flex flex-wrap gap-2">
                {match.missing_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              View Profile
            </button>
          )}
          {onSendMessage && (
            <button
              onClick={onSendMessage}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Mail className="h-4 w-4" />
              Message
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface ScoreBarProps {
  label: string;
  score: number;
  color: string;
}

const ScoreBar = ({ label, score, color }: ScoreBarProps) => {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{Math.round(score)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color} transition-all duration-300`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};
