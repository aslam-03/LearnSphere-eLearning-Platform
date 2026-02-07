// Main App Component with Routing
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/LoginPage';
import Register from './pages/auth/RegisterPage';

// Instructor Pages
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import CourseEditor from './pages/instructor/CourseEditPage';

// Admin Pages
import CreateInstructorPage from './pages/admin/CreateInstructorPage';

// Learner Pages
import LearnerDashboard from './pages/learner/LearnerDashboard';
import CourseDiscovery from './pages/learner/ExplorePage';
import CourseView from './pages/learner/CourseDetailPage';
import LearningPlayer from './pages/learner/LearningPlayerPage';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Instructor Routes */}
            <Route
              path="/instructor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                  <InstructorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor/courses/:courseId/edit"
              element={
                <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                  <CourseEditor />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/create-instructor"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CreateInstructorPage />
                </ProtectedRoute>
              }
            />

            {/* Learner Routes */}
            <Route
              path="/learner/dashboard"
              element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <LearnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learner/discover"
              element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <CourseDiscovery />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learner/courses/:courseId"
              element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <CourseView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learner/courses/:courseId/learn"
              element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <LearningPlayer />
                </ProtectedRoute>
              }
            />

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
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
