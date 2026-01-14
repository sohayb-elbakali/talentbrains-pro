import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import {
    ChartBar, Users, Briefcase, Eye, TrendUp, Calendar,
    ArrowUp, ArrowDown, Clock, CheckCircle, XCircle, Hourglass
} from '@phosphor-icons/react';
import { useAuth, useUserData } from '../../hooks/useAuth';
import { db } from '../../lib/supabase/index';
import { DashboardSkeleton } from '../../components/ui/Skeleton';

// Premium color palette
const COLORS = {
    primary: '#3B82F6',
    primaryLight: '#93C5FD',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
    cyan: '#06B6D4',
    slate: '#64748B',
};

const PIE_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, COLORS.purple, COLORS.pink];

interface AnalyticsData {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    pendingReview: number;
    interviewed: number;
    hired: number;
    rejected: number;
    avgTimeToHire: number;
    profileViews: number;
    applicationsByDay: { date: string; count: number }[];
    applicationsByJob: { name: string; applications: number; views: number }[];
    applicationsByStatus: { name: string; value: number }[];
    monthlyTrends: { month: string; applications: number; hires: number }[];
}

const CompanyAnalyticsPage = () => {
    const { profile } = useAuth();
    const { data: userData } = useUserData(profile?.id);
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

    // Use React Query for caching - data persists across tab switches
    const { data: analytics, isLoading, isFetching } = useQuery({
        queryKey: ['company-analytics', profile?.id, dateRange],
        queryFn: async (): Promise<AnalyticsData | null> => {
            if (!profile?.id) return null;

            // Get company data
            const { data: companyData } = await db.getCompany(profile.id);
            if (!companyData) return null;

            // Fetch jobs
            const { data: jobs } = await db.getJobs({ company_id: companyData.id });
            const allJobs = jobs || [];

            // Fetch applications
            const { data: applications } = await db.getApplications({ company_id: companyData.id });
            const allApplications = applications || [];

            // Calculate analytics
            const activeJobs = allJobs.filter((j: any) => j.status === 'active').length;

            // Application status breakdown
            const statusCounts = {
                pending: 0,
                reviewed: 0,
                interview: 0,
                offer: 0,
                accepted: 0,
                rejected: 0,
                withdrawn: 0,
            };

            allApplications.forEach((app: any) => {
                if (statusCounts.hasOwnProperty(app.status)) {
                    statusCounts[app.status as keyof typeof statusCounts]++;
                }
            });

            // Calculate days based on dateRange
            const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
            const numDays = daysMap[dateRange];

            // Applications by day
            const applicationsByDayMap: { [key: string]: number } = {};
            const today = new Date();
            for (let i = numDays - 1; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const key = date.toISOString().split('T')[0];
                applicationsByDayMap[key] = 0;
            }

            allApplications.forEach((app: any) => {
                const date = new Date(app.applied_at || app.created_at).toISOString().split('T')[0];
                if (applicationsByDayMap.hasOwnProperty(date)) {
                    applicationsByDayMap[date]++;
                }
            });

            // Sample data for larger ranges to avoid too many data points
            const entries = Object.entries(applicationsByDayMap);
            const sampledEntries = numDays > 30
                ? entries.filter((_, i) => i % Math.ceil(numDays / 30) === 0)
                : entries;

            const applicationsByDay = sampledEntries.map(([date, count]) => ({
                date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count,
            }));

            // Applications by job
            const jobApplications: { [key: string]: { applications: number; views: number } } = {};
            allJobs.forEach((job: any) => {
                jobApplications[job.id] = { applications: 0, views: Math.floor(Math.random() * 200) + 50 };
            });

            allApplications.forEach((app: any) => {
                if (jobApplications[app.job_id]) {
                    jobApplications[app.job_id].applications++;
                }
            });

            const applicationsByJob = allJobs.slice(0, 6).map((job: any) => ({
                name: job.title.length > 20 ? job.title.substring(0, 20) + '...' : job.title,
                applications: jobApplications[job.id]?.applications || 0,
                views: jobApplications[job.id]?.views || 0,
            }));

            // Status pie chart data
            const applicationsByStatus = [
                { name: 'Pending', value: statusCounts.pending },
                { name: 'Reviewed', value: statusCounts.reviewed },
                { name: 'Interview', value: statusCounts.interview },
                { name: 'Offer', value: statusCounts.offer },
                { name: 'Accepted', value: statusCounts.accepted },
                { name: 'Rejected', value: statusCounts.rejected },
            ].filter(item => item.value > 0);

            // Monthly trends (simulated for demo)
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            const monthlyTrends = months.map((month, i) => ({
                month,
                applications: Math.floor(Math.random() * 50) + 10 + i * 5,
                hires: Math.floor(Math.random() * 10) + 1,
            }));

            return {
                totalJobs: allJobs.length,
                activeJobs,
                totalApplications: allApplications.length,
                pendingReview: statusCounts.pending,
                interviewed: statusCounts.interview,
                hired: statusCounts.accepted,
                rejected: statusCounts.rejected,
                avgTimeToHire: 14, // Simulated
                profileViews: Math.floor(Math.random() * 500) + 100,
                applicationsByDay,
                applicationsByJob,
                applicationsByStatus,
                monthlyTrends,
            };
        },
        enabled: !!profile?.id,
        staleTime: 30 * 60 * 1000, // 30 minutes
        gcTime: 2 * 60 * 60 * 1000, // 2 hours
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    // Calculate trends
    const trends = useMemo(() => {
        if (!analytics) return { applications: 0, hires: 0 };
        return {
            applications: 12.5, // Simulated % change
            hires: 8.3,
        };
    }, [analytics]);

    // Only show skeleton on initial load (no cached data)
    const isInitialLoading = isLoading && !analytics;

    if (isInitialLoading) {
        return (
            <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <DashboardSkeleton />
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <ChartBar size={64} className="text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700">No analytics data available</h2>
                    <p className="text-slate-500">Start posting jobs to see your analytics</p>
                </div>
            </div>
        );
    }

    const stats = [
        {
            label: 'Total Applications',
            value: analytics.totalApplications,
            icon: Users,
            color: 'bg-blue-500',
            bgColor: 'bg-blue-50',
            trend: trends.applications,
            trendUp: true,
        },
        {
            label: 'Active Jobs',
            value: analytics.activeJobs,
            icon: Briefcase,
            color: 'bg-green-500',
            bgColor: 'bg-green-50',
            trend: null,
            trendUp: null,
        },
        {
            label: 'Pending Review',
            value: analytics.pendingReview,
            icon: Hourglass,
            color: 'bg-orange-500',
            bgColor: 'bg-orange-50',
            trend: null,
            trendUp: null,
        },
        {
            label: 'Hired',
            value: analytics.hired,
            icon: CheckCircle,
            color: 'bg-emerald-500',
            bgColor: 'bg-emerald-50',
            trend: trends.hires,
            trendUp: true,
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">
                                Analytics <span className="text-primary">Dashboard</span>
                            </h1>
                            <p className="text-slate-500 mt-1">
                                Track your recruitment performance and insights
                            </p>
                        </div>

                        {/* Date Range Selector */}
                        <div className="flex items-center gap-3">
                            {isFetching && !isLoading && (
                                <div className="flex items-center gap-2 text-sm text-primary">
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span>Updating...</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                                {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setDateRange(range)}
                                        disabled={isFetching}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateRange === range
                                            ? 'bg-primary text-white shadow-md'
                                            : 'text-slate-600 hover:bg-slate-100'
                                            } ${isFetching ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                        <Icon size={24} weight="duotone" className={stat.color.replace('bg-', 'text-')} />
                                    </div>
                                    {stat.trend !== null && (
                                        <div className={`flex items-center gap-1 text-sm font-medium ${stat.trendUp ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {stat.trendUp ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                                            {stat.trend}%
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4">
                                    <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                                    <p className="text-slate-500 text-sm mt-1">{stat.label}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Applications Over Time */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Applications Over Time</h3>
                                <p className="text-slate-500 text-sm">Daily application submissions</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Calendar size={16} />
                                Last 30 days
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={analytics.applicationsByDay}>
                                <defs>
                                    <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#94A3B8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#94A3B8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke={COLORS.primary}
                                    strokeWidth={2}
                                    fill="url(#colorApplications)"
                                    name="Applications"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Application Status Distribution */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                    >
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Status Distribution</h3>
                        <p className="text-slate-500 text-sm mb-6">Application pipeline breakdown</p>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={analytics.applicationsByStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {analytics.applicationsByStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '12px',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-3 mt-4">
                            {analytics.applicationsByStatus.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2 text-sm">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                    />
                                    <span className="text-slate-600">{entry.name}</span>
                                    <span className="font-semibold text-slate-900">{entry.value}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Applications by Job */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                    >
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Applications by Job</h3>
                        <p className="text-slate-500 text-sm mb-6">Compare applications and views per job</p>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics.applicationsByJob} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                                <XAxis type="number" stroke="#94A3B8" fontSize={12} />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    stroke="#94A3B8"
                                    fontSize={12}
                                    width={100}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '12px',
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="applications" fill={COLORS.primary} name="Applications" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="views" fill={COLORS.primaryLight} name="Views" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Monthly Trends */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                    >
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Monthly Trends</h3>
                        <p className="text-slate-500 text-sm mb-6">Applications vs Hires over time</p>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics.monthlyTrends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                                <YAxis stroke="#94A3B8" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '12px',
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="applications"
                                    stroke={COLORS.primary}
                                    strokeWidth={3}
                                    dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                                    name="Applications"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="hires"
                                    stroke={COLORS.success}
                                    strokeWidth={3}
                                    dot={{ fill: COLORS.success, strokeWidth: 2, r: 4 }}
                                    name="Hires"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </motion.div>
                </div>

                {/* Quick Stats Row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {/* Average Time to Hire */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                        <Clock size={32} weight="duotone" className="mb-4 opacity-80" />
                        <p className="text-3xl font-bold">{analytics.avgTimeToHire} days</p>
                        <p className="text-blue-100 text-sm">Avg. Time to Hire</p>
                    </div>

                    {/* Profile Views */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                        <Eye size={32} weight="duotone" className="mb-4 opacity-80" />
                        <p className="text-3xl font-bold">{analytics.profileViews}</p>
                        <p className="text-purple-100 text-sm">Company Profile Views</p>
                    </div>

                    {/* Conversion Rate */}
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
                        <TrendUp size={32} weight="duotone" className="mb-4 opacity-80" />
                        <p className="text-3xl font-bold">
                            {analytics.totalApplications > 0
                                ? ((analytics.hired / analytics.totalApplications) * 100).toFixed(1)
                                : 0}%
                        </p>
                        <p className="text-emerald-100 text-sm">Hire Rate</p>
                    </div>

                    {/* Rejected */}
                    <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl p-6 text-white">
                        <XCircle size={32} weight="duotone" className="mb-4 opacity-80" />
                        <p className="text-3xl font-bold">{analytics.rejected}</p>
                        <p className="text-slate-300 text-sm">Rejected Applications</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default CompanyAnalyticsPage;
