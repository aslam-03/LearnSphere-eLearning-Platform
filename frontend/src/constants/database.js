/**
 * Database Constants and Enums
 * Centralized constants for Firestore collections and field values
 */

// ==================== COLLECTION NAMES ====================

export const COLLECTIONS = {
  USERS: 'users',
  COURSES: 'courses',
  LESSONS: 'lessons',
  QUIZZES: 'quizzes',
  QUIZ_QUESTIONS: 'questions', // Subcollection of quizzes
  ENROLLMENTS: 'enrollments',
  LESSON_PROGRESS: 'lesson_progress',
  QUIZ_ATTEMPTS: 'quiz_attempts',
  BADGES: 'badges',
  COURSE_INVITATIONS: 'course_invitations',
  REVIEWS: 'reviews',
};

// ==================== USER ROLES ====================

export const USER_ROLES = {
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  LEARNER: 'learner',
};

export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.INSTRUCTOR]: 'Instructor',
  [USER_ROLES.LEARNER]: 'Learner',
};

// ==================== COURSE STATUS ====================

export const COURSE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};

export const COURSE_STATUS_LABELS = {
  [COURSE_STATUS.DRAFT]: 'Draft',
  [COURSE_STATUS.PUBLISHED]: 'Published',
};

// ==================== COURSE VISIBILITY ====================

export const COURSE_VISIBILITY = {
  EVERYONE: 'everyone',
  SIGNED_IN: 'signed_in',
};

export const COURSE_VISIBILITY_LABELS = {
  [COURSE_VISIBILITY.EVERYONE]: 'Everyone (Public)',
  [COURSE_VISIBILITY.SIGNED_IN]: 'Signed In Users Only',
};

// ==================== COURSE ACCESS TYPE ====================

export const COURSE_ACCESS_TYPE = {
  OPEN: 'open',
  INVITATION: 'invitation',
};

export const COURSE_ACCESS_TYPE_LABELS = {
  [COURSE_ACCESS_TYPE.OPEN]: 'Open Enrollment',
  [COURSE_ACCESS_TYPE.INVITATION]: 'Invitation Only',
};

// ==================== LESSON TYPES ====================

export const LESSON_TYPE = {
  VIDEO: 'video',
  DOCUMENT: 'document',
  IMAGE: 'image',
  QUIZ: 'quiz',
};

export const LESSON_TYPE_LABELS = {
  [LESSON_TYPE.VIDEO]: 'Video Lesson',
  [LESSON_TYPE.DOCUMENT]: 'Document',
  [LESSON_TYPE.IMAGE]: 'Image',
  [LESSON_TYPE.QUIZ]: 'Quiz',
};

export const LESSON_TYPE_ICONS = {
  [LESSON_TYPE.VIDEO]: '🎥',
  [LESSON_TYPE.DOCUMENT]: '📄',
  [LESSON_TYPE.IMAGE]: '🖼️',
  [LESSON_TYPE.QUIZ]: '❓',
};

// ==================== ENROLLMENT STATUS ====================

export const ENROLLMENT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
};

export const ENROLLMENT_STATUS_LABELS = {
  [ENROLLMENT_STATUS.ACTIVE]: 'In Progress',
  [ENROLLMENT_STATUS.COMPLETED]: 'Completed',
  [ENROLLMENT_STATUS.DROPPED]: 'Dropped',
};

export const ENROLLMENT_STATUS_COLORS = {
  [ENROLLMENT_STATUS.ACTIVE]: '#3498db',
  [ENROLLMENT_STATUS.COMPLETED]: '#2ecc71',
  [ENROLLMENT_STATUS.DROPPED]: '#95a5a6',
};

// ==================== QUIZ QUESTION TYPES ====================

export const QUESTION_TYPE = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  SHORT_ANSWER: 'short_answer',
};

export const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPE.MULTIPLE_CHOICE]: 'Multiple Choice',
  [QUESTION_TYPE.TRUE_FALSE]: 'True/False',
  [QUESTION_TYPE.SHORT_ANSWER]: 'Short Answer',
};

// ==================== DIFFICULTY LEVELS ====================

export const DIFFICULTY_LEVEL = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
};

export const DIFFICULTY_LEVEL_LABELS = {
  [DIFFICULTY_LEVEL.BEGINNER]: 'Beginner',
  [DIFFICULTY_LEVEL.INTERMEDIATE]: 'Intermediate',
  [DIFFICULTY_LEVEL.ADVANCED]: 'Advanced',
};

export const DIFFICULTY_LEVEL_COLORS = {
  [DIFFICULTY_LEVEL.BEGINNER]: '#2ecc71',
  [DIFFICULTY_LEVEL.INTERMEDIATE]: '#f39c12',
  [DIFFICULTY_LEVEL.ADVANCED]: '#e74c3c',
};

// ==================== INVITATION STATUS ====================

export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  EXPIRED: 'expired',
};

export const INVITATION_STATUS_LABELS = {
  [INVITATION_STATUS.PENDING]: 'Pending',
  [INVITATION_STATUS.ACCEPTED]: 'Accepted',
  [INVITATION_STATUS.EXPIRED]: 'Expired',
};

// ==================== GAMIFICATION ====================

