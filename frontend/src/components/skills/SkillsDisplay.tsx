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

  if (variant === "compact") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {displaySkills.map((skill, index) => {
          const skillName = getSkillName(skill);
          const skillData = getSkillData(skill);
          const proficiencyLevel = skillData?.proficiency_level || 3;

          return (
            <span
              key={`${skillName}-${index}`}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showProficiency && proficiencyLevel > 0
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
            >
              {skillName}
              {showProficiency && proficiencyLevel > 0 && (
                <span className="text-xs opacity-90">
                  • {getProficiencyLabel(proficiencyLevel)}
                </span>
              )}
            </span>
          );
        })}
        {remainingCount > 0 && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-200 text-slate-700">
            +{remainingCount} more
          </span>
        )}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={`space-y-3 ${className}`}>
        {displaySkills.map((skill, index) => {
          const skillName = getSkillName(skill);
          const skillData = getSkillData(skill);
          const proficiencyLevel = skillData?.proficiency_level || 3;
          const profLabel = getProficiencyLabel(proficiencyLevel);

          return (
            <div
              key={`${skillName}-${index}`}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-primary hover:shadow-sm transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-slate-900">{skillName}</span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                    {profLabel}
                  </span>
                </div>

                {/* Star Rating */}
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${star <= proficiencyLevel ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
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
          <div className="text-center py-2">
            <span className="text-sm text-slate-600">
              and {remainingCount} more skill{remainingCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {displaySkills.map((skill, index) => {
          const skillName = getSkillName(skill);
          const skillData = getSkillData(skill);
          const proficiencyLevel = skillData?.proficiency_level || 3;
          const profLabel = getProficiencyLabel(proficiencyLevel);
          const isRequired = skillData?.is_required;

          // Color mapping based on proficiency
          const colorMap: Record<number, { bg: string; text: string }> = {
            1: { bg: "bg-gray-50", text: "text-gray-600" },
            2: { bg: "bg-green-50", text: "text-green-600" },
            3: { bg: "bg-blue-50", text: "text-blue-600" },
            4: { bg: "bg-orange-50", text: "text-orange-600" },
            5: { bg: "bg-purple-50", text: "text-purple-600" },
          };
          const colors = colorMap[proficiencyLevel] || colorMap[3];

          return (
            <div
              key={`${skillName}-${index}`}
              className={`p-4 rounded-xl border border-slate-200 hover:border-primary hover:shadow-md transition-all ${colors.bg}`}
            >
              {/* Skill Name & Badge */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <h4 className="text-base font-bold text-slate-900">
                  {skillName}
                </h4>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors.text} border border-current`}>
                    {profLabel}
                  </span>
                  {isRequired !== undefined && (
                    <span className={`text-xs font-medium ${isRequired ? "text-red-500" : "text-slate-400"}`}>
                      {isRequired ? "Required" : "Optional"}
                    </span>
                  )}
                </div>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${star <= proficiencyLevel ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                    fill={star <= proficiencyLevel ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ))}
              </div>
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div className="flex items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
            <span className="text-sm font-medium text-slate-600">
              +{remainingCount} more skill{remainingCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    );
  }

  return null;
}
