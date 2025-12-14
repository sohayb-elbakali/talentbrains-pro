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
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Star className="h-6 w-6 text-primary" />
                        {type === 'talent' ? 'My Skills' : 'Required Skills'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {type === 'talent'
                            ? 'Add skills to showcase your expertise'
                            : 'Specify skills required for this position'}
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-primary-hover transition-all flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Add Skill
                </button>
            </div>

            {/* Skills List */}
            {loading ? (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-gray-500 mt-2">Loading skills...</p>
                </div>
            ) : userSkills.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No skills added yet</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-4 text-primary hover:text-primary-hover font-semibold"
                    >
                        Add your first skill
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userSkills.map((userSkill, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-blue-50 rounded-xl p-4 border border-blue-100"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                        {userSkill.skill.name}
                                        {userSkill.is_primary && (
                                            <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                                                Primary
                                            </span>
                                        )}
                                        {userSkill.is_required && (
                                            <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                                                Required
                                            </span>
                                        )}
                                    </h4>
                                    <p className="text-xs text-gray-500">{userSkill.skill.category}</p>
                                </div>
                                <button className="p-1 hover:bg-red-100 rounded-lg transition-colors">
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <div>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-gray-600">Proficiency</span>
                                        <span className="font-semibold text-primary">
                                            {getProficiencyLabel(userSkill.proficiency_level)}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary to-primary-hover"
                                            style={{ width: `${(userSkill.proficiency_level / 5) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {type === 'talent' && userSkill.years_of_experience !== undefined && (
                                    <p className="text-sm text-gray-600">
                                        <span className="font-semibold">{userSkill.years_of_experience}</span> years experience
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Add Skill Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                    >
                        <div className="bg-primary p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white">Add New Skill</h3>
                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        resetForm();
                                    }}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <X className="h-5 w-5 text-white" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Search Skills */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Search & Select Skill
                                </label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search skills..."
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary-light transition-all"
                                />
                            </div>

                            {/* Skills List */}
                            <div className="max-h-48 overflow-y-auto border-2 border-gray-200 rounded-xl p-2">
                                {filteredSkills.length === 0 ? (
                                    <p className="text-center text-gray-500 py-4">No skills found</p>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredSkills.map((skill) => (
                                            <button
                                                key={skill.id}
                                                onClick={() => setSelectedSkill(skill.id)}
                                                className={`w-full text-left px-3 py-2 rounded-lg transition-all ${selectedSkill === skill.id
                                                    ? 'bg-blue-100 border-2 border-primary'
                                                    : 'hover:bg-gray-100'
                                                    }`}
                                            >
                                                <p className="font-semibold text-gray-900">{skill.name}</p>
                                                <p className="text-xs text-gray-500">{skill.category}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Proficiency Level */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Proficiency Level: {getProficiencyLabel(proficiencyLevel)}
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={proficiencyLevel}
                                    onChange={(e) => setProficiencyLevel(Number(e.target.value))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>Beginner</span>
                                    <span>Master</span>
                                </div>
                            </div>

                            {/* Talent-specific fields */}
                            {type === 'talent' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Years of Experience
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="50"
                                            value={yearsOfExperience}
                                            onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary-light transition-all"
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isPrimary}
                                            onChange={(e) => setIsPrimary(e.target.checked)}
                                            className="w-5 h-5 text-primary border-2 border-gray-300 rounded focus:ring-2 focus:ring-primary"
                                        />
                                        <span className="text-sm font-medium text-gray-700">
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
                                        className="w-5 h-5 text-primary border-2 border-gray-300 rounded focus:ring-2 focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Required skill (must-have)
                                    </span>
                                </label>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddSkill}
                                    disabled={!selectedSkill}
                                    className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
