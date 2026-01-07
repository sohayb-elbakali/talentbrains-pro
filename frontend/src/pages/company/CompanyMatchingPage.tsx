import { useState } from 'react';
import { useMatchJobToTalents } from "../../hooks/useMatching";
import { MatchScoreCard } from "../../components/matching/MatchScoreCard";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

export const CompanyMatchingPage = () => {
  const [jobId, setJobId] = useState<string>('');
  const [limit, setLimit] = useState<number>(10);
  const [searchTriggered, setSearchTriggered] = useState(false);

  const { data: matches, isLoading, error, refetch } = useMatchJobToTalents(
    searchTriggered ? jobId : '',
    limit
  );

  const handleSearch = () => {
    if (jobId.trim()) {
      setSearchTriggered(true);
      refetch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Matching Talents</h1>
          <p className="mt-2 text-gray-600">
            Discover top talents that match your job requirements
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job ID
              </label>
              <input
                type="text"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="Enter job posting ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limit
              </label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                min="1"
                max="50"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={!jobId.trim() || isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Searching...' : 'Find Matches'}
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">
              Error: {error instanceof Error ? error.message : 'Failed to fetch matches'}
            </p>
          </div>
        )}

        {/* Results */}
        {matches && matches.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Found {matches.length} Matching Talents
              </h2>
              <p className="text-sm text-gray-600">
                Sorted by match score (highest first)
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match, idx) => (
                <MatchScoreCard
                  key={match.talent_id || idx}
                  match={match}
                  type="job"
                  onViewDetails={() => {
                    // Navigate to talent profile
                    window.location.href = `/talents/${match.talent_id}`;
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {searchTriggered && matches && matches.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600">No matching talents found. Try adjusting job requirements.</p>
          </div>
        )}
      </div>
    </div>
  );
};
