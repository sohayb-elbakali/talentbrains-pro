import { motion } from 'framer-motion';
import { ArrowLeft, Award, Briefcase, Calendar, DollarSign, Globe, GraduationCap, Languages, MapPin, Mail, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../lib/supabase';
import SkillsDisplay from '../components/skills/SkillsDisplay';

export default function TalentPublicProfilePage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const [talent, setTalent] = useState<any>(null);
  const [talentSkills, setTalentSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTalentProfile = async () => {
      if (!profileId) return;

      try {
        setLoading(true);
        
        const { data: talentData } = await db.getTalent(profileId);
        
        if (talentData) {
          const { data: profileData } = await db.getProfile(profileId);
          
          setTalent({
            ...talentData,
            profile: profileData || talentData.profile
          });
          
          const { data: skillsData } = await db.getTalentSkills(talentData.id);
          setTalentSkills(skillsData || []);
        }
      } catch (error) {
        // Handle error
      } finally {
        setLoading(false);
      }
    };

    fetchTalentProfile();
  }, [profileId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!talent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
          <button onClick={() => navigate('/talents')} className="btn btn-primary">
            Back to Talents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/talents')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Talents
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 h-48">
            <div className="absolute inset-0 bg-black opacity-10"></div>
          </div>

          <div className="px-8 pb-8 -mt-20 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 mb-8">
              <div className="relative flex-shrink-0">
                <img
                  src={talent.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${talent.profile?.full_name}`}
                  alt={talent.profile?.full_name}
                  className="w-40 h-40 rounded-2xl object-cover border-4 border-white shadow-xl"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(talent.profile?.full_name || 'User')}&background=8B5CF6&color=fff&size=256&bold=true`;
                  }}
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full"></div>
              </div>

              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{talent.profile?.full_name}</h1>
                <p className="text-xl text-purple-600 font-semibold mb-4">{talent.title}</p>
                
                <div className="flex flex-wrap items-center gap-4">
                  {talent.location && (
                    <span className="flex items-center text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                      <MapPin size={18} className="mr-2 text-blue-500" />
                      {talent.location}
                    </span>
                  )}
                  {talent.hourly_rate_min && talent.hourly_rate_max && (
                    <span className="flex items-center font-semibold text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                      <DollarSign size={18} className="mr-2" />
                      ${talent.hourly_rate_min}-${talent.hourly_rate_max}/hr
                    </span>
                  )}
                  {talent.availability_status && (
                    <span className={`px-3 py-2 rounded-lg text-sm font-medium capitalize ${
                      talent.availability_status === 'available' ? 'bg-green-100 text-green-700' :
                      talent.availability_status === 'busy' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {talent.availability_status}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                  <Mail size={18} />
                  Contact
                </button>
                <button className="px-6 py-3 bg-white text-purple-600 border-2 border-purple-200 rounded-xl font-semibold hover:bg-purple-50 transition-all flex items-center gap-2">
                  <MessageCircle size={18} />
                  Message
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {talent.bio && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                      <Briefcase size={24} className="mr-3 text-purple-600" />
                      About
                    </h2>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-xl">{talent.bio}</p>
                  </div>
                )}

                {talentSkills.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                      <Award size={24} className="mr-3 text-purple-600" />
                      Skills & Expertise
                    </h2>
                    <SkillsDisplay skills={talentSkills} />
                  </div>
                )}

                {talent.education && talent.education.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                      <GraduationCap size={24} className="mr-3 text-purple-600" />
                      Education
                    </h2>
                    <div className="space-y-4">
                      {talent.education.map((edu: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-6 rounded-xl">
                          <h3 className="font-bold text-lg text-gray-900">{edu.degree}</h3>
                          <p className="text-purple-600 font-medium">{edu.institution}</p>
                          {edu.year && <p className="text-gray-600 text-sm mt-1">{edu.year}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {talent.certifications && talent.certifications.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                      <Award size={24} className="mr-3 text-purple-600" />
                      Certifications
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {talent.certifications.map((cert: any, index: number) => (
                        <span key={index} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium border border-blue-200">
                          {cert.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {talent.languages && talent.languages.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                      <Languages size={24} className="mr-3 text-purple-600" />
                      Languages
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {(Array.isArray(talent.languages) ? talent.languages : []).map((lang: string, index: number) => (
                        <span key={index} className="bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-medium">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border-2 border-purple-100">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        <Calendar size={18} className="mr-2 text-purple-600" />
                        Experience
                      </span>
                      <span className="font-bold text-gray-900">{talent.years_of_experience}+ years</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        <Award size={18} className="mr-2 text-purple-600" />
                        Level
                      </span>
                      <span className="font-bold text-gray-900 capitalize">{talent.experience_level}</span>
                    </div>
                    {talent.remote_preference !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <Globe size={18} className="mr-2 text-purple-600" />
                          Work Style
                        </span>
                        <span className="font-bold text-gray-900">{talent.remote_preference ? 'Remote' : 'On-site'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {talent.portfolio_url && (
                  <div className="bg-white p-6 rounded-xl border-2 border-gray-100">
                    <h3 className="font-bold text-lg text-gray-900 mb-3">Portfolio</h3>
                    <a
                      href={talent.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
                    >
                      <Globe size={18} />
                      View Portfolio
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
