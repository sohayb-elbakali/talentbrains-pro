import { motion } from 'framer-motion';
import React from 'react';
import { notificationManager } from "../../utils/notificationManager";
import { useNavigate } from "react-router-dom";
import JobForm from '../../components/company/JobForm';
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../lib/supabase/index";
import { Briefcase } from 'lucide-react';

const CreateJobPage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    if (!user || !profile) {
      notificationManager.showError("You must be signed in as a company to post a job.");
      return;
    }
    if (profile.role !== "company") {
      notificationManager.showError("Only company accounts can post jobs.");
      return;
    }
    // Look up the company_id from the companies table using the user's profile id
    const { data: company, error: companyError } = await db.getCompany(user.id);
    if (!company || companyError) {
      console.error("Company lookup error:", companyError);
      notificationManager.showError(
        "Could not find your company profile. Please complete your company profile first."
      );
      return;
    }

    console.log("Creating job for company:", company.id, "User:", user.id);

    // Compose job data with the correct company_id
    const jobData = {
      ...data.formData,
      company_id: company.id, // Use the real company id
      status: "active", // or 'draft' if you want
    };

    console.log("Job data to create:", jobData);

    const { data: createdJob, error } = await db.createJob(jobData);
    if (error) {
      console.error("Job creation error:", error);
      notificationManager.showError(error.message || "Failed to create job");
      return;
    }

    // Save skills if any
    if (createdJob && data.skills && data.skills.length > 0) {
      for (const skill of data.skills) {
        try {
          await db.addJobSkill(
            createdJob.id,
            skill.skill_id,
            skill.proficiency_level || 3,
            skill.is_required !== undefined ? skill.is_required : true
          );
        } catch (skillError) {
          // Continue with other skills even if one fails
        }
      }
    }

    notificationManager.showSuccess("Job posted successfully!");
    navigate("/company/jobs");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
                Create a New Job Posting
              </h1>
              <p className="text-gray-600 text-lg mt-1">
                Fill out the details below to find your next great hire
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <JobForm onSubmit={handleSubmit} />
        </motion.div>
      </div>
    </div>
  );
};

export default CreateJobPage;
