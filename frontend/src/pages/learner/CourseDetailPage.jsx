// Course View Page - Shows course details and lesson list
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getCourse,
  getLessonsByCourse,
  getReviewsByCourse,
  createOrUpdateReview,
} from '../../services/courseService';
import toast from 'react-hot-toast';
import { PlayIcon, DocumentTextIcon, PhotoIcon, AcademicCapIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

const CourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const [courseData, lessonsData, reviewsData] = await Promise.all([
        getCourse(courseId),
        getLessonsByCourse(courseId),
        getReviewsByCourse(courseId),
      ]);

      setCourse(courseData);
      setLessons(lessonsData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCourse = () => {
    if (lessons.length > 0) {
      navigate(`/learner/courses/${courseId}/learn?lessonId=${lessons[0].id}`);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewData.comment.trim()) {
      toast.error('Please write a review');
      return;
    }

    try {
      await createOrUpdateReview(
        userProfile.uid,
        courseId,
        reviewData.rating,
        reviewData.comment,
        userProfile.displayName
      );
      toast.success('Review submitted successfully');
      setShowReviewModal(false);
      fetchCourseData();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  };

  const getLessonIcon = (type) => {
    switch (type) {
      case 'video':
        return <PlayIcon className="h-5 w-5 text-red-500" />;
      case 'document':
        return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
      case 'image':
        return <PhotoIcon className="h-5 w-5 text-green-500" />;
      case 'quiz':
        return <AcademicCapIcon className="h-5 w-5 text-purple-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Course not found</h2>
          <Link
            to="/learner/dashboard"
            className="mt-4 inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            to="/learner/dashboard"
            className="text-white/80 hover:text-white mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-white/90 text-lg mb-6">{course.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {course.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <button
                onClick={handleStartCourse}
                className="px-8 py-3 bg-white text-primary-700 font-semibold rounded-lg hover:bg-gray-100 transition"
              >
                Start Learning
              </button>
            </div>
            
            <div>
              <img
                src={course.coverImage || 'https://via.placeholder.com/600x400'}
                alt={course.title}
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            {/* Course Stats */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Course Overview
              </h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary-600">
                    {lessons.length}
                  </div>
                  <div className="text-gray-600 text-sm">Lessons</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary-600">
                    {course.totalDuration || 0}
                  </div>
                  <div className="text-gray-600 text-sm">Minutes</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary-600">
                    {course.enrollmentCount || 0}
                  </div>
                  <div className="text-gray-600 text-sm">Students</div>
                </div>
              </div>
            </div>

            {/* Lessons List */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Course Content
              </h2>
              {lessons.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No lessons available yet
                </p>
              ) : (
                <div className="space-y-3">
                  {lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        navigate(`/learner/courses/${courseId}/learn?lessonId=${lesson.id}`)
                      }
                    >
                      <div className="flex items-center gap-4">
                        {getLessonIcon(lesson.type)}
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {index + 1}. {lesson.title}
                          </h3>
                          <span className="text-sm text-gray-500 capitalize">
                            {lesson.type}
                            {lesson.duration > 0 && ` • ${lesson.duration} min`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Reviews ({reviews.length})
                </h2>
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                >
                  Write Review
                </button>
              </div>

              {reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No reviews yet. Be the first to review!
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {review.userName}
                        </span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Your Progress
              </h3>
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Completion</span>
                  <span>0%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary-600 h-3 rounded-full transition-all"
                    style={{ width: '0%' }}
                  ></div>
                </div>
              </div>

              <button
                onClick={handleStartCourse}
                className="w-full px-4 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition mb-4"
              >
                Continue Learning
              </button>

              <button
                onClick={() => setShowReviewModal(true)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Rate this course
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Write a Review
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                    className="text-3xl focus:outline-none"
                  >
                    <span className={star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review
              </label>
              <textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Share your experience with this course..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseView;
