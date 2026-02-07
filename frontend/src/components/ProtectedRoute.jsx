/**
 * ============================================
 * LEARNSPHERE ROUTE PROTECTION
 * ============================================
 * 
 * PURPOSE:
 * Implement role-based access control for protected routes.
 * 
 * ROUTE PROTECTION RULES:
 * - /admin/*       → admin only
 * - /instructor/*  → admin + instructor
 * - /app/*         → any authenticated user (learner primarily)
 * - Guest attempting protected route → redirect to /login
 * - Wrong role attempting protected route → redirect to their dashboard
 * 
 * COMPONENTS:
 * 1. ProtectedRoute - Requires authentication + optional role check
 * 2. PublicRoute - Redirects authenticated users to their dashboard
 * 3. GuestAllowedRoute - Allows both guests and authenticated users
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, getRoleRedirectPath } from '../contexts/AuthContext';

/**
 * Loading Spinner Component
 * Shown during auth state resolution
 */
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
      <p className="mt-4 text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

/**
 * ProtectedRoute Component
 * 
 * Protects routes that require authentication and optionally specific roles.
 * 
 * BEHAVIOR:
 * 1. If loading → show spinner (prevents flicker)
 * 2. If not authenticated → redirect to /login (save intended destination)
 * 3. If authenticated but wrong role → redirect to their correct dashboard
 * 4. If authenticated with correct role → render children
 * 
 * @param {ReactNode} children - Route component to render
 * @param {string[]} allowedRoles - Array of roles allowed to access this route
 *                                  Empty array = any authenticated user allowed
 * 
 * USAGE EXAMPLES:
 * 
 * // Any authenticated user
 * <ProtectedRoute>
 *   <SomePage />
 * </ProtectedRoute>
 * 
 * // Admin only
 * <ProtectedRoute allowedRoles={['admin']}>
 *   <AdminPage />
 * </ProtectedRoute>
 * 
 * // Admin + Instructor
 * <ProtectedRoute allowedRoles={['admin', 'instructor']}>
 *   <InstructorDashboard />
 * </ProtectedRoute>
 */
export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();

  // Still resolving auth state - show loading
  if (loading) {
    return <LoadingSpinner />;
  }

  // Not authenticated - redirect to login
  // Save the location they were trying to access
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // User is authenticated but profile not loaded yet
  // This shouldn't happen normally but handle it gracefully
  if (!userProfile) {
    return <LoadingSpinner />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0) {
    const userRole = userProfile.role;

    // User doesn't have required role - redirect to their correct dashboard
    if (!allowedRoles.includes(userRole)) {
      const redirectPath = getRoleRedirectPath(userRole);
      return <Navigate to={redirectPath} replace />;
    }
  }

  // All checks passed - render the protected component
  return children;
};

/**
 * PublicRoute Component
 * 
 * For routes that should NOT be accessible when logged in (login, register).
 * If user is already authenticated, redirect them to their dashboard.
 * 
 * BEHAVIOR:
 * 1. If loading → show spinner
 * 2. If authenticated → redirect to role-based dashboard
 * 3. If not authenticated → render children (login/register page)
 * 
 * @param {ReactNode} children - Public route component (LoginPage, RegisterPage)
 * 
 * USAGE:
 * <PublicRoute>
 *   <LoginPage />
 * </PublicRoute>
 */
export const PublicRoute = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();

  // Still resolving auth state
  if (loading) {
    return <LoadingSpinner />;
  }

  // User is authenticated - redirect to their dashboard
  if (currentUser && userProfile) {
    const redirectPath = getRoleRedirectPath(userProfile.role);
    return <Navigate to={redirectPath} replace />;
  }

  // User not authenticated - show public page
  return children;
};

/**
 * GuestAllowedRoute Component
 * 
 * For routes that allow BOTH guests and authenticated users.
 * Example: Course listing page where guests can view published courses.
 * 
 * BEHAVIOR:
 * - Always renders children
 * - Components inside must handle guest vs authenticated state themselves
 * - Use useAuth() hook inside to check if user is authenticated
 * 
 * @param {ReactNode} children - Component that handles both guest and auth states
 * 
 * USAGE:
 * <GuestAllowedRoute>
 *   <CourseListingPage />
 * </GuestAllowedRoute>
 * 
 * The CourseListingPage shows all courses but "Start" button redirects guests to login
 * 
 * Inside CourseListingPage:
 * const { currentUser } = useAuth();
 * 
 * <button onClick={() => {
 *   if (!currentUser) {
 *     navigate('/login');
 *   } else {
 *     startCourse();
 *   }
 * }}>
 *   {currentUser ? 'Start Course' : 'Login to Start'}
 * </button>
 */
export const GuestAllowedRoute = ({ children }) => {
  const { loading } = useAuth();

  // Show loading spinner during initial auth check
  if (loading) {
    return <LoadingSpinner />;
  }

  // Render component - it will handle guest vs auth internally
  return children;
};

/**
 * RoleGuard Component (Alternative pattern)
 * 
 * For use INSIDE components to conditionally render based on role.
 * More flexible than ProtectedRoute for complex UIs.
 * 
 * USAGE:
 * <RoleGuard allowedRoles={['admin', 'instructor']}>
 *   <button>Delete Course</button>
 * </RoleGuard>
 */
export const RoleGuard = ({ children, allowedRoles = [] }) => {
  const { userProfile } = useAuth();

  if (!userProfile) return null;
  if (allowedRoles.length === 0) return children;
  if (!allowedRoles.includes(userProfile.role)) return null;

  return children;
};