export const POINTS = {
  QUIZ_DECAY_FACTOR: 0.8, // Points multiplier for each additional attempt
  MIN_PASSING_SCORE: 0, // Minimum passing score (0-100)
  MAX_PASSING_SCORE: 100, // Maximum passing score (0-100)
};

export const DEFAULT_BADGE_TIERS = [
  { name: 'Newbie', points: 0, tier: 1 },
  { name: 'Explorer', points: 100, tier: 2 },
  { name: 'Learner', points: 500, tier: 3 },
  { name: 'Scholar', points: 1500, tier: 4 },
  { name: 'Expert', points: 3000, tier: 5 },
  { name: 'Master', points: 5000, tier: 6 },
  { name: 'Legend', points: 10000, tier: 7 },
];

// ==================== VALIDATION RULES ====================

export const VALIDATION = {
  COURSE_TITLE_MIN: 5,
  COURSE_TITLE_MAX: 100,
  COURSE_DESCRIPTION_MIN: 20,
  COURSE_DESCRIPTION_MAX: 2000,
  
  LESSON_TITLE_MIN: 3,
  LESSON_TITLE_MAX: 100,
  
  QUIZ_TITLE_MIN: 5,
  QUIZ_TITLE_MAX: 100,
  QUIZ_MIN_PASSING_SCORE: 0,
  QUIZ_MAX_PASSING_SCORE: 100,
  
  QUESTION_TEXT_MIN: 10,
  QUESTION_TEXT_MAX: 500,
  QUESTION_MIN_OPTIONS: 2,
  QUESTION_MAX_OPTIONS: 6,
  
  USER_NAME_MIN: 2,
  USER_NAME_MAX: 50,
  USER_BIO_MAX: 500,
};

// ==================== DEFAULT VALUES ====================

export const DEFAULTS = {
  USER_TOTAL_POINTS: 0,
  COURSE_LESSON_COUNT: 0,
  COURSE_TOTAL_DURATION: 0,
  COURSE_ENROLLMENT_COUNT: 0,
  ENROLLMENT_PROGRESS: 0,
  ENROLLMENT_COMPLETED_LESSONS: 0,
  LESSON_POINTS_AWARDED: 10,
  LESSON_ORDER_INDEX: 1,
  QUIZ_PASSING_SCORE: 70,
  QUIZ_SHUFFLE_QUESTIONS: true,
  QUIZ_SHOW_CORRECT_ANSWERS: true,
  QUESTION_POINTS: 10,
  LESSON_PROGRESS_TIME_SPENT: 0,
  LESSON_PROGRESS_COMPLETED: false,
};

// ==================== PAGINATION ====================

export const PAGINATION = {
  COURSES_PER_PAGE: 12,
  LESSONS_PER_PAGE: 20,
  ENROLLMENTS_PER_PAGE: 10,
  QUIZ_ATTEMPTS_PER_PAGE: 10,
  SEARCH_RESULTS_LIMIT: 50,
};

// ==================== QUERY LIMITS ====================

export const QUERY_LIMITS = {
  RECENT_COURSES: 10,
  POPULAR_COURSES: 20,
  USER_ENROLLMENTS: 50,
  QUIZ_ATTEMPTS: 10,
  LEADERBOARD_USERS: 100,
};

// ==================== FILE UPLOAD ====================

export const FILE_UPLOAD = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: 500 * 1024 * 1024, // 500MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
  
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate composite ID for lesson_progress
 */
export const generateProgressId = (userId, lessonId) => `${userId}_${lessonId}`;

/**
 * Calculate quiz points with decay
 */
export const calculateQuizPointsWithDecay = (basePoints, score, attemptNumber) => {
  const decayFactor = Math.pow(POINTS.QUIZ_DECAY_FACTOR, attemptNumber - 1);
  return Math.round(basePoints * (score / 100) * decayFactor);
};

/**
 * Get label for any constant value
 */
export const getLabel = (constantObject, value) => {
  const labels = {
    [USER_ROLES.ADMIN]: USER_ROLE_LABELS,
    [COURSE_STATUS.DRAFT]: COURSE_STATUS_LABELS,
    [COURSE_VISIBILITY.EVERYONE]: COURSE_VISIBILITY_LABELS,
    [COURSE_ACCESS_TYPE.OPEN]: COURSE_ACCESS_TYPE_LABELS,
    [LESSON_TYPE.VIDEO]: LESSON_TYPE_LABELS,
    [ENROLLMENT_STATUS.ACTIVE]: ENROLLMENT_STATUS_LABELS,
    [QUESTION_TYPE.MULTIPLE_CHOICE]: QUESTION_TYPE_LABELS,
    [DIFFICULTY_LEVEL.BEGINNER]: DIFFICULTY_LEVEL_LABELS,
  };
  
  return labels[value] || value;
};

/**
 * Validate field length
 */
export const validateLength = (field, value, min, max) => {
  if (!value || value.length < min) {
    return `${field} must be at least ${min} characters`;
  }
  if (value.length > max) {
    return `${field} must be no more than ${max} characters`;
  }
  return null;
};

/**
 * Format duration in minutes to human-readable string
 */
export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/**
 * Format points with thousands separator
 */
export const formatPoints = (points) => {
  return points.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Calculate progress percentage
 */
export const calculateProgress = (completed, total) => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};
