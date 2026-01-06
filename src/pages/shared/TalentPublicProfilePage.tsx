import {
    ArrowLeft, Briefcase, Calendar, CheckCircle, MapPin, User,
    GlobeSimple, LinkedinLogo, GithubLogo, Star, Envelope, Download
} from '@phosphor-icons/react';
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase/client";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import SkillsDisplay from "../../components/skills/SkillsDisplay";

interface TalentProfile {
    id: string;
    title: string;
    bio: string;
    location: string;
    experience_level: string;
    years_of_experience: number;
    availability_status: string;
    portfolio_url?: string;
    linkedin_url?: string;
    github_url?: string;
    resume_url?: string;
    profile: {
        full_name: string;
        email: string;
        avatar_url: string | null;
    };
}

const TalentPublicProfilePage = () => {
    const { talentId } = useParams<{ talentId: string }>();
    const navigate = useNavigate();
    const [talent, setTalent] = useState<TalentProfile | null>(null);
    const [skills, setSkills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!talentId) return;

        const fetchTalent = async () => {
            try {
                setLoading(true);

                // Fetch talent profile
                const { data, error: fetchError } = await supabase
                    .from('talents')
                    .select(`
            id,
            title,
            bio,
            location,
            experience_level,
            years_of_experience,
            availability_status,
            portfolio_url,
            linkedin_url,
            github_url,
            resume_url,
            profile:profiles(full_name, email, avatar_url)
          `)
                    .eq('id', talentId)
                    .single();

                if (fetchError) throw new Error(fetchError.message);
                if (!data) throw new Error("Talent not found");

                setTalent(data);

                // Fetch skills
                const { data: skillsData } = await supabase
                    .from('talent_skills')
                    .select(`
            id,
            proficiency_level,
            skill:skills(id, name, category)
          `)
                    .eq('talent_id', talentId);

                if (skillsData) {
                    setSkills(skillsData.map((s: any) => ({
                        ...s,
                        skill_name: s.skill?.name,
                        name: s.skill?.name,
                        category: s.skill?.category,
                    })));
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTalent();
    }, [talentId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <LoadingSpinner size="lg" text="Loading profile..." />
            </div>
        );
    }

    if (error || !talent) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-md">
                    <User size={48} className="text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Profile Not Found</h2>
                    <p className="text-slate-500 mb-4">{error || "This talent profile doesn't exist."}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        ← Go Back
                    </button>
                </div>
            </div>
        );
    }

    const getAvailabilityColor = (status: string) => {
        const colors: Record<string, string> = {
            available: 'bg-green-100 text-green-700',
            open_to_offers: 'bg-blue-100 text-blue-700',
            not_available: 'bg-slate-100 text-slate-600',
        };
        return colors[status] || colors.available;
    };

    const getExperienceLabel = (level: string) => {
        const labels: Record<string, string> = {
            entry: 'Entry Level',
            mid: 'Mid Level',
            senior: 'Senior',
            lead: 'Lead / Principal',
        };
        return labels[level] || level;
    };

    return (
        <div className="min-h-screen bg-slate-50 py-6">
            <div className="max-w-3xl mx-auto px-4">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-6 transition-colors"
                >
                    <ArrowLeft size={18} weight="bold" />
                    <span className="font-medium">Back</span>
                </button>

                {/* Profile Header */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
                    <div className="flex items-start gap-5">
                        <img
                            src={talent.profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${talent.profile.full_name}&backgroundColor=dbeafe`}
                            alt=""
                            className="w-20 h-20 rounded-2xl object-cover border border-slate-200"
                        />
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-slate-900">{talent.profile.full_name}</h1>
                            <p className="text-blue-600 font-medium text-lg">{talent.title}</p>

                            <div className="flex flex-wrap gap-3 mt-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                                    <MapPin size={16} />
                                    {talent.location}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                                    <Briefcase size={16} />
                                    {getExperienceLabel(talent.experience_level)}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                                    <Calendar size={16} />
                                    {talent.years_of_experience}+ years
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${getAvailabilityColor(talent.availability_status)}`}>
                                    <CheckCircle size={16} weight="fill" />
                                    {talent.availability_status.replace(/_/g, ' ')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* About */}
                {talent.bio && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
                        <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <User size={20} className="text-blue-600" />
                            About
                        </h2>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{talent.bio}</p>
                    </div>
                )}

                {/* Skills */}
                {skills.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
                        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Star size={20} className="text-blue-600" />
                            Skills ({skills.length})
                        </h2>
                        <SkillsDisplay skills={skills} variant="card" showProficiency={true} />
                    </div>
                )}

                {/* Links */}
                {(talent.portfolio_url || talent.linkedin_url || talent.github_url) && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
                        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <GlobeSimple size={20} className="text-blue-600" />
                            Links
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {talent.portfolio_url && (
                                <a
                                    href={talent.portfolio_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
                                >
                                    <GlobeSimple size={18} />
                                    Portfolio
                                </a>
                            )}
                            {talent.linkedin_url && (
                                <a
                                    href={talent.linkedin_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
                                >
                                    <LinkedinLogo size={18} weight="fill" />
                                    LinkedIn
                                </a>
                            )}
                            {talent.github_url && (
                                <a
                                    href={talent.github_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium"
                                >
                                    <GithubLogo size={18} weight="fill" />
                                    GitHub
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Envelope size={20} className="text-blue-600" />
                        Get in Touch
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        <a
                            href={`mailto:${talent.profile.email}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            <Envelope size={18} />
                            Send Email
                        </a>
                        {talent.resume_url && (
                            <a
                                href={talent.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium"
                            >
                                <Download size={18} />
                                Download Resume
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TalentPublicProfilePage;
