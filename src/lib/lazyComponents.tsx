import { lazy, Suspense, ComponentType } from 'react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { DashboardSkeleton, ProfileSkeleton, ListSkeleton, TableSkeleton } from '../components/ui/Skeleton';

// Lazy load utility with prefetch support
function lazyWithPrefetch<T extends ComponentType<any>>(
    factory: () => Promise<{ default: T }>
) {
    const Component = lazy(factory);
    // Attach prefetch method
    (Component as any).prefetch = factory;
    return Component;
}

// ============================================
// Page Components - Lazy Loaded
// ============================================

// Public Pages
export const LandingPage = lazyWithPrefetch(() => import('../pages/public/LandingPage'));
export const TalentPublicProfilePage = lazyWithPrefetch(() => import('../pages/public/TalentPublicProfilePage'));

// Company Pages
export const CompanyDashboard = lazyWithPrefetch(() => import('../components/company/CompanyDashboard'));
export const CompanyJobsPage = lazyWithPrefetch(() => import('../pages/company/CompanyJobsPage'));
export const CreateJobPage = lazyWithPrefetch(() => import('../pages/company/CreateJobPage'));
export const EditJobPage = lazyWithPrefetch(() => import('../pages/company/EditJobPage'));
export const CompanyJobDetailPage = lazyWithPrefetch(() => import('../pages/company/JobDetailPage'));
export const CompanyApplicantsPage = lazyWithPrefetch(() => import('../pages/company/CompanyApplicantsPage'));
export const ApplicationDetailPage = lazyWithPrefetch(() => import('../pages/company/ApplicationDetailPage'));
export const CompanyMatchesPage = lazyWithPrefetch(() => import('../pages/company/CompanyMatchesPage'));
export const CompanyProfilePage = lazyWithPrefetch(() => import('../pages/company/CompanyProfilePage'));
export const JobMatchingResultsPage = lazyWithPrefetch(() => import('../pages/company/JobMatchingResultsPage').then(m => ({ default: m.JobMatchingResultsPage })));

// Talent Pages
export const TalentDashboard = lazyWithPrefetch(() => import('../components/dashboard/TalentDashboard'));
export const TalentApplicationsPage = lazyWithPrefetch(() => import('../pages/talent/TalentApplicationsPage'));
export const TalentProfilePage = lazyWithPrefetch(() => import('../pages/talent/TalentProfilePage'));
export const TalentsPage = lazyWithPrefetch(() => import('../pages/talent/TalentsPage'));

// Admin Pages
export const AdminDashboard = lazyWithPrefetch(() => import('../components/dashboard/AdminDashboard'));
export const AdminProfilePage = lazyWithPrefetch(() => import('../pages/admin/AdminProfilePage'));

// Shared Pages
export const JobsPage = lazyWithPrefetch(() => import('../pages/shared/JobsPage'));
export const JobDetailPage = lazyWithPrefetch(() => import('../pages/shared/JobDetailPage'));
export const SettingsPage = lazyWithPrefetch(() => import('../pages/shared/SettingsPage'));
export const AIMatchingPage = lazyWithPrefetch(() => import('../pages/shared/AIMatchingPage'));
export const MatchingDashboard = lazyWithPrefetch(() => import('../pages/shared/MatchingDashboard').then(m => ({ default: m.MatchingDashboard })));

// Profile Completion
export const CompanyProfileCompletion = lazyWithPrefetch(() => import('../components/company/CompanyProfileCompletion'));
export const TalentProfileCompletion = lazyWithPrefetch(() => import('../components/talent/TalentProfileCompletion'));

// ============================================
// Suspense Wrappers with appropriate skeletons
// ============================================

interface SuspenseWrapperProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function PageSuspense({ children, fallback }: SuspenseWrapperProps) {
    return (
        <Suspense fallback={fallback || <LoadingSpinner fullScreen text="Loading..." />}>
            {children}
        </Suspense>
    );
}

export function DashboardSuspense({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            {children}
        </Suspense>
    );
}

export function ProfileSuspense({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<ProfileSkeleton />}>
            {children}
        </Suspense>
    );
}

export function ListSuspense({ children, items = 5 }: { children: React.ReactNode; items?: number }) {
    return (
        <Suspense fallback={<ListSkeleton items={items} />}>
            {children}
        </Suspense>
    );
}

export function TableSuspense({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<TableSkeleton />}>
            {children}
        </Suspense>
    );
}

// ============================================
// Prefetch utilities
// ============================================

// Prefetch a lazy component
export function prefetchComponent(component: any) {
    if (component?.prefetch) {
        component.prefetch();
    }
}

// Prefetch multiple components
export function prefetchComponents(components: any[]) {
    components.forEach(prefetchComponent);
}

// Prefetch on hover/focus for links
export function usePrefetchOnHover(component: any) {
    return {
        onMouseEnter: () => prefetchComponent(component),
        onFocus: () => prefetchComponent(component),
    };
}

// Route-based prefetch mapping
const routePrefetchMap: Record<string, any[]> = {
    '/company': [CompanyJobsPage, CompanyApplicantsPage, CompanyProfilePage],
    '/company/jobs': [CreateJobPage, CompanyJobDetailPage],
    '/talent': [TalentApplicationsPage, TalentProfilePage, JobsPage],
    '/jobs': [JobDetailPage],
    '/talents': [TalentPublicProfilePage],
};

export function prefetchForRoute(route: string) {
    const componentsToPrefetch = routePrefetchMap[route];
    if (componentsToPrefetch) {
        prefetchComponents(componentsToPrefetch);
    }
}
