import { useMatchingStats } from '../../hooks/useMatching';

export const MatchingStatsWidget = () => {
  const { data: stats, isLoading } = useMatchingStats();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
      <h3 className="text-lg font-semibold mb-4">Matching System</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-blue-100 text-sm">Total Talents</p>
          <p className="text-3xl font-bold">{stats.total_talents}</p>
        </div>
        <div>
          <p className="text-blue-100 text-sm">Total Jobs</p>
          <p className="text-3xl font-bold">{stats.total_jobs}</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-blue-400">
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-100">Status</span>
          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
            {stats.status}
          </span>
        </div>
      </div>
    </div>
  );
};
