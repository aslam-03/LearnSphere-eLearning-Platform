/**
 * ============================================
 * LEARNSPHERE LOGIN PAGE
 * ============================================
 * 
 * PURPOSE:
 * Email/password authentication for all user roles.
 * 
 * POST-LOGIN BEHAVIOR:
 * After successful login, redirect based on role from Firestore:
 * - admin      → /admin
 * - instructor → /instructor
 * - learner    → /app
 * 
 * KEY FEATURES:
 * - No role selection UI (role comes from Firestore)
 * - Loading state during auth + role resolution
 * - Proper error handling with user feedback
 * - Auto-redirect if already logged in
 * 
 * FLOW:
 * 1. User submits email + password
 * 2. Firebase Auth login
 * 3. AuthContext fetches user profile from Firestore
 * 4. Role extracted from profile
 * 5. Redirect to appropriate dashboard
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, getRoleRedirectPath } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  const { login, sendPasswordReset, currentUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Auto-redirect if user is already logged in
   * Waits for both currentUser AND userProfile to be loaded
   * This prevents redirect before we know the user's role
   */
  useEffect(() => {
    if (!loading && currentUser && userProfile) {
      // Get the path they were trying to access, or default to role-based path
      const from = location.state?.from || getRoleRedirectPath(userProfile.role);
      navigate(from, { replace: true });
    }
  }, [loading, currentUser, userProfile, navigate, location]);

  /**
   * Handle login form submission
   * 
   * FLOW:
   * 1. Validate form fields
   * 2. Call Firebase Auth login
   * 3. Wait for AuthContext to fetch user profile
   * 4. Navigation happens via useEffect above when profile loads
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Login via Firebase Auth
      await login(email, password);
      
      // Success toast
      toast.success('Login successful!');
      
      // Note: Navigation happens automatically via useEffect 
      // when userProfile is loaded by AuthContext
      
    } catch (error) {
      console.error('Login error:', error);
      
      // User-friendly error messages
      let errorMessage = 'Failed to login. Please try again.';
      
      if (error.code === 'auth/email-not-verified') {
        errorMessage = 'Please verify your email. We just sent a new verification link.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    const targetEmail = (resetEmail || email).trim();

    if (!targetEmail || !targetEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsResetting(true);
    try {
      await sendPasswordReset(targetEmail);
      toast.success('Password reset email sent. Check your inbox.');
      setShowReset(false);
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Failed to send reset email. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  // Show loading spinner during auth initialization
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Sign in to LearnSphere</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowReset((prev) => !prev)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition"
              >
                Forgot password?
              </button>
            </div>

            {showReset && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                <label htmlFor="resetEmail" className="block text-sm font-semibold text-gray-700">
                  Email for password reset
                </label>
                <input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={isResetting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={isResetting}
                    className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResetting ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReset(false)}
                    className="text-gray-600 hover:text-gray-800 font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="text-indigo-600 hover:text-indigo-700 font-semibold transition"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Note:</span> Your role (Admin, Instructor, or Learner) 
            is determined by your account settings. Contact an administrator if you need access changes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
