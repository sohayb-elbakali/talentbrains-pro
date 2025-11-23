import { useState, useEffect } from "react";
import { Star, X, Plus, Search } from "lucide-react";
import { db } from "../../lib/supabase/index";

interface JobSkill {
    skill_id: string;
    skill_name: string;
    proficiency_level: number;
    is_required: boolean;
}

interface JobSkillsSelectorProps {
    selectedSkills: JobSkill[];
    onChange: (skills: JobSkill[]) => void;
    maxSkills?: number;
}

const PROFICIENCY_LEVELS = [
    { value: 1, label: "Beginner", emoji: "🌱", description: "Just starting out" },
    { value: 2, label: "Intermediate", emoji: "🌿", description: "Some experience" },
    { value: 3, label: "Advanced", emoji: "🌟", description: "Proficient" },
    { value: 4, label: "Expert", emoji: "🔥", description: "Highly skilled" },
    { value: 5, label: "Master", emoji: "👑", description: "Industry expert" },
];

export default function JobSkillsSelector({
    selectedSkills,
    onChange,
    maxSkills = 15,
}: JobSkillsSelectorProps) {
    const [availableSkills, setAvailableSkills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [customSkill, setCustomSkill] = useState("");

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

    const isSkillSelected = (skillName: string) => {
        return selectedSkills.some((s) => s.skill_name === skillName);
    };

    const handleAddSkill = (skillName: string, skillId?: string) => {
        if (!isSkillSelected(skillName) && selectedSkills.length < maxSkills) {
            onChange([
                ...selectedSkills,
                {
                    skill_id: skillId || skillName,
                    skill_name: skillName,
                    proficiency_level: 3,
                    is_required: true,
                },
            ]);
        }
    };

    const handleRemoveSkill = (skillName: string) => {
        onChange(selectedSkills.filter((s) => s.skill_name !== skillName));
    };

    const handleUpdateSkill = (skillName: string, updates: Partial<JobSkill>) => {
        onChange(
            selectedSkills.map((s) =>
                s.skill_name === skillName ? { ...s, ...updates } : s
            )
        );
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

    const getProficiencyInfo = (level: number) => {
        return PROFICIENCY_LEVELS.find((p) => p.value === level) || PROFICIENCY_LEVELS[2];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
                <span className="ml-3 text-gray-600 font-medium">Loading skills...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Search Skills
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Type to search..."
                        className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
            </div>

            {/* Available Skills */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-600 mb-2.5">Available Skills - Click to Add</p>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                    {filteredSkills.length > 0 ? (
                        filteredSkills.map((skill) => (
                            <button
                                key={skill.id}
                                type="button"
                                onClick={() => handleAddSkill(skill.name, skill.id)}
                                disabled={isSkillSelected(skill.name)}
                                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${isSkillSelected(skill.name)
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-white text-primary hover:bg-blue-50 border border-blue-200 hover:border-primary-light"
                                    }`}
                            >
                                {skill.name}
                            </button>
                        ))
                    ) : (
                        <p className="text-xs text-gray-500 italic py-1">
                            No skills found. Try a different search or add a custom skill.
                        </p>
                    )}
                </div>
            </div>

            {/* Add Custom Skill */}
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
                    placeholder="Add custom skill..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    disabled={!customSkill.trim()}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all text-sm flex items-center gap-1.5"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                </button>
            </div>

            {/* Selected Skills */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-600">
                        Selected Skills ({selectedSkills.length}/{maxSkills})
                    </p>
                </div>

                {selectedSkills.length > 0 ? (
                    <div className="space-y-2">
                        {selectedSkills.map((skill) => {
                            const profInfo = getProficiencyInfo(skill.proficiency_level);

                            return (
                                <div
                                    key={skill.skill_name}
                                    className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-primary-light transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Skill Name */}
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span className="text-xl flex-shrink-0">{profInfo.emoji}</span>
                                            <span className="text-sm font-semibold text-gray-900 truncate">{skill.skill_name}</span>
                                        </div>

                                        {/* Controls */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {/* Proficiency Dropdown */}
                                            <select
                                                value={skill.proficiency_level}
                                                onChange={(e) =>
                                                    handleUpdateSkill(skill.skill_name, {
                                                        proficiency_level: parseInt(e.target.value),
                                                    })
                                                }
                                                className="px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                                            >
                                                {PROFICIENCY_LEVELS.map((level) => (
                                                    <option key={level.value} value={level.value}>
                                                        {level.emoji} {level.label}
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Required Toggle */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleUpdateSkill(skill.skill_name, {
                                                        is_required: !skill.is_required,
                                                    })
                                                }
                                                className={`px-2 py-1 rounded text-xs font-bold transition-all ${skill.is_required
                                                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                                                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                                    }`}
                                                title={skill.is_required ? "Required - click to make optional" : "Optional - click to make required"}
                                            >
                                                {skill.is_required ? "Required" : "Optional"}
                                            </button>

                                            {/* Remove Button */}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSkill(skill.skill_name)}
                                                className="flex items-center justify-center w-7 h-7 rounded bg-red-500 hover:bg-red-600 text-white transition-all"
                                                title="Remove skill"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <Star className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-600">No skills added yet</p>
                        <p className="text-xs text-gray-500 mt-1">Search and click skills above to add them</p>
                    </div>
                )}
            </div>
        </div>
    );
}
