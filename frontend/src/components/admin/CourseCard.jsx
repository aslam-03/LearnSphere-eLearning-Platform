import { useNavigate } from 'react-router-dom';
import { formatDuration, generateCourseLink, copyToClipboard } from '../../utils/helpers';

const CourseCard = ({ course, onToast }) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/admin/courses/${course.id}`);
  };

  const handleShare = async () => {
    const link = generateCourseLink(course.id);
    const success = await copyToClipboard(link);
    if (success) {
      onToast('Link copied to clipboard!', 'success');
    } else {
      onToast('Failed to copy link', 'error');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-2">
          {course.title}
        </h3>
        {course.published && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Published
          </span>
        )}
      </div>

      {/* Tags */}
      {course.tags && course.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {course.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500 mb-1">Views</p>
          <p className="text-sm font-semibold text-gray-900">{course.viewsCount || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Lessons</p>
          <p className="text-sm font-semibold text-gray-900">{course.totalLessons || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Duration</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatDuration(course.totalDuration || 0)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleEdit}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Edit
        </button>
        <button
          onClick={handleShare}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          title="Share course"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
