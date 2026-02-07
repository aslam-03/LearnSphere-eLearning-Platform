// Common Constants and Helpers

// Badge System
export const BADGE_LEVELS = {
  'Newbie': 0,
  'Explorer': 20,
  'Achiever': 40,
  'Specialist': 60,
  'Expert': 80,
  'Master': 100,
};

export const getBadgeInfo = (points) => {
  const badges = Object.entries(BADGE_LEVELS).reverse();
  for (const [badge, threshold] of badges) {
    if (points >= threshold) {
      return {
        name: badge,
        threshold,
        nextBadge: getNextBadge(badge),
        progress: calculateBadgeProgress(points, badge),
      };
    }
  }
  return {
    name: 'Newbie',
    threshold: 0,
    nextBadge: 'Explorer',
    progress: (points / 20) * 100,
  };
};

const getNextBadge = (currentBadge) => {
  const badgeNames = Object.keys(BADGE_LEVELS);
  const currentIndex = badgeNames.indexOf(currentBadge);
  return currentIndex < badgeNames.length - 1
    ? badgeNames[currentIndex + 1]
    : null;
};

const calculateBadgeProgress = (points, currentBadge) => {
  const nextBadge = getNextBadge(currentBadge);
  if (!nextBadge) return 100;

  const currentThreshold = BADGE_LEVELS[currentBadge];
  const nextThreshold = BADGE_LEVELS[nextBadge];
  const progress = ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return Math.min(100, Math.max(0, progress));
};

// Lesson Type Icons (for display)
export const LESSON_TYPES = {
  video: {
    label: 'Video',
    color: 'text-red-500',
    bgColor: 'bg-red-100',
  },
  document: {
    label: 'Document',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
  },
  image: {
    label: 'Image',
    color: 'text-green-500',
    bgColor: 'bg-green-100',
  },
  quiz: {
    label: 'Quiz',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
  },
};

// Course Status
export const COURSE_STATUS = {
  yet_to_start: {
    label: 'Not Started',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  completed: {
    label: 'Completed',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
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

// Format Duration
export const formatDuration = (minutes) => {
  if (!minutes) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins} min`;
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
