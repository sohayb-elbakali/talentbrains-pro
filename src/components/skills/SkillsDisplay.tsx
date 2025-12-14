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
                  {proficiencyLevel}/5
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

                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(proficiencyLevel / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {proficiencyLevel}/5
                  </span>
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

          return (
            <div
              key={`${skillName}-${index}`}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-primary hover:shadow-md transition-all"
            >
              {/* Skill Name */}
              <h4 className="text-base font-semibold text-slate-900 mb-3">
                {skillName}
              </h4>

              {/* Proficiency Level */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">{profLabel}</span>
                  <span className="font-semibold text-primary">
                    {proficiencyLevel}/5
                  </span>
                </div>

                {/* Progress Dots */}
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`flex-1 h-2 rounded-full transition-all ${level <= proficiencyLevel
                          ? "bg-primary"
                          : "bg-slate-200"
                        }`}
                    />
                  ))}
                </div>
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
