import { Medal, Funnel, Heart, MapPin, ChatCircle, MagnifyingGlass } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TalentWithProfile } from '../../types/talent';
import { db } from "../../lib/supabase/index";
import LoadingSpinner from "../ui/LoadingSpinner";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function TalentProfiles() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [talents, setTalents] = useState<TalentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const handleViewProfile = (talentId: string) => {
    navigate(`/talents/${talentId}`);
  };

  // Fetch talents from database
  const fetchTalents = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentPage = reset ? 0 : page;
      const limit = 12;
      const offset = currentPage * limit;

      // Build filters based on selected filter
      const filters: any = { limit, offset };

      switch (selectedFilter) {
        case 'available':
          filters.availability_status = 'available';
          break;
        case 'remote':
          filters.remote_preference = true;
          break;
        case 'senior':
          filters.experience_level = 'senior';
          break;
        case 'mid':
          filters.experience_level = 'mid';
          break;
      }

      const { data, error: fetchError } = await db.getTalents(filters);

      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to fetch talents');
      }

      const newTalents = data || [];

      if (reset) {
        setTalents(newTalents);
        setPage(1);
      } else {
        setTalents(prev => [...prev, ...newTalents]);
        setPage(prev => prev + 1);
      }

      setHasMore(newTalents.length === limit);
    } catch (err: any) {
      setError(err.message || 'Failed to load talents');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTalents(true);
  }, [selectedFilter]);

  // Helper function to format hourly rate
  const formatHourlyRate = (talent: TalentWithProfile) => {
    if (talent.hourly_rate_min && talent.hourly_rate_max) {
      if (talent.hourly_rate_min === talent.hourly_rate_max) {
        return `$${talent.hourly_rate_min}`;
      }
      return `$${talent.hourly_rate_min}-$${talent.hourly_rate_max}`;
    }
    if (talent.hourly_rate_min) return `$${talent.hourly_rate_min}+`;
    if (talent.hourly_rate_max) return `Up to $${talent.hourly_rate_max}`;
    return 'Rate negotiable';
  };

  // Helper function to get experience display
  const getExperienceDisplay = (talent: TalentWithProfile) => {
    const level = talent.experience_level;
    const years = talent.years_of_experience;
    return `${level.charAt(0).toUpperCase() + level.slice(1)} (${years}+ years)`;
  };

  // Helper function to get skills array
  const getSkills = (talent: TalentWithProfile) => {
    return talent.talent_skills?.map(ts => ts.skill.name) || [];
  };

  const filters = [
    { id: 'all', label: 'All Talents' },
    { id: 'available', label: 'Available Now' },
    { id: 'remote', label: 'Remote Preferred' },
    { id: 'senior', label: 'Senior Level' },
    { id: 'mid', label: 'Mid Level' }
  ];

  const filteredTalents = talents.filter(talent => {
    if (!searchTerm) return true;

    const skills = getSkills(talent);
    const matchesSearch =
      talent.profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      talent.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (talent.location && talent.location.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-700 bg-green-100';
      case 'busy':
        return 'text-orange-700 bg-orange-100';
      case 'unavailable':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-slate-600 bg-slate-100';
    }
  };

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'senior':
      case 'lead':
        return 'text-primary bg-blue-100';
      case 'mid':
        return 'text-slate-700 bg-slate-100';
      case 'entry':
        return 'text-slate-600 bg-slate-100';
      default:
        return 'text-slate-600 bg-slate-100';
    }
  };

  return (
    <>
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Search and Filters */}
          <div className="mb-8 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Search talents, skills, or roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<MagnifyingGlass size={20} weight="regular" />}
                className="py-3"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pl-4 lg:pl-0">
              <Funnel size={20} weight="regular" className="text-slate-400 flex-shrink-0" />
              {filters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={selectedFilter === filter.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter(filter.id)}
                  className="whitespace-nowrap"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading && talents.length === 0 && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner text="Loading talents..." />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12 bg-white rounded-2xl border border-red-200">
              <p className="text-red-600 font-semibold">Error: {error}</p>
              <Button
                variant="danger"
                onClick={() => fetchTalents(true)}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Talent Results Count */}
          {!loading && !error && (
            <div className="mb-6">
              <p className="text-slate-600">
                Showing <span className="font-semibold">{filteredTalents.length}</span> talents
                {searchTerm && (
                  <span> for "<span className="font-semibold">{searchTerm}</span>"</span>
                )}
              </p>
            </div>
          )}

          {/* Talent Grid */}
          {!loading && !error && (
            <>
              {filteredTalents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTalents.map((talent) => {
                    const skills = getSkills(talent);
                    return (
                      <div
                        key={talent.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-primary transition-all duration-200"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={talent.profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${talent.profile.full_name}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                                alt={talent.profile.full_name}
                                className="w-14 h-14 rounded-full object-cover border-2 border-slate-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(talent.profile.full_name)}&background=0a66c2&color=fff&size=128&bold=true`;
                                }}
                              />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{talent.profile.full_name}</h3>
                              <p className="text-sm text-slate-600">{talent.title}</p>
                            </div>
                          </div>
                          <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                            <Heart size={20} weight="regular" />
                          </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Medal size={16} weight="regular" className="text-primary" />
                              <span className="font-semibold text-slate-900">{talent.years_of_experience}</span>
                            </div>
                            <p className="text-xs text-slate-600">Years Exp</p>
                          </div>
                          <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <MapPin size={16} weight="regular" className="text-primary" />
                              <span className="font-semibold text-slate-900 text-xs">
                                {talent.remote_preference ? 'Remote' : 'On-site'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">Work Style</p>
                          </div>
                        </div>

                        {/* Bio */}
                        <p className="text-sm text-slate-600 mb-4 leading-relaxed line-clamp-3">
                          {talent.bio || 'Experienced professional ready to contribute to your team.'}
                        </p>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-slate-50 text-slate-700 text-xs rounded-lg border border-slate-200"
                            >
                              {skill}
                            </span>
                          ))}
                          {skills.length > 3 && (
                            <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded-lg">
                              +{skills.length - 3} more
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="space-y-2 mb-4">
                          {talent.location && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500">Location:</span>
                              <div className="flex items-center gap-1">
                                <MapPin size={16} weight="regular" className="text-slate-400" />
                                <span className="text-slate-900">{talent.location}</span>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Rate:</span>
                            <span className="font-semibold text-slate-900">{formatHourlyRate(talent)}/hour</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Experience:</span>
                            <span className="text-slate-900">{getExperienceDisplay(talent)}</span>
                          </div>
                        </div>

                        {/* Status and Experience Level */}
                        <div className="flex items-center justify-between mb-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getAvailabilityColor(talent.availability_status)}`}>
                            {talent.availability_status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getExperienceColor(talent.experience_level)}`}>
                            {talent.experience_level} Level
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleViewProfile(talent.id)}
                            fullWidth
                            className="bg-primary hover:bg-blue-700"
                          >
                            View Profile
                          </Button>
                          <Button
                            variant="outline"
                            icon={<ChatCircle size={20} weight="regular" />}
                            className="px-3"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-200">
                  <div className="text-slate-400 mb-4">
                    <MagnifyingGlass size={48} weight="regular" className="mx-auto" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {searchTerm ? 'No talents found' : 'No talents available yet'}
                  </h2>
                  <p className="text-slate-500 mb-6">
                    {searchTerm
                      ? 'Try adjusting your search terms or filters'
                      : 'We\'re building our talent network. Check back soon for amazing professionals!'
                    }
                  </p>
                  {searchTerm && (
                    <Button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedFilter('all');
                      }}
                      className="inline-flex"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Load More */}
          {!loading && !error && hasMore && filteredTalents.length > 0 && (
            <div className="text-center mt-12">
              <Button
                variant="outline"
                size="lg"
                onClick={() => fetchTalents(false)}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More Talents'}
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}