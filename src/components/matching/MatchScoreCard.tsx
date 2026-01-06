import { Mail, User, MapPin, Briefcase, Calendar, ExternalLink } from 'lucide-react';
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
  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-blue-600 text-white';
    if (score >= 60) return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all">
      {/* Talent Profile Header */}
      {talentInfo && type === 'job' && (
        <div className="bg-slate-50 p-4 border-b border-slate-100">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                {talentInfo.avatar_url ? (
                  <img
                    src={talentInfo.avatar_url}
                    alt={talentInfo.full_name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-200">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-900 truncate">
                  {talentInfo.full_name}
                </h3>
                <p className="text-sm text-blue-600 font-medium truncate flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {talentInfo.title}
                </p>
              </div>
            </div>
            <div className={`px-2.5 py-1.5 rounded-lg text-sm font-bold flex-shrink-0 ${getScoreBadge(match.match_score)}`}>
              {Math.round(match.match_score)}%
              <span className="block text-[9px] uppercase tracking-wider opacity-70">Match</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {talentInfo.location && (
              <div className="text-xs text-slate-500 flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-100">
                <MapPin className="h-3 w-3 text-slate-400" />
                <span className="truncate">{talentInfo.location}</span>
              </div>
            )}
            {talentInfo.years_of_experience !== undefined && (
              <div className="text-xs text-slate-500 flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-100">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span className="truncate">{talentInfo.years_of_experience}y Exp • {talentInfo.experience_level}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Overall Match Score (for non-talent cards or without profile) */}
        {(!talentInfo || type === 'talent') && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-900">
                {type === 'talent' ? 'Job Match' : 'Talent Match'}
              </h3>
              <p className="text-sm text-slate-500 mt-1">{match.reason}</p>
            </div>
            <div className={`ml-3 px-3 py-1.5 rounded-lg ${getScoreBadge(match.match_score)}`}>
              <span className="text-lg font-bold">{Math.round(match.match_score)}%</span>
            </div>
          </div>
        )}

        {/* Match Reason for talent cards */}
        {talentInfo && type === 'job' && (
          <p className="text-sm text-slate-500 mb-3">{match.reason}</p>
        )}

        {/* Score Breakdown */}
        <div className="space-y-2 mb-4">
          <ScoreBar label="Skills" score={match.skill_match_score} />
          <ScoreBar label="Experience" score={match.experience_match_score} />
          <ScoreBar label="Location" score={match.location_match_score} />
          {match.salary_match_score !== null && match.salary_match_score !== undefined && (
            <ScoreBar label="Salary" score={match.salary_match_score} />
          )}
        </div>

        {/* Skills */}
        <div className="mb-4">
          {match.matched_skills && match.matched_skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {match.matched_skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
          {match.missing_skills && match.missing_skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {match.missing_skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-slate-50 text-slate-500 text-xs rounded-full border border-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              View Profile
            </button>
          )}
          {onSendMessage && (
            <button
              onClick={onSendMessage}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              <Mail className="h-4 w-4" />
              Contact
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
}

const ScoreBar = ({ label, score }: ScoreBarProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-20">{label}</span>
      <div className="flex-1 bg-blue-100 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-600 w-8 text-right">{Math.round(score)}%</span>
    </div>
  );
};
