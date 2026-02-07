// Learner Dashboard - My Courses
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getEnrollmentsByUser, getCourse } from '../../services/userService';
import toast from 'react-hot-toast';
import { TrophyIcon } from '@heroicons/react/24/solid';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const LearnerDashboard = () => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [userProfile]);

  const fetchEnrollments = async () => {
    if (!userProfile) return;

    setLoading(true);
    try {
      const fetchedEnrollments = await getEnrollmentsByUser(userProfile.id);
      
      // Fetch course details for each enrollment
      const enrollmentsWithCourses = await Promise.all(
        fetchedEnrollments.map(async (enrollment) => {
          const course = await getCourse(enrollment.courseId);
          return { ...enrollment, course };
        })
      );

      setEnrollments(enrollmentsWithCourses);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      yet_to_start: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    };
    const labels = {
      yet_to_start: 'Not Started',
      in_progress: 'In Progress',
      completed: 'Completed',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Profile */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Learning Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {userProfile?.displayName}!
              </p>
            </div>
            
            {/* Profile Badge and Logout */}
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-primary-500 to-indigo-600 text-white rounded-lg p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <TrophyIcon className="h-8 w-8" />
                  <div>
                    <div className="text-2xl font-bold">
                      {userProfile?.totalPoints || 0}
                    </div>
                    <div className="text-sm opacity-90">
                      {userProfile?.badge || 'Newbie'}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">My Courses</h2>
          <Link
            to="/learner/discover"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Discover Courses
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">
              No courses enrolled yet
            </h3>
            <p className="mt-1 text-gray-500">
              Start learning by discovering available courses
            </p>
            <Link
              to="/learner/discover"
              className="mt-4 inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => (
              <Link
                key={enrollment.id}
                to={`/learner/courses/${enrollment.courseId}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                <img
                  src={enrollment.course?.coverImage || 'https://via.placeholder.com/400x200'}
                  alt={enrollment.course?.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {enrollment.course?.title}
                    </h3>
                    {getStatusBadge(enrollment.status)}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{enrollment.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${enrollment.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    {enrollment.course?.lessonCount || 0} lessons
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnerDashboard;
