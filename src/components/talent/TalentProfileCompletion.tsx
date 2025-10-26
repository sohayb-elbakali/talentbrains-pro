import { motion } from 'framer-motion';
import { Briefcase, DollarSign, MapPin, User, FileText, Award } from 'lucide-react';
import { useState } from 'react';
import { notificationManager } from '../../utils/notificationManager';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/supabase';
import SkillsSelector from '../skills/SkillsSelector';

interface FormData {
  title: string;
  bio: string;
  location: string;
  experience_level: string;
  years_of_experience: number;
  availability_status: string;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  salary_expectation_min?: number;
  salary_expectation_max?: number;
  portfolio_url?: string;
  linkedin_url?: string;
  github_url?: string;
}

export default function TalentProfileCompletion() {
  const { user, checkProfileCompletion } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    bio: '',
    location: '',
    experience_level: 'intermediate',
    years_of_experience: 0,
    availability_status: 'available',
    hourly_rate_min: undefined,
    hourly_rate_max: undefined,
    salary_expectation_min: undefined,
    salary_expectation_max: undefined,
    portfolio_url: '',
    linkedin_url: '',
    github_url: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('rate') || name.includes('salary') || name === 'years_of_experience'
        ? value === '' ? undefined : Number(value)
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { data: existingTalent } = await db.getTalent(user.id);

      const talentData = {
        ...formData,
        hourly_rate_min: formData.hourly_rate_min || null,
        hourly_rate_max: formData.hourly_rate_max || null,
        salary_expectation_min: formData.salary_expectation_min || null,
        salary_expectation_max: formData.salary_expectation_max || null,
        portfolio_url: formData.portfolio_url || null,
        linkedin_url: formData.linkedin_url || null,
        github_url: formData.github_url || null,
      };

      let result;
      if (existingTalent) {
        result = await db.updateTalent(existingTalent.id, talentData);
      } else {
        result = await db.createTalent({
          profile_id: user.id,
          ...talentData,
        });
      }

      if (result.error) throw result.error;

      if (skills.length > 0 && result.data) {
        await db.removeTalentSkills(result.data.id);
        for (const skill of skills) {
          await db.addTalentSkill(
            result.data.id,
            skill.skill_id,
            skill.proficiency_level,
            skill.years_of_experience || 0,
            skill.is_primary || false
          );
        }
      }

      await checkProfileCompletion(true);
      toast.success('Profile completed successfully!');
      navigate('/talent');
    } catch (error) {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const experienceLevels = [
    { value: 'entry', label: 'Entry Level (0-2 years)' },
    { value: 'intermediate', label: 'Intermediate (2-5 years)' },
    { value: 'senior', label: 'Senior (5-10 years)' },
    { value: 'expert', label: 'Expert (10+ years)' },
  ];

  const availabilityStatuses = [
    { value: 'available', label: 'Available Now' },
    { value: 'open', label: 'Open to Opportunities' },
    { value: 'not_looking', label: 'Not Looking' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Complete Your Profile</h1>
          <p className="text-lg text-gray-600">Let's set up your talent profile to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-xl">
                <User className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
                <p className="text-sm text-gray-600">Tell us about yourself</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="label">
                  Professional Title
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="e.g., Full Stack Developer"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="label">
                  Bio
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    id="bio"
                    name="bio"
                    required
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="input-field pl-10"
                    placeholder="Tell us about your experience and what you're looking for..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="location" className="label">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="location"
                      name="location"
                      type="text"
                      required
                      value={formData.location}
                      onChange={handleChange}
                      className="input-field pl-10"
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="availability_status" className="label">
                    Availability
                  </label>
                  <select
                    id="availability_status"
                    name="availability_status"
                    required
                    value={formData.availability_status}
                    onChange={handleChange}
                    className="input-field"
                  >
                    {availabilityStatuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Experience</h2>
                <p className="text-sm text-gray-600">Your professional background</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="experience_level" className="label">
                  Experience Level
                </label>
                <select
                  id="experience_level"
                  name="experience_level"
                  required
                  value={formData.experience_level}
                  onChange={handleChange}
                  className="input-field"
                >
                  {experienceLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="years_of_experience" className="label">
                  Years of Experience
                </label>
                <input
                  id="years_of_experience"
                  name="years_of_experience"
                  type="number"
                  required
                  min="0"
                  value={formData.years_of_experience}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="5"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Compensation</h2>
                <p className="text-sm text-gray-600">Your rate expectations (optional)</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="hourly_rate_min" className="label">
                    Min Hourly Rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      id="hourly_rate_min"
                      name="hourly_rate_min"
                      type="number"
                      value={formData.hourly_rate_min || ''}
                      onChange={handleChange}
                      className="input-field pl-8"
                      placeholder="50"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="hourly_rate_max" className="label">
                    Max Hourly Rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      id="hourly_rate_max"
                      name="hourly_rate_max"
                      type="number"
                      value={formData.hourly_rate_max || ''}
                      onChange={handleChange}
                      className="input-field pl-8"
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="salary_expectation_min" className="label">
                    Min Annual Salary
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      id="salary_expectation_min"
                      name="salary_expectation_min"
                      type="number"
                      value={formData.salary_expectation_min || ''}
                      onChange={handleChange}
                      className="input-field pl-8"
                      placeholder="80000"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="salary_expectation_max" className="label">
                    Max Annual Salary
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      id="salary_expectation_max"
                      name="salary_expectation_max"
                      type="number"
                      value={formData.salary_expectation_max || ''}
                      onChange={handleChange}
                      className="input-field pl-8"
                      placeholder="120000"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Your Skills</h2>
            <SkillsSelector
              type="talent"
              selectedSkills={skills}
              onChange={setSkills}
            />
          </div>

          <div className="flex items-center gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                'Complete Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
