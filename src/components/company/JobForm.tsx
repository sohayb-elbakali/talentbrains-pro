import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, DollarSign, MapPin, Users } from 'lucide-react';
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import JobSkillsSelector from "../skills/JobSkillsSelector";

const jobSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(50, "Description must be at least 50 characters"),
    location: z.string().min(1, "Location is required"),
    employment_type: z.enum([
      "full_time",
      "part_time",
      "contract",
      "freelance",
      "internship",
    ]),
    salary_min: z.coerce.number().optional(),
    salary_max: z.coerce.number().optional(),
  })
  .refine(
    (data) =>
      !data.salary_min ||
      !data.salary_max ||
      data.salary_max >= data.salary_min,
    {
      message: "Maximum salary must be greater than or equal to minimum salary",
      path: ["salary_max"],
    }
  );

type JobFormData = z.infer<typeof jobSchema>;

interface JobFormProps {
  initialValues?: Partial<JobFormData>;
  initialSkills?: any[];
  onSubmit: (data: any) => void;
  isEditing?: boolean;
}

const JobForm: React.FC<JobFormProps> = ({
  initialValues,
  initialSkills,
  onSubmit,
  isEditing = false
}) => {
  const [skills, setSkills] = useState<any[]>(initialSkills || []);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      location: "",
      employment_type: "full_time",
      salary_min: undefined,
      salary_max: undefined,
      ...initialValues,
    },
  });

  useEffect(() => {
    if (initialValues) {
      reset({
        title: "",
        description: "",
        location: "",
        employment_type: "full_time",
        salary_min: undefined,
        salary_max: undefined,
        ...initialValues,
      });
    }
  }, [initialValues, reset]);

  const handleFormSubmit = (formData: JobFormData) => {
    onSubmit({ formData, skills });
  };

  const employmentTypes = [
    { value: "full_time", label: "Full Time" },
    { value: "part_time", label: "Part Time" },
    { value: "contract", label: "Contract" },
    { value: "freelance", label: "Freelance" },
    { value: "internship", label: "Internship" },
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Job Details Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Briefcase className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Job Details</h2>
              <p className="text-xs text-gray-600">Basic information about the position</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Job Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              {...register("title")}
              className={`w-full px-4 py-2.5 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              placeholder="e.g., Senior Frontend Developer"
            />
            {errors.title && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <span>⚠</span> {errors.title.message}
              </p>
            )}
          </div>

          {/* Job Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              {...register("description")}
              rows={8}
              className={`w-full px-4 py-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none ${
                errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              placeholder="Describe the role, responsibilities, requirements, and what makes this position exciting..."
            />
            {errors.description && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <span>⚠</span> {errors.description.message}
              </p>
            )}
          </div>

          {/* Location & Employment Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="location"
                  type="text"
                  {...register("location")}
                  className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                    errors.location ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="San Francisco, CA or Remote"
                />
              </div>
              {errors.location && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span> {errors.location.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="employment_type" className="block text-sm font-semibold text-gray-700 mb-2">
                Employment Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <select
                  id="employment_type"
                  {...register("employment_type")}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 hover:border-gray-300 transition-all appearance-none bg-white cursor-pointer"
                >
                  {employmentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compensation Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Compensation</h2>
              <p className="text-xs text-gray-600">Annual salary range (optional)</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="salary_min" className="block text-sm font-semibold text-gray-700 mb-2">
                Minimum Salary
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500">$</span>
                <input
                  id="salary_min"
                  type="number"
                  {...register("salary_min")}
                  className={`w-full pl-8 pr-4 py-2.5 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                    errors.salary_min ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="50,000"
                />
              </div>
              {errors.salary_min && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span> {errors.salary_min.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="salary_max" className="block text-sm font-semibold text-gray-700 mb-2">
                Maximum Salary
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500">$</span>
                <input
                  id="salary_max"
                  type="number"
                  {...register("salary_max")}
                  className={`w-full pl-8 pr-4 py-2.5 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                    errors.salary_max ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="80,000"
                />
              </div>
              {errors.salary_max && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span> {errors.salary_max.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skills Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Required Skills</h2>
              <p className="text-xs text-gray-600">Add skills needed for this position</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <JobSkillsSelector
            selectedSkills={skills}
            onChange={setSkills}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex-1 sm:flex-none"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>{isEditing ? "Updating..." : "Creating..."}</span>
            </>
          ) : (
            <span>{isEditing ? "Update Job Posting" : "Create Job Posting"}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default JobForm;
