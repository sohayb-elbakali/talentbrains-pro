import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
                await db.removeJobSkills(jobId!);

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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading job details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="max-w-md mx-auto p-6">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <p className="text-red-800 font-medium">{error}</p>
                        <button
                            onClick={() => navigate("/company/jobs")}
                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Back to Jobs
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate(`/company/jobs/${jobId}`)}
                    className="mb-6 flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm font-medium">Back to Job Details</span>
                </button>

                {/* Page Header */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                            <Briefcase className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Edit Job Posting</h1>
                            <p className="text-gray-500 text-sm mt-0.5">
                                Update the details for {job?.title}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Job Form */}
                <JobForm
                    initialValues={job}
                    initialSkills={jobSkills}
                    onSubmit={handleSubmit}
                    isEditing={true}
                />
            </div>
        </div>
    );
}

