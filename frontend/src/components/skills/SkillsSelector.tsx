import { useState, useEffect } from "react";
import { db } from "../../lib/supabase/index";
import { Search, Plus, Sparkles, Star } from "lucide-react";

interface TalentSkill {
  skill_id: string;
  skill_name: string;
  proficiency_level: number;
  years_of_experience: number;
  is_primary: boolean;
}

interface SkillsSelectorProps {
  selectedSkills: TalentSkill[];
  onChange: (skills: TalentSkill[]) => void;
  maxSkills?: number;
}

const PROFICIENCY_LEVELS = [
  { value: 1, label: "Beginner", description: "Just starting out", color: "text-amber-600" },
  { value: 2, label: "Intermediate", description: "Some experience", color: "text-emerald-600" },
  { value: 3, label: "Advanced", description: "Proficient", color: "text-blue-600" },
  { value: 4, label: "Expert", description: "Highly skilled", color: "text-violet-600" },
  { value: 5, label: "Master", description: "Industry expert", color: "text-indigo-600" },
];

export default function SkillsSelector({
  selectedSkills,
  onChange,
  maxSkills = 15,
}: SkillsSelectorProps) {
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [customSkill, setCustomSkill] = useState("");

  const isSkillSelected = (skillName: string) => {
    return selectedSkills.some((s) => s.skill_name === skillName);
  };

  const getProficiencyInfo = (level: number) => {
    return PROFICIENCY_LEVELS.find((p) => p.value === level) || PROFICIENCY_LEVELS[2];
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      const { data, error } = await db.getSkills();
      if (!error && data) {
        setAvailableSkills(data);
      }
    } catch (err) {
      console.error("Failed to load skills:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = (skillName: string, skillId?: string) => {
    if (!isSkillSelected(skillName) && selectedSkills.length < maxSkills) {
      onChange([
        ...selectedSkills,
        {
          skill_id: skillId || skillName,
          skill_name: skillName,
          proficiency_level: 3,
          years_of_experience: 0,
          is_primary: false,
        },
      ]);
    }
  };

  const handleRemoveSkill = (skillName: string) => {
    onChange(selectedSkills.filter((s) => s.skill_name !== skillName));
  };

  const handleUpdateSkill = (skillName: string, updates: Partial<TalentSkill>) => {
    console.log("🔄 Updating skill:", skillName, updates);
    const updatedSkills = selectedSkills.map((s) =>
      s.skill_name === skillName ? { ...s, ...updates } : s
    );
    console.log("🔄 Updated skills:", updatedSkills);
    onChange(updatedSkills);
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !isSkillSelected(trimmed) && selectedSkills.length < maxSkills) {
      handleAddSkill(trimmed);
      setCustomSkill("");
    }
  };

  const filteredSkills = availableSkills.filter((skill) =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm text-gray-500">Loading skills...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar - Compact */}
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
          <Search className="h-4 w-4 text-primary" />
          <span>Search & Select Skills</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search skills..."
            className="w-full px-3 py-2.5 pl-9 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-white"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Available Skills - Compact Grid */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border border-gray-100">
        <p className="text-xs font-semibold text-gray-600 mb-2.5 flex items-center gap-1.5 uppercase tracking-wide">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Available Skills</span>
        </p>
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
          {filteredSkills.length > 0 ? (
            filteredSkills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => handleAddSkill(skill.name, skill.id)}
                disabled={isSkillSelected(skill.name)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${isSkillSelected(skill.name)
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-sm hover:-translate-y-0.5"
                  }`}
              >
                {skill.name}
              </button>
            ))
          ) : (
            <p className="text-xs text-gray-400 italic py-2">
              No skills found. Add a custom skill below.
            </p>
          )}
        </div>
      </div>

      {/* Add Custom Skill - Compact */}
      <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-xl p-3 border border-blue-100/80">
        <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5 text-primary" />
          <span>Add Custom Skill</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomSkill();
              }
            }}
            placeholder="Enter skill name..."
            className="flex-1 px-3 py-2 border border-blue-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white/80 backdrop-blur-sm"
          />
          <button
            type="button"
            onClick={handleAddCustomSkill}
            disabled={!customSkill.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            Add
          </button>
        </div>
      </div>

      {/* Selected Skills - Cute & Pro Design */}
      <div className="relative bg-white rounded-xl p-4 border border-slate-200 shadow-sm overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-emerald-50 to-transparent rounded-tr-full opacity-50"></div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">Your Skills</h3>
                <p className="text-[10px] text-gray-500">Click stars to set level</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${selectedSkills.length >= maxSkills
              ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white"
              : "bg-gradient-to-r from-emerald-400 to-emerald-500 text-white shadow-sm"
              }`}>
              {selectedSkills.length}/{maxSkills}
            </span>
          </div>

          {selectedSkills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedSkills.map((skill) => {
                const profInfo = getProficiencyInfo(skill.proficiency_level);

                return (
                  <div
                    key={skill.skill_name}
                    className={`rounded-xl p-2.5 border transition-all duration-200 hover:shadow-sm group ${skill.is_primary
                      ? "bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-200"
                      : "bg-white border-gray-100 hover:border-gray-200"
                      }`}
                  >
                    {/* Skill Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-sm font-semibold text-gray-800 truncate flex-1 pr-2">
                        {skill.skill_name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill.skill_name)}
                        className="text-gray-400 hover:text-rose-500 hover:bg-rose-50 p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove skill"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Star Rating - Compact */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleUpdateSkill(skill.skill_name, { proficiency_level: star })}
                            className="p-0.5 transition-transform hover:scale-110"
                          >
                            <svg
                              className={`w-4 h-4 transition-all ${star <= skill.proficiency_level
                                ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                                : "text-gray-300 hover:text-gray-400"
                                }`}
                              fill={star <= skill.proficiency_level ? "currentColor" : "none"}
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                      <span className={`text-[10px] font-semibold ${profInfo.color}`}>
                        {profInfo.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="relative inline-block mb-3">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-pulse"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center border border-blue-200/50">
                  <Star className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">No Skills Yet</h4>
              <p className="text-xs text-gray-500">Select from above to add skills ✨</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

