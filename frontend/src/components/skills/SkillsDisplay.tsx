interface Skill {
  skill_id?: string;
  skill_name?: string;
  name?: string;
  proficiency_level?: number;
  years_of_experience?: number;
  is_primary?: boolean;
  is_required?: boolean;
}

interface SkillsDisplayProps {
  skills: (string | Skill)[];
  variant?: "compact" | "detailed" | "card";
  showProficiency?: boolean;
  maxDisplay?: number;
  className?: string;
}

export default function SkillsDisplay({
  skills,
  variant = "compact",
  showProficiency = false,
  maxDisplay,
  className = "",
}: SkillsDisplayProps) {
  const displaySkills = maxDisplay ? skills.slice(0, maxDisplay) : skills;
  const remainingCount = maxDisplay && skills.length > maxDisplay ? skills.length - maxDisplay : 0;

  const getSkillName = (skill: string | Skill): string => {
    if (typeof skill === "string") return skill;
    return skill.skill_name || skill.name || "";
  };

  const getSkillData = (skill: string | Skill): Skill | null => {
    if (typeof skill === "string") return null;
    if (skill && typeof skill === 'object') {
      const profLevel = skill.proficiency_level !== undefined && skill.proficiency_level !== null
        ? Number(skill.proficiency_level)
        : 3;
      return {
        ...skill,
        proficiency_level: profLevel
      };
    }
    return skill;
  };

  const getProficiencyLabel = (level: number): string => {
    const labels: Record<number, string> = {
      1: "Beginner",
      2: "Intermediate",
      3: "Advanced",
      4: "Expert",
      5: "Master",
    };
    return labels[level] || "Advanced";
  };

  // Semantic color mapping for proficiency levels with glassmorphism effect
  const getSemanticColors = (level: number) => {
    // Level-based colors: Blue=Advanced(3), Green=Intermediate(2), Amber=Beginner(1), Purple=Expert(4), Indigo=Master(5)
    const levelColors: Record<number, {
      cardBg: string;
      cardBorder: string;
      badgeBg: string;
      badgeText: string;
      badgeBorder: string;
    }> = {
      1: {
        cardBg: "bg-gradient-to-br from-amber-50/80 to-orange-50/60",
        cardBorder: "border-amber-200/60",
        badgeBg: "bg-amber-100/80",
        badgeText: "text-amber-700",
        badgeBorder: "border-amber-300/50"
      },
      2: {
        cardBg: "bg-gradient-to-br from-emerald-50/80 to-green-50/60",
        cardBorder: "border-emerald-200/60",
        badgeBg: "bg-emerald-100/80",
        badgeText: "text-emerald-700",
        badgeBorder: "border-emerald-300/50"
      },
      3: {
        cardBg: "bg-gradient-to-br from-blue-50/80 to-indigo-50/60",
        cardBorder: "border-blue-200/60",
        badgeBg: "bg-blue-100/80",
        badgeText: "text-blue-700",
        badgeBorder: "border-blue-300/50"
      },
      4: {
        cardBg: "bg-gradient-to-br from-violet-50/80 to-purple-50/60",
        cardBorder: "border-violet-200/60",
        badgeBg: "bg-violet-100/80",
        badgeText: "text-violet-700",
        badgeBorder: "border-violet-300/50"
      },
      5: {
        cardBg: "bg-gradient-to-br from-indigo-50/80 to-blue-50/60",
        cardBorder: "border-indigo-200/60",
        badgeBg: "bg-indigo-100/80",
        badgeText: "text-indigo-700",
        badgeBorder: "border-indigo-300/50"
      },
    };
    return levelColors[level] || levelColors[3];
  };

  if (variant === "compact") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {displaySkills.map((skill, index) => {
          const skillName = getSkillName(skill);
          const skillData = getSkillData(skill);
          const proficiencyLevel = skillData?.proficiency_level || 3;
          const colors = getSemanticColors(proficiencyLevel);

          return (
            <span
              key={`${skillName}-${index}`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 ${colors.badgeBg} ${colors.badgeText} border ${colors.badgeBorder} backdrop-blur-sm shadow-sm`}
            >
              {skillName}
              {showProficiency && proficiencyLevel > 0 && (
                <span className="opacity-75 text-[10px]">
                  • {getProficiencyLabel(proficiencyLevel)}
                </span>
              )}
            </span>
          );
        })}
        {remainingCount > 0 && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100/80 text-slate-600 border border-slate-200/60 backdrop-blur-sm">
            +{remainingCount} more
          </span>
        )}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={`space-y-2 ${className}`}>
        {displaySkills.map((skill, index) => {
          const skillName = getSkillName(skill);
          const skillData = getSkillData(skill);
          const proficiencyLevel = skillData?.proficiency_level || 3;
          const profLabel = getProficiencyLabel(proficiencyLevel);
          const colors = getSemanticColors(proficiencyLevel);
          const isRequired = skillData?.is_required;

          return (
            <div
              key={`${skillName}-${index}`}
              className={`flex items-center justify-between p-3 rounded-xl border ${colors.cardBorder} ${colors.cardBg} backdrop-blur-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-semibold text-sm text-slate-800 truncate">{skillName}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${colors.badgeBg} ${colors.badgeText} border ${colors.badgeBorder}`}>
                    {profLabel}
                  </span>
                  {isRequired !== undefined && (
                    <span className={`text-[10px] font-medium ${isRequired ? "text-rose-500/80" : "text-slate-400"}`}>
                      {isRequired ? "Required" : "Optional"}
                    </span>
                  )}
                </div>

                {/* Star Rating */}
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-3.5 h-3.5 transition-colors ${star <= proficiencyLevel ? "text-amber-400 fill-amber-400" : "text-slate-300/60"}`}
                      fill={star <= proficiencyLevel ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div className="text-center py-1.5">
            <span className="text-xs text-slate-500">
              +{remainingCount} more skill{remainingCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 ${className}`}>
        {displaySkills.map((skill, index) => {
          const skillName = getSkillName(skill);
          const skillData = getSkillData(skill);
          const proficiencyLevel = skillData?.proficiency_level || 3;
          const profLabel = getProficiencyLabel(proficiencyLevel);
          const isRequired = skillData?.is_required;
          const colors = getSemanticColors(proficiencyLevel);

          return (
            <div
              key={`${skillName}-${index}`}
              className={`
                relative p-3 rounded-2xl border ${colors.cardBorder} ${colors.cardBg}
                backdrop-blur-sm shadow-sm
                hover:shadow-lg hover:-translate-y-1 hover:border-opacity-80
                transition-all duration-300 ease-out
                group cursor-default
              `}
              style={{
                boxShadow: '0 2px 8px -2px rgba(0,0,0,0.06), 0 4px 16px -4px rgba(0,0,0,0.04)',
              }}
            >
              {/* Card Content */}
              <div className="flex flex-col h-full min-h-[80px]">
                {/* Header: Skill Name & Badge */}
                <div className="flex items-start justify-between gap-1.5 mb-auto">
                  <h4 className="text-sm font-bold text-slate-800 leading-tight line-clamp-2 group-hover:text-slate-900 transition-colors">
                    {skillName}
                  </h4>
                  <span className={`
                    flex-shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-semibold 
                    ${colors.badgeBg} ${colors.badgeText} border ${colors.badgeBorder}
                    backdrop-blur-sm
                  `}>
                    {profLabel}
                  </span>
                </div>

                {/* Required/Optional Label - Subtle */}
                {isRequired !== undefined && (
                  <span className={`
                    text-[10px] font-medium mt-1
                    ${isRequired ? "text-rose-500/70" : "text-slate-400/80"}
                  `}>
                    {isRequired ? "Required" : "Optional"}
                  </span>
                )}

                {/* Star Rating - Fixed at Bottom */}
                <div className="flex items-center gap-0.5 mt-2 pt-2 border-t border-slate-200/40">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-3.5 h-3.5 transition-all duration-200 ${star <= proficiencyLevel
                        ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                        : "text-slate-300/50"
                        } ${star <= proficiencyLevel ? "group-hover:scale-110" : ""}`}
                      fill={star <= proficiencyLevel ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div className="flex items-center justify-center p-3 rounded-2xl border-2 border-dashed border-slate-200/60 bg-slate-50/50 backdrop-blur-sm">
            <span className="text-xs font-medium text-slate-500">
              +{remainingCount} more
            </span>
          </div>
        )}
      </div>
    );
  }

  return null;
}
