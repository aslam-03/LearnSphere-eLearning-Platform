// Course Editor - Create/Edit Course with Lessons and Quizzes
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getCourse,
  createCourse,
  updateCourse,
  getLessonsByCourse,
  createLesson,
  updateLesson,
  deleteLesson,
} from '../../services/courseService';
import { uploadToR2 } from '../../services/uploadService';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const CourseEditor = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    tags: '',
    coverImage: '',
    visibility: 'everyone',
    accessRule: 'open',
    published: false,
    price: 0,
  });

  const [lessons, setLessons] = useState([]);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(null);

  useEffect(() => {
    if (courseId && courseId !== 'new') {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const course = await getCourse(courseId);
      if (course) {
        setCourseData({
          title: course.title || '',
          description: course.description || '',
          tags: course.tags?.join(', ') || '',
          coverImage: course.coverImage || '',
          visibility: course.visibility || 'everyone',
          accessRule: course.accessRule || 'open',
          published: course.published || false,
          price: course.price || 0,
        });

        const fetchedLessons = await getLessonsByCourse(courseId);
        setLessons(fetchedLessons);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCourseData({
      ...courseData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToR2(file, 'covers');
      setCourseData({ ...courseData, coverImage: url });
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!courseData.title) {
      toast.error('Course title is required');
      return;
    }

    setLoading(true);
    try {
      const tagsArray = courseData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const coursePayload = {
        title: courseData.title,
        description: courseData.description,
        tags: tagsArray,
        coverImage: courseData.coverImage,
        visibility: courseData.visibility,
        accessRule: courseData.accessRule,
        published: courseData.published,
        price: parseFloat(courseData.price) || 0,
        createdBy: userProfile.id,
      };

      if (courseId && courseId !== 'new') {
        await updateCourse(courseId, coursePayload);
        toast.success('Course updated successfully');
      } else {
        const newCourseId = await createCourse(coursePayload);
        toast.success('Course created successfully');
        navigate(`/instructor/courses/${newCourseId}/edit`);
      }
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = () => {
    setCurrentLesson({
      title: '',
      description: '',
      type: 'video',
      contentUrl: '',
      duration: 0,
      allowDownload: false,
      orderIndex: lessons.length,
      attachments: [],
    });
    setShowLessonModal(true);
  };

  const handleEditLesson = (lesson) => {
    setCurrentLesson(lesson);
    setShowLessonModal(true);
  };

  const handleSaveLesson = async (lessonData) => {
    if (!courseId || courseId === 'new') {
      toast.error('Please save the course first');
      return;
    }

    try {
      if (currentLesson.id) {
        await updateLesson(currentLesson.id, lessonData);
        toast.success('Lesson updated');
      } else {
        await createLesson({ ...lessonData, courseId });
        toast.success('Lesson created');
      }
      fetchCourseData();
      setShowLessonModal(false);
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error('Failed to save lesson');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      await deleteLesson(lessonId, courseId);
      toast.success('Lesson deleted');
      fetchCourseData();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {courseId === 'new' ? 'Create New Course' : 'Edit Course'}
          </h1>

          {/* Course Details Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                name="title"
                value={courseData.title}
                onChange={handleCourseChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Introduction to React"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={courseData.description}
                onChange={handleCourseChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Describe your course..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                value={courseData.tags}
                onChange={handleCourseChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., react, javascript, frontend"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image
              </label>
              {courseData.coverImage && (
                <img
                  src={courseData.coverImage}
                  alt="Cover"
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <select
                  name="visibility"
                  value={courseData.visibility}
                  onChange={handleCourseChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="everyone">Everyone</option>
                  <option value="signedIn">Signed In Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Rule
                </label>
                <select
                  name="accessRule"
                  value={courseData.accessRule}
                  onChange={handleCourseChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="open">Open</option>
                  <option value="invitation">Invitation Only</option>
                  <option value="payment">Payment Required</option>
                </select>
              </div>
            </div>

            {courseData.accessRule === 'payment' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  name="price"
                  value={courseData.price}
                  onChange={handleCourseChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                name="published"
                checked={courseData.published}
                onChange={handleCourseChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Publish course (make visible to learners)
              </label>
            </div>

            <button
              onClick={handleSaveCourse}
              disabled={loading || uploading}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Course'}
            </button>
          </div>
        </div>

        {/* Lessons Section */}
        {courseId && courseId !== 'new' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Lessons</h2>
              <button
                onClick={handleAddLesson}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Lesson
              </button>
            </div>

            {lessons.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No lessons yet. Add your first lesson to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {lesson.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {lesson.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditLesson(lesson)}
                        className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lesson Modal would go here - simplified for hackathon */}
    </div>
  );
};

export default CourseEditor;
