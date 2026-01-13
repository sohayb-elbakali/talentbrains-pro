import { motion } from 'framer-motion';
import { Plus, Star, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { notify } from "../../utils/notify";
import { db } from '../../lib/supabase/index';

interface Skill {
    id: string;
    name: string;
    category: string;
}

interface UserSkill {
    skill: Skill;
    proficiency_level: number;
    years_of_experience?: number;
    is_primary?: boolean;
    is_required?: boolean;
}

interface SkillsManagerProps {
    type: 'talent' | 'job';
    entityId: string; // talent_id or job_id
    onSkillsChange?: () => void;
}

export default function SkillsManager({ type, entityId, onSkillsChange }: SkillsManagerProps) {
    const [allSkills, setAllSkills] = useState<Skill[]>([]);
    const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState<string>('');
    const [proficiencyLevel, setProficiencyLevel] = useState(3);
    const [yearsOfExperience, setYearsOfExperience] = useState(1);
    const [isPrimary, setIsPrimary] = useState(false);
    const [isRequired, setIsRequired] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, [entityId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all available skills
            const { data: skillsData, error: skillsError } = await db.getSkills();
            if (skillsError) throw skillsError;
            setAllSkills(skillsData || []);

            // Fetch user's current skills
            if (type === 'talent') {
                const { data: talentSkillsData } = await db.getTalentSkills(entityId);
                // Transform to UserSkill format if needed
                setUserSkills(talentSkillsData || []);
            } else {
                const { data: jobSkillsData } = await db.getJobSkills?.(entityId);
                // Transform to UserSkill format
                setUserSkills(jobSkillsData || []);
            }
        } catch (err) {
            console.error('Error fetching skills:', err);
            notify.showError('Failed to load skills');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = async () => {
        if (!selectedSkill) {
            notify.showError('Please select a skill');
            return;
        }

        try {
            if (type === 'talent') {
                await db.addTalentSkill?.(entityId, selectedSkill, proficiencyLevel, yearsOfExperience, isPrimary);
            } else {
                await db.addJobSkill?.(entityId, selectedSkill, proficiencyLevel, isRequired);
            }

            notify.showSuccess('Skill added successfully!');
            setShowAddModal(false);
            resetForm();
            fetchData();
            onSkillsChange?.();
        } catch (err) {
            console.error('Error adding skill:', err);
            notify.showError('Failed to add skill');
        }
    };

    const resetForm = () => {
        setSelectedSkill('');
        setProficiencyLevel(3);
        setYearsOfExperience(1);
        setIsPrimary(false);
        setIsRequired(false);
        setSearchTerm('');
    };

    const filteredSkills = allSkills.filter(skill =>
        skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getProficiencyLabel = (level: number) => {
        const labels = ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];
        return labels[level] || 'Unknown';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                        <Star className="h-4 w-4 text-primary" />
                        {type === 'talent' ? 'My Skills' : 'Required Skills'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {type === 'talent'
                            ? 'Showcase your expertise'
                            : 'Skills required for this position'}
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md hover:bg-primary-hover transition-all flex items-center gap-1.5"
                >
                    <Plus className="h-4 w-4" />
                    Add
                </button>
            </div>

            {/* Skills List */}
            {loading ? (
                <div className="text-center py-6">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <p className="text-xs text-gray-400 mt-2">Loading skills...</p>
                </div>
            ) : userSkills.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-100">
                    <Star className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No skills added yet</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-2 text-sm text-primary hover:text-primary-hover font-medium"
                    >
                        Add your first skill
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {userSkills.map((userSkill, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-50 rounded-xl p-3 border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group"
                        >
                            <div className="flex items-start justify-between mb-1.5">
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-gray-800 truncate flex items-center gap-1.5">
                                        {userSkill.skill.name}
                                        {userSkill.is_primary && (
                                            <span className="px-1.5 py-0.5 bg-primary text-white text-[10px] rounded-md font-medium flex-shrink-0">
                                                Primary
                                            </span>
                                        )}
                                        {userSkill.is_required && (
                                            <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] rounded-md font-medium flex-shrink-0">
                                                Required
                                            </span>
                                        )}
                                    </h4>
                                    <p className="text-[10px] text-gray-400">{userSkill.skill.category}</p>
                                </div>
                                <button className="p-1 hover:bg-rose-50 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                <div>
                                    <div className="flex items-center justify-between text-[10px] mb-1">
                                        <span className="text-gray-500">Proficiency</span>
                                        <span className="font-semibold text-primary">
                                            {getProficiencyLabel(userSkill.proficiency_level)}
                                        </span>
                                    </div>
                                    {/* Compact star display */}
                                    <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <svg
                                                key={star}
                                                className={`w-3.5 h-3.5 transition-colors ${star <= userSkill.proficiency_level
                                                    ? "text-amber-400 fill-amber-400"
                                                    : "text-gray-300"
                                                    }`}
                                                fill={star <= userSkill.proficiency_level ? "currentColor" : "none"}
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                            </svg>
                                        ))}
                                    </div>
                                </div>

                                {type === 'talent' && userSkill.years_of_experience !== undefined && (
                                    <p className="text-[10px] text-gray-500">
                                        <span className="font-semibold text-gray-700">{userSkill.years_of_experience}</span> years exp.
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Add Skill Modal - Compact Design */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl shadow-xl w-full max-w-sm max-h-[85vh] overflow-y-auto"
                    >
                        <div className="bg-primary px-4 py-3 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-white">Add Skill</h3>
                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        resetForm();
                                    }}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="h-4 w-4 text-white" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            {/* Search Skills */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Search & Select
                                </label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search skills..."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                                />
                            </div>

                            {/* Skills List */}
                            <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2">
                                {filteredSkills.length === 0 ? (
                                    <p className="text-center text-gray-400 text-xs py-3">No skills found</p>
                                ) : (
                                    <div className="space-y-0.5">
                                        {filteredSkills.map((skill) => (
                                            <button
                                                key={skill.id}
                                                onClick={() => setSelectedSkill(skill.id)}
                                                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all text-sm ${selectedSkill === skill.id
                                                    ? 'bg-primary/10 border border-primary'
                                                    : 'hover:bg-gray-50'
                                                    }`}
                                            >
                                                <p className="font-medium text-gray-800 text-sm">{skill.name}</p>
                                                <p className="text-[10px] text-gray-400">{skill.category}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Proficiency Level */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Proficiency: <span className="text-primary">{getProficiencyLabel(proficiencyLevel)}</span>
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={proficiencyLevel}
                                    onChange={(e) => setProficiencyLevel(Number(e.target.value))}
                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                    <span>Beginner</span>
                                    <span>Master</span>
                                </div>
                            </div>

                            {/* Talent-specific fields */}
                            {type === 'talent' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                            Years of Experience
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="50"
                                            value={yearsOfExperience}
                                            onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isPrimary}
                                            onChange={(e) => setIsPrimary(e.target.checked)}
                                            className="w-4 h-4 text-primary border-2 border-gray-300 rounded focus:ring-1 focus:ring-primary"
                                        />
                                        <span className="text-xs font-medium text-gray-600">
                                            Mark as primary skill
                                        </span>
                                    </label>
                                </>
                            )}

                            {/* Job-specific fields */}
                            {type === 'job' && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isRequired}
                                        onChange={(e) => setIsRequired(e.target.checked)}
                                        className="w-4 h-4 text-primary border-2 border-gray-300 rounded focus:ring-1 focus:ring-primary"
                                    />
                                    <span className="text-xs font-medium text-gray-600">
                                        Required skill (must-have)
                                    </span>
                                </label>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddSkill}
                                    disabled={!selectedSkill}
                                    className="flex-1 px-3 py-2 bg-primary text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md hover:bg-primary-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Add Skill
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

