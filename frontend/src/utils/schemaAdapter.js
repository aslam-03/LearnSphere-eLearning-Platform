/**
 * Database Schema Adapter
 * Helper functions to convert between old and new schema field names
 * Use this during the migration period to maintain backward compatibility
 */

// ==================== FIELD NAME MAPPINGS ====================

export const OLD_TO_NEW_FIELD_MAP = {
  // User fields
  totalPoints: 'total_points',
  currentBadgeId: 'current_badge_id',
  displayName: 'display_name',
  avatarUrl: 'avatar_url',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  lastLogin: 'last_login',
  
  // Course fields
  instructorId: 'instructor_id',
  instructorName: 'instructor_name',
  thumbnailUrl: 'thumbnail_url',
  accessType: 'access_type',
  lessonCount: 'lesson_count',
  totalDuration: 'total_duration',
  enrollmentCount: 'enrollment_count',
  averageRating: 'average_rating',
  difficultyLevel: 'difficulty_level',
  publishedAt: 'published_at',
  createdBy: 'instructor_id', // Legacy field mapping
  published: 'status', // Special case: boolean to status string
  
  // Lesson fields
  courseId: 'course_id',
  contentUrl: 'content_url',
  contentText: 'content_text',
  orderIndex: 'order_index',
  quizId: 'quiz_id',
  pointsAwarded: 'points_awarded',
  isRequired: 'is_required',
  
  // Quiz fields
  lessonId: 'lesson_id',
  passingScore: 'passing_score',
  timeLimit: 'time_limit',
  maxAttempts: 'max_attempts',
  shuffleQuestions: 'shuffle_questions',
  showCorrectAnswers: 'show_correct_answers',
  
  // Quiz Question fields
  questionText: 'question_text',
  questionType: 'question_type',
  correctAnswer: 'correct_answer',
  mediaUrl: 'media_url',
  
  // Enrollment fields
  userId: 'user_id',
  progressPercentage: 'progress_percentage',
  completedLessons: 'completed_lessons',
  totalLessons: 'total_lessons',
  lastAccessedLessonId: 'last_accessed_lesson_id',
  enrolledAt: 'enrolled_at',
  completedAt: 'completed_at',
  
  // Lesson Progress fields
  timeSpent: 'time_spent',
  lastPosition: 'last_position',
  startedAt: 'started_at',
  
  // Quiz Attempt fields
  attemptNumber: 'attempt_number',
  pointsEarned: 'points_earned',
  timeTaken: 'time_taken',
  
  // Badge fields
  iconUrl: 'icon_url',
  pointsRequired: 'points_required',
  
  // Review fields
  userName: 'user_name',
};

export const NEW_TO_OLD_FIELD_MAP = Object.fromEntries(
  Object.entries(OLD_TO_NEW_FIELD_MAP).map(([k, v]) => [v, k])
);

// ==================== CONVERSION FUNCTIONS ====================

/**
 * Convert object from old schema to new schema
 * @param {Object} obj - Object with old field names
 * @param {string} type - Type of object (user, course, lesson, etc.)
 * @returns {Object} Object with new field names
 */
export const convertToNewSchema = (obj, type = 'generic') => {
  if (!obj) return obj;
  
  const converted = { ...obj };
  
  // Convert field names
  Object.keys(obj).forEach(oldKey => {
    const newKey = OLD_TO_NEW_FIELD_MAP[oldKey];
    if (newKey && newKey !== oldKey) {
      converted[newKey] = obj[oldKey];
      delete converted[oldKey];
    }
  });
  
  // Special case: published boolean to status
  if (type === 'course' && 'published' in obj) {
    converted.status = obj.published ? 'published' : 'draft';
    delete converted.published;
  }
  
  return converted;
};

/**
 * Convert object from new schema to old schema (for backward compatibility)
 * @param {Object} obj - Object with new field names
 * @param {string} type - Type of object
 * @returns {Object} Object with old field names
 */
export const convertToOldSchema = (obj, type = 'generic') => {
  if (!obj) return obj;
  
  const converted = { ...obj };
  
  // Convert field names
  Object.keys(obj).forEach(newKey => {
    const oldKey = NEW_TO_OLD_FIELD_MAP[newKey];
    if (oldKey && oldKey !== newKey) {
      converted[oldKey] = obj[newKey];
      delete converted[newKey];
    }
  });
  
  // Special case: status to published boolean
  if (type === 'course' && 'status' in obj) {
    converted.published = obj.status === 'published';
    // Keep status for new components
  }
  
  return converted;
};

