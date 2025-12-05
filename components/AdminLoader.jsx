import { lazy, Suspense } from 'react';

// Lazy load admin components for better code splitting
export const AdminDashboard = lazy(() => import('../pages/admin/dashboard'));
export const AdminJobs = lazy(() => import('../pages/admin/jobs'));
export const AdminBlog = lazy(() => import('../pages/admin/blog'));
export const AdminCareers = lazy(() => import('../pages/admin/careers'));
export const AdminContacts = lazy(() => import('../pages/admin/company-contacts'));

// Loading component for admin routes
export const AdminLoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    <span className="ml-4 text-lg text-gray-600">Loading admin panel...</span>
  </div>
);

// HOC for admin route lazy loading
export const withAdminLazyLoading = (Component) => {
  return function AdminLazyWrapper(props) {
    return (
      <Suspense fallback={<AdminLoadingSpinner />}>
        <Component {...props} />
      </Suspense>
    );
  };
};

export default {
  AdminDashboard,
  AdminJobs,
  AdminBlog,
  AdminCareers,
  AdminContacts,
  AdminLoadingSpinner,
  withAdminLazyLoading
};