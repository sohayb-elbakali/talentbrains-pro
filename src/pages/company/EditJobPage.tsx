import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { db } from "../../lib/supabase/index";
import JobForm from "../../components/company/JobForm";
import { notify } from "../../utils/notify";
import { Briefcase, ArrowLeft } from "lucide-react";

export default function EditJobPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<any>(null);
    const [jobSkills, setJobSkills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (jobId) {
            loadJob();
        }
    }, [jobId]);

    const loadJob = async () => {
        try {
            setLoading(true);
            const { data, error } = await db.getJob(jobId!);

            if (error) {
                setError(error.message || "Failed to load job");
                return;
            }

            setJob(data);

            // Load job skills
            const { data: skillsData } = await db.getJobSkills(jobId!);
            if (skillsData) {
                // Transform skills to match the expected format
                const transformedSkills = skillsData.map((item: any) => ({
                    skill_id: item.skill?.id || item.skill_id,
                    skill_name: item.skill?.name || item.skill_name,
                    proficiency_level: item.proficiency_level || 3,
                    is_required: item.is_required !== undefined ? item.is_required : true,
                }));
                setJobSkills(transformedSkills);
            }
        } catch (err: any) {
            setError(err.message || "Failed to load job");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: any) => {
        try {
            const { error } = await db.updateJob(jobId!, data.formData);

            if (error) {
                notify.showError(error.message || "Failed to update job");
                return;
            }

            // Update skills
            if (data.skills) {
                // Remove existing skills
                await db.removeJobSkills(jobId!);

                // Add new skills
                for (const skill of data.skills) {
                    try {
                        await db.addJobSkill(
                            jobId!,
                            skill.skill_id,
                            skill.proficiency_level || 3,
                            skill.is_required !== undefined ? skill.is_required : true
                        );
                    } catch (skillError) {
                        // Silently handle skill addition errors
                    }
                }
            }

            notify.showSuccess("Job updated successfully!");
            navigate(`/company/jobs/${jobId}`);
        } catch (err: any) {
            notify.showError(err.message || "Failed to update job");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading job details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
                <div className="max-w-md mx-auto p-6">
                    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 shadow-lg">
                        <p className="text-red-800 font-semibold">{error}</p>
                        <button
                            onClick={() => navigate("/company/jobs")}
                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all"
                        >
                            Back to Jobs
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <button
                    onClick={() => navigate(`/company/jobs/${jobId}`)}
                    className="mb-6 flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors group"
                >
                    <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Back to Job Details</span>
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-400 rounded-2xl blur opacity-30"></div>
                            <div className="relative w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center border-2 border-white shadow-lg">
                                <Briefcase className="h-8 w-8 text-purple-600" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Edit Job Posting
                            </h1>
                            <p className="text-gray-600 text-lg mt-1">
                                Update the details for {job?.title}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <JobForm
                        initialValues={job}
                        initialSkills={jobSkills}
                        onSubmit={handleSubmit}
                        isEditing={true}
                    />
                </motion.div>
            </div>
        </div>
    );
}
