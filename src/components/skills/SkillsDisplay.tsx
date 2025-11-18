

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
    if (typeof skill === "string") {
      console.log("⚠️ Skill is a string:", skill);
      return null;
    }
    // Ensure proficiency_level is a number
    if (skill && typeof skill === 'object') {
      const profLevel = skill.proficiency_level !== undefined && skill.proficiency_level !== null 
        ? Number(skill.proficiency_level) 
        : 3;
      console.log("✅ Skill object:", skill.name || skill.skill_name, "proficiency:", skill.proficiency_level, "→", profLevel);
      return {
        ...skill,
        proficiency_level: profLevel
      };
    }
    return skill;
  };



  if (variant === "compact") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {displaySkills.map((skill, index) => {
          const skillName = getSkillName(skill);
          const skillData = getSkillData(skill);
          const proficiencyLevel = skillData?.proficiency_level || 3;
          const profInfo = {
            1: { emoji: "🌱", color: "from-gray-400 to-gray-500" },
            2: { emoji: "🌿", color: "from-green-400 to-emerald-500" },
            3: { emoji: "🌟", color: "from-blue-400 to-cyan-500" },
            4: { emoji: "🔥", color: "from-orange-400 to-red-500" },
            5: { emoji: "👑", color: "from-purple-500 to-pink-500" },
          }[proficiencyLevel] || { emoji: "🌟", color: "from-blue-400 to-cyan-500" };

          return (
            <span
              key={`${skillName}-${index}`}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold transition-all hover:scale-105 shadow-sm ${
                showProficiency && proficiencyLevel > 0
                  ? `bg-gradient-to-r ${profInfo.color} text-white shadow-md`
                  : "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {showProficiency && proficiencyLevel > 0 && (
                <span className="text-base">{profInfo.emoji}</span>
              )}
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
          <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-bold bg-gray-200 text-gray-700">
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
          const profInfo = {
            1: { emoji: "🌱", label: "Beginner", color: "from-gray-400 to-gray-500" },
            2: { emoji: "🌿", label: "Intermediate", color: "from-green-400 to-emerald-500" },
            3: { emoji: "🌟", label: "Advanced", color: "from-blue-400 to-cyan-500" },
            4: { emoji: "🔥", label: "Expert", color: "from-orange-400 to-red-500" },
            5: { emoji: "👑", label: "Master", color: "from-purple-500 to-pink-500" },
          }[proficiencyLevel] || { emoji: "🌟", label: "Advanced", color: "from-blue-400 to-cyan-500" };

          return (
            <div
              key={`${skillName}-${index}`}
              className="flex items-center justify-between p-4 rounded-xl border-2 hover:shadow-lg transition-all bg-white border-gray-200 hover:border-blue-300"
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Emoji Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${profInfo.color} shadow-md`}>
                  {profInfo.emoji}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 text-lg">{skillName}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Proficiency Level */}
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold bg-gradient-to-r ${profInfo.color} text-white`}>
                        {profInfo.label}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        {proficiencyLevel}/5
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Visual Progress Dots */}
              <div className="flex-shrink-0 ml-4">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`w-2.5 h-10 rounded-full transition-all ${
                        level <= proficiencyLevel
                          ? `bg-gradient-to-b ${profInfo.color} shadow-md`
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
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
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {displaySkills.map((skill, index) => {
          const skillName = getSkillName(skill);
          const skillData = getSkillData(skill);
          console.log("🎨 Displaying skill:", { skillName, skillData, proficiency: skillData?.proficiency_level });
          const proficiencyLevel = skillData?.proficiency_level || 3;
          const profInfo = {
            1: { emoji: "🌱", label: "Beginner", color: "from-gray-400 to-gray-500" },
            2: { emoji: "🌿", label: "Intermediate", color: "from-green-400 to-emerald-500" },
            3: { emoji: "🌟", label: "Advanced", color: "from-blue-400 to-cyan-500" },
            4: { emoji: "🔥", label: "Expert", color: "from-orange-400 to-red-500" },
            5: { emoji: "👑", label: "Master", color: "from-purple-500 to-pink-500" },
          }[proficiencyLevel] || { emoji: "🌟", label: "Advanced", color: "from-blue-400 to-cyan-500" };

          return (
            <div
              key={`${skillName}-${index}`}
              className="relative p-5 rounded-2xl border-2 transition-all hover:scale-105 hover:shadow-xl bg-white border-gray-200 hover:border-blue-300"
            >
              {/* Proficiency Level Badge - Top Right */}
              <div className="absolute -top-3 right-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-lg bg-gradient-to-r ${profInfo.color} text-white`}>
                  <span className="text-base">{profInfo.emoji}</span>
                  {profInfo.label}
                </span>
              </div>

              {/* Skill Name */}
              <div className="mt-4 mb-3">
                <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {skillName}
                </h4>
              </div>

              {/* Proficiency Visual Bar */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-gray-600">Skill Level</span>
                  <span className={`bg-gradient-to-r ${profInfo.color} bg-clip-text text-transparent`}>
                    {proficiencyLevel}/5
                  </span>
                </div>
                
                {/* Creative Dot Progress Bar */}
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`flex-1 h-2.5 rounded-full transition-all duration-300 ${
                        level <= proficiencyLevel
                          ? `bg-gradient-to-r ${profInfo.color} shadow-md`
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>


            </div>
          );
        })}
        {remainingCount > 0 && (
          <div className="flex items-center justify-center p-5 rounded-2xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-blue-50 hover:border-blue-400 transition-all">
            <span className="text-sm font-bold text-gray-600">
              +{remainingCount} more skill{remainingCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    );
  }

  return null;
}
