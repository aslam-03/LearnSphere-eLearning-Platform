// Protected Route Component with Role-Based Access
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && userProfile) {
    if (!allowedRoles.includes(userProfile.role)) {
      // Redirect to appropriate dashboard based on role
      const roleRoutes = {
        admin: '/instructor/dashboard',
        instructor: '/instructor/dashboard',
        learner: '/learner/dashboard',
      };
      return <Navigate to={roleRoutes[userProfile.role] || '/learner/dashboard'} replace />;
    }
  }

  return children;
};

// Public Route (redirect if already logged in)
export const PublicRoute = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Only redirect if we have both currentUser AND userProfile loaded
  if (currentUser && userProfile) {
    const roleRoutes = {
      admin: '/instructor/dashboard',
      instructor: '/instructor/dashboard',
      learner: '/learner/dashboard',
    };
    return <Navigate to={roleRoutes[userProfile.role] || '/learner/dashboard'} replace />;
  }

  return children;
};
