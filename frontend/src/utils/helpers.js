// Common Constants and Helpers
import {
  LESSON_TYPE_LABELS,
  LESSON_TYPE_ICONS,
  ENROLLMENT_STATUS_LABELS,
  ENROLLMENT_STATUS_COLORS,
  formatDuration as formatDurationUtil,
  formatPoints,
  calculateProgress,
} from '../constants/database';

// Re-export from database constants
export { formatDuration, formatPoints, calculateProgress } from '../constants/database';

// Badge System - Use quizService.js for full badge functionality
// These are helper functions for display purposes only
export const getBadgeDisplayInfo = (badgeData, userPoints) => {
  if (!badgeData) {
    return {
      name: 'No Badge',
      threshold: 0,
      nextBadge: null,
      progress: 0,
    };
  }
  
  return {
    name: badgeData.name,
    threshold: badgeData.points_required,
    color: badgeData.color,
    icon_url: badgeData.icon_url,
  };
};

// Lesson Type Display Info (for UI rendering)
export const LESSON_TYPE_DISPLAY = {
  video: {
    label: LESSON_TYPE_LABELS?.video || 'Video Lesson',
    icon: LESSON_TYPE_ICONS?.video || '🎥',
    color: 'text-red-500',
    bgColor: 'bg-red-100',
  },
  document: {
    label: LESSON_TYPE_LABELS?.document || 'Document',
    icon: LESSON_TYPE_ICONS?.document || '📄',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
  },
  image: {
    label: LESSON_TYPE_LABELS?.image || 'Image',
    icon: LESSON_TYPE_ICONS?.image || '🖼️',
    color: 'text-green-500',
    bgColor: 'bg-green-100',
  },
  quiz: {
    label: LESSON_TYPE_LABELS?.quiz || 'Quiz',
    icon: LESSON_TYPE_ICONS?.quiz || '❓',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
  },
};

// Enrollment Status Display Info (for UI rendering)
export const ENROLLMENT_STATUS_DISPLAY = {
  active: {
    label: ENROLLMENT_STATUS_LABELS?.active || 'In Progress',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  completed: {
    label: ENROLLMENT_STATUS_LABELS?.completed || 'Completed',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  dropped: {
    label: ENROLLMENT_STATUS_LABELS?.dropped || 'Dropped',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
};

// Format Date
export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Truncate Text
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Validate URL
export const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Extract YouTube Video ID
export const getYouTubeVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Generate Random ID
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

// Debounce Function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Calculate Quiz Score Percentage
export const calculateQuizScore = (correctAnswers, totalQuestions) => {
  if (totalQuestions === 0) return 0;
  return Math.round((correctAnswers / totalQuestions) * 100);
};
