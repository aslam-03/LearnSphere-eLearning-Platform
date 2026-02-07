/**
 * ============================================
 * LEARNSPHERE MAIN APP ROUTER
 * ============================================
 * 
 * PURPOSE:
 * Central routing configuration with role-based access control.
 * 
 * ROUTE STRUCTURE:
 * 
 * PUBLIC ROUTES (no auth required):
 * /login        - Login page
 * /register     - Registration page (creates learner account)
 * 
 * ADMIN ROUTES (admin role only):
 * /admin        - Admin dashboard
 * /admin/*      - All admin routes
 * 
 * INSTRUCTOR ROUTES (admin + instructor roles):
 * /instructor   - Instructor dashboard
 * /instructor/* - Course management routes
 * 
 * LEARNER ROUTES (any authenticated user, primarily learners):
 * /app          - Learner dashboard
 * /app/*        - Learning, courses, progress routes
 * 
 * GUEST-ALLOWED ROUTES (public + authenticated):
 * /courses      - Browse courses (guests see public courses only)
 * /courses/:id  - View course details (guests can't start)
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicRoute, GuestAllowedRoute } from './components/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Instructor Pages
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import CourseEditPage from './pages/instructor/CourseEditPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateInstructorPage from './pages/admin/CreateInstructorPage';
import CoursesDashboard from './pages/admin/CoursesDashboard';

// Learner Pages
import LearnerDashboard from './pages/learner/LearnerDashboard';
import ExplorePage from './pages/learner/ExplorePage';
import CourseDetailPage from './pages/learner/CourseDetailPage';
import LearningPlayerPage from './pages/learner/LearningPlayerPage';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Routes>
            {/* ============================================ */}
            {/* PUBLIC ROUTES (login/register)              */}
            {/* ============================================ */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* ============================================ */}
            {/* ADMIN ROUTES (admin only)                   */}
            {/* ============================================ */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/create-instructor"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CreateInstructorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CoursesDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/courses/:id"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CourseEditPage />
                </ProtectedRoute>
              }
            />

            {/* ============================================ */}
            {/* INSTRUCTOR ROUTES (admin + instructor)      */}
            {/* ============================================ */}
            <Route
              path="/instructor"
              element={
                <ProtectedRoute allowedRoles={['admin', 'instructor']}>
                  <InstructorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'instructor']}>
                  <InstructorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor/courses/:courseId/edit"
              element={
                <ProtectedRoute allowedRoles={['admin', 'instructor']}>
                  <CourseEditPage />
                </ProtectedRoute>
              }
            />

            {/* ============================================ */}
            {/* LEARNER ROUTES (authenticated users)        */}
            {/* ============================================ */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <LearnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/dashboard"
              element={
                <ProtectedRoute>
                  <LearnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/explore"
              element={
                <ProtectedRoute>
                  <ExplorePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/courses/:courseId"
              element={
                <ProtectedRoute>
                  <CourseDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/courses/:courseId/learn"
              element={
                <ProtectedRoute>
                  <LearningPlayerPage />
                </ProtectedRoute>
              }
            />

            {/* ============================================ */}
            {/* LEGACY ROUTES (backwards compatibility)     */}
            {/* TODO: Remove after migration complete       */}
            {/* ============================================ */}
            <Route
              path="/learner/dashboard"
              element={<Navigate to="/app/dashboard" replace />}
            />
            <Route
              path="/learner/discover"
              element={<Navigate to="/app/explore" replace />}
            />
            <Route
              path="/learner/courses/:courseId"
              element={<Navigate to="/app/courses/:courseId" replace />}
            />
            <Route
              path="/learner/courses/:courseId/learn"
              element={<Navigate to="/app/courses/:courseId/learn" replace />}
            />

            {/* ============================================ */}
            {/* DEFAULT ROUTES                              */}
            {/* ============================================ */}
            {/* Root redirects to login - auth logic will handle redirect to dashboard */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Catch-all: redirect unknown routes to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

          {/* Global Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                padding: '16px',
                borderRadius: '8px',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