/**
 * Convert array of objects to new schema
 */
export const convertArrayToNewSchema = (array, type = 'generic') => {
  if (!Array.isArray(array)) return array;
  return array.map(item => convertToNewSchema(item, type));
};

/**
 * Convert array of objects to old schema
 */
export const convertArrayToOldSchema = (array, type = 'generic') => {
  if (!Array.isArray(array)) return array;
  return array.map(item => convertToOldSchema(item, type));
};

// ==================== QUERY PARAMETER CONVERTERS ====================

/**
 * Convert query object from old field names to new field names
 * Useful for where(), orderBy(), etc.
 */
export const convertQueryParams = (params) => {
  if (typeof params === 'string') {
    return OLD_TO_NEW_FIELD_MAP[params] || params;
  }
  
  if (typeof params === 'object' && params !== null) {
    const converted = {};
    Object.keys(params).forEach(key => {
      const newKey = OLD_TO_NEW_FIELD_MAP[key] || key;
      converted[newKey] = params[key];
    });
    return converted;
  }
  
  return params;
};

// ==================== VALIDATION HELPERS ====================

/**
 * Check if object uses old schema
 */
export const usesOldSchema = (obj) => {
  if (!obj || typeof obj !== 'object') return false;
  
  const oldKeys = Object.keys(OLD_TO_NEW_FIELD_MAP);
  return Object.keys(obj).some(key => oldKeys.includes(key));
};

/**
 * Check if object uses new schema
 */
export const usesNewSchema = (obj) => {
  if (!obj || typeof obj !== 'object') return false;
  
  const newKeys = Object.values(OLD_TO_NEW_FIELD_MAP);
  return Object.keys(obj).some(key => newKeys.includes(key));
};

/**
 * Detect schema version
 */
export const detectSchemaVersion = (obj) => {
  if (usesOldSchema(obj)) return 'old';
  if (usesNewSchema(obj)) return 'new';
  return 'unknown';
};

// ==================== MIGRATION HELPERS ====================

/**
 * Safely access field using either old or new name
 * Example: safeGet(user, 'total_points', 'totalPoints')
 */
export const safeGet = (obj, newKey, oldKey) => {
  if (!obj) return undefined;
  return obj[newKey] !== undefined ? obj[newKey] : obj[oldKey];
};

/**
 * Get field value with automatic fallback
 * Tries new field name first, falls back to old
 */
export const getField = (obj, fieldName) => {
  if (!obj) return undefined;
  
  // If fieldName is in old format, try new format first
  const newFieldName = OLD_TO_NEW_FIELD_MAP[fieldName] || fieldName;
  const oldFieldName = NEW_TO_OLD_FIELD_MAP[newFieldName] || fieldName;
  
  return obj[newFieldName] !== undefined ? obj[newFieldName] : obj[oldFieldName];
};

/**
 * Set field value using new schema name
 */
export const setField = (obj, fieldName, value) => {
  const newFieldName = OLD_TO_NEW_FIELD_MAP[fieldName] || fieldName;
  obj[newFieldName] = value;
  return obj;
};

// ==================== EXAMPLE USAGE ====================

/*
// Converting a course object from API
const oldCourse = {
  id: 'course123',
  title: 'My Course',
  instructorId: 'user456',
  published: true,
  createdAt: timestamp,
};

const newCourse = convertToNewSchema(oldCourse, 'course');
// Result: {
//   id: 'course123',
//   title: 'My Course',
//   instructor_id: 'user456',
//   status: 'published',
//   created_at: timestamp,
// }

// Safe field access during migration
const instructorId = getField(course, 'instructorId'); // Works with both schemas

// Convert array of enrollments
const newEnrollments = convertArrayToNewSchema(oldEnrollments, 'enrollment');
*/

export default {
  convertToNewSchema,
  convertToOldSchema,
  convertArrayToNewSchema,
  convertArrayToOldSchema,
  convertQueryParams,
  usesOldSchema,
  usesNewSchema,
  detectSchemaVersion,
  safeGet,
  getField,
  setField,
  OLD_TO_NEW_FIELD_MAP,
  NEW_TO_OLD_FIELD_MAP,
};
