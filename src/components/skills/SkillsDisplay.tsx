import { Award, Star, TrendingUp } from "lucide-react";

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
    return skill;
  };

  const getProficiencyLabel = (level?: number): string => {
    if (!level) return "Beginner";
    if (level >= 4) return "Expert";
    if (level >= 3) return "Advanced";
    if (level >= 2) return "Intermediate";
    return "Beginner";
  };

  const getProficiencyColor = (level?: number): string => {
    if (!level) return "bg-gray-100 text-gray-700 border-gray-200";
    if (level >= 4) return "bg-purple-100 text-purple-800 border-purple-300";
    if (level >= 3) return "bg-blue-100 text-blue-800 border-blue-300";
    if (level >= 2) return "bg-green-100 text-green-800 border-green-300";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  if (variant === "compact") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {displaySkills.map((skill, index) => {
          const skillName = getSkillName(skill);
          const skillData = getSkillData(skill);

          return (
            <span
              key={`${skillName}-${index}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 ${skillData?.is_primary
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md"
                : "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300"
                }`}
            >
              {skillData?.is_primary && (
                <Star className="h-3 w-3" fill="currentColor" />
              )}
              {skillName}
            </span>
          );
        })}
        {remainingCount > 0 && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-200 text-gray-700">
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

          return (
            <div
              key={`${skillName}-${index}`}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 flex-1">
                {skillData?.is_primary && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Star className="h-4 w-4 text-white" fill="currentColor" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{skillName}</span>
                    {skillData?.is_primary && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                        Primary
                      </span>
                    )}
                  </div>
                  {showProficiency && skillData && (
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <TrendingUp className="h-3 w-3" />
                        <span>{getProficiencyLabel(skillData.proficiency_level)}</span>
                      </div>
                      {skillData.years_of_experience !== undefined && skillData.years_of_experience > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Award className="h-3 w-3" />
                          <span>{skillData.years_of_experience} {skillData.years_of_experience === 1 ? 'year' : 'years'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {showProficiency && skillData?.proficiency_level && (
                <div className="flex-shrink-0 ml-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`w-2 h-8 rounded-full transition-all ${level <= (skillData.proficiency_level || 0)
                          ? level <= 2
                            ? "bg-green-500"
                            : level <= 3
                              ? "bg-blue-500"
                              : "bg-purple-500"
                          : "bg-gray-200"
                          }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div className="text-center py-2">
            <span className="text-sm text-gray-600">
              and {remainingCount} more skill{remainingCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${className}`}>
        {displaySkills.map((skill, index) => {
          const skillName = getSkillName(skill);
          const skillData = getSkillData(skill);
          const proficiencyLevel = skillData?.proficiency_level || 0;
          const isRequired = skillData?.is_required !== undefined ? skillData.is_required : true;

          return (
            <div
              key={`${skillName}-${index}`}
              className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 hover:shadow-lg ${skillData?.is_primary
                ? "bg-gradient-to-br from-purple-50 to-blue-50 border-purple-300"
                : getProficiencyColor(proficiencyLevel)
                }`}
            >
              {/* Required/Optional Badge */}
              <div className="absolute -top-2 -right-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold shadow-md ${isRequired
                  ? "bg-red-500 text-white"
                  : "bg-gray-400 text-white"
                  }`}>
                  {isRequired ? "Required" : "Optional"}
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 pr-16">{skillName}</h4>

                {showProficiency && skillData && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 font-medium">
                        {getProficiencyLabel(proficiencyLevel)}
                      </span>
                      {skillData.years_of_experience !== undefined && skillData.years_of_experience > 0 && (
                        <span className="text-gray-600">
                          {skillData.years_of_experience}y exp
                        </span>
                      )}
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${proficiencyLevel >= 4
                          ? "bg-gradient-to-r from-purple-500 to-blue-500"
                          : proficiencyLevel >= 3
                            ? "bg-blue-500"
                            : proficiencyLevel >= 2
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}
                        style={{ width: `${(proficiencyLevel / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div className="flex items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
            <span className="text-sm font-medium text-gray-600">
              +{remainingCount} more
            </span>
          </div>
        )}
      </div>
    );
  }

  return null;
}
