import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, DollarSign, MapPin, Users } from 'lucide-react';
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import JobSkillsSelector from "../skills/JobSkillsSelector";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import Select from "../ui/Select";
import Button from "../ui/Button";
import Card from "../ui/Card";

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
      <Card padding="none" className="overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shadow-sm border border-blue-100">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Job Details</h2>
              <p className="text-xs text-slate-600">Basic information about the position</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Job Title */}
          <Input
            label="Job Title"
            {...register("title")}
            error={errors.title?.message}
            placeholder="e.g., Senior Frontend Developer"
          />

          {/* Job Description */}
          <Textarea
            label="Job Description"
            {...register("description")}
            error={errors.description?.message}
            placeholder="Describe the role, responsibilities, requirements, and what makes this position exciting..."
            rows={8}
          />

          {/* Location & Employment Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Location"
              {...register("location")}
              error={errors.location?.message}
              placeholder="San Francisco, CA or Remote"
              leftIcon={<MapPin className="h-4 w-4" />}
            />

            <Select
              label="Employment Type"
              {...register("employment_type")}
              options={employmentTypes}
              error={errors.employment_type?.message}
            />
          </div>
        </div>
      </Card>

      {/* Compensation Section */}
      <Card padding="none" className="overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shadow-sm border border-green-100">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Compensation</h2>
              <p className="text-xs text-slate-600">Annual salary range (optional)</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Minimum Salary"
              type="number"
              {...register("salary_min")}
              error={errors.salary_min?.message}
              placeholder="50,000"
              leftIcon={<span className="text-sm font-medium">$</span>}
            />

            <Input
              label="Maximum Salary"
              type="number"
              {...register("salary_max")}
              error={errors.salary_max?.message}
              placeholder="80,000"
              leftIcon={<span className="text-sm font-medium">$</span>}
            />
          </div>
        </div>
      </Card>

      {/* Skills Section */}
      <Card padding="none" className="overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shadow-sm border border-indigo-100">
              <Briefcase className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Required Skills</h2>
              <p className="text-xs text-slate-600">Add skills needed for this position</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <JobSkillsSelector
            selectedSkills={skills}
            onChange={setSkills}
          />
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          type="submit"
          loading={isSubmitting}
          className="flex-1 sm:flex-none"
        >
          {isEditing ? "Update Job Posting" : "Create Job Posting"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default JobForm;

