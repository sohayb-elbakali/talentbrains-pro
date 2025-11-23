import { useState, useEffect } from "react";
import { db } from "../../lib/supabase/index";
import { Search, Plus, Sparkles } from "lucide-react";

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
  { value: 1, label: "Beginner", emoji: "🌱", description: "Just starting out" },
  { value: 2, label: "Intermediate", emoji: "🌿", description: "Some experience" },
  { value: 3, label: "Advanced", emoji: "🌟", description: "Proficient" },
  { value: 4, label: "Expert", emoji: "🔥", description: "Highly skilled" },
  { value: 5, label: "Master", emoji: "👑", description: "Industry expert" },
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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-gray-600">Loading skills...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <label className="block text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          <span>Search & Select Skills</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for skills (e.g., React, Python, Design)..."
            className="w-full px-5 py-4 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Available Skills */}
      <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
        <p className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>Available Skills</span>
        </p>
        <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto">
          {filteredSkills.length > 0 ? (
            filteredSkills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => handleAddSkill(skill.name, skill.id)}
                disabled={isSkillSelected(skill.name)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 ${isSkillSelected(skill.name)
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 border-2 border-gray-200 hover:border-primary-light hover:shadow-md"
                  }`}
              >
                {skill.name}
              </button>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">
              No skills found. Try a different search or add a custom skill below.
            </p>
          )}
        </div>
      </div>

      {/* Add Custom Skill */}
      <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
        <label className="block text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          <span>Add Custom Skill</span>
        </label>
        <div className="flex gap-3">
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
            placeholder="Enter a custom skill..."
            className="flex-1 px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleAddCustomSkill}
            disabled={!customSkill.trim()}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all transform hover:scale-105 shadow-md"
          >
            Add
          </button>
        </div>
      </div>

      {/* Selected Skills - Modern & Cute Design */}
      <div className="relative bg-white rounded-2xl p-6 border-2 border-blue-200 shadow-lg overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-100/20 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Your Skills</h3>
                <p className="text-sm text-gray-600">Set proficiency level and mark your primary skills</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-md transition-all ${selectedSkills.length >= maxSkills
                  ? "bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse"
                  : "bg-gradient-to-r from-green-400 to-emerald-500 text-white"
                }`}>
                {selectedSkills.length}/{maxSkills}
              </span>
            </div>
          </div>

          {selectedSkills.length > 0 ? (
            <div className="space-y-3">
              {selectedSkills.map((skill) => {
                const profInfo = getProficiencyInfo(skill.proficiency_level);

                return (
                  <div
                    key={skill.skill_name}
                    className={`rounded-xl p-4 border-2 transition-all ${skill.is_primary
                        ? "bg-blue-50 border-primary-light"
                        : "bg-white border-gray-200 hover:border-primary-light"
                      }`}
                  >
                    <div className="flex flex-col gap-3">
                      {/* Skill Name & Emoji */}
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{profInfo.emoji}</span>
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-gray-900">{skill.skill_name}</h4>
                          <p className="text-xs text-gray-500">{profInfo.description}</p>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="space-y-3">
                        {/* Level Slider */}
                        <div className="bg-gray-50 border-2 border-blue-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-gray-700">Skill Level</span>
                            <span className="text-lg font-bold text-primary">{skill.proficiency_level}/5</span>
                          </div>

                          {/* Slider */}
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={skill.proficiency_level}
                            onChange={(e) =>
                              handleUpdateSkill(skill.skill_name, {
                                proficiency_level: parseInt(e.target.value),
                              })
                            }
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                            style={{
                              background: `linear-gradient(to right, rgb(10 102 194) 0%, rgb(10 102 194) ${((skill.proficiency_level - 1) / 4) * 100}%, rgb(229 231 235) ${((skill.proficiency_level - 1) / 4) * 100}%, rgb(229 231 235) 100%)`
                            }}
                          />

                          {/* Level Labels */}
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Beginner</span>
                            <span>Intermediate</span>
                            <span>Advanced</span>
                            <span>Expert</span>
                            <span>Master</span>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill.skill_name)}
                          className="w-full py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-all"
                        >
                          Remove Skill
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-30 animate-pulse"></div>
                <div className="relative w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="h-10 w-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">No Skills Added Yet</h4>
              <p className="text-base text-gray-600 mb-1">Click on skills above to add them</p>
              <p className="text-sm text-gray-400">✨ Build your skill portfolio!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
