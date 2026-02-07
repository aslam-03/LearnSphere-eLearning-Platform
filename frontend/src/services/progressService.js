import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ==================== COURSE PROGRESS ====================

/**
 * Get overall course progress for a user
 * @param {string} userId - The user ID
 * @param {string} courseId - The course ID
 * @returns {Promise<Object>} Progress data including percentage and completion status
 */
export const getCourseProgress = async (userId, courseId) => {
  try {
    // 1. Get enrollment
    const enrollmentQuery = query(
      collection(db, 'enrollments'),
      where('user_id', '==', userId),
      where('course_id', '==', courseId)
    );
    const enrollmentSnap = await getDocs(enrollmentQuery);
    const enrollment = enrollmentSnap.empty 
      ? null 
      : { id: enrollmentSnap.docs[0].id, ...enrollmentSnap.docs[0].data() };

    // 2. Get all lessons for the course
    const lessonsQuery = query(
      collection(db, 'lessons'),
      where('course_id', '==', courseId),
      orderBy('order_index', 'asc')
    );
    const lessonsSnap = await getDocs(lessonsQuery);
    const totalLessons = lessonsSnap.size;

    // 3. Get completed lessons
    const progressQuery = query(
      collection(db, 'lesson_progress'),
      where('user_id', '==', userId),
      where('course_id', '==', courseId),
      where('completed', '==', true)
    );
    const progressSnap = await getDocs(progressQuery);
    const completedLessons = progressSnap.size;

    // 4. Calculate progress percentage
    const progressPercentage = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0;

    return {
      enrollment,
      totalLessons,
      completedLessons,
      progressPercentage,
      isCompleted: progressPercentage === 100
    };
  } catch (error) {
    console.error('Error getting course progress:', error);
    throw error;
  }
};

/**
 * Get detailed progress for all lessons in a course
 * @param {string} userId - The user ID
 * @param {string} courseId - The course ID
 * @returns {Promise<Array>} Array of lessons with their progress data
 */
export const getDetailedCourseProgress = async (userId, courseId) => {
  try {
    // Get all lessons with their progress
    const lessonsQuery = query(
      collection(db, 'lessons'),
      where('course_id', '==', courseId),
      orderBy('order_index', 'asc')
    );
    const lessonsSnap = await getDocs(lessonsQuery);
    
    const lessonProgressPromises = lessonsSnap.docs.map(async (lessonDoc) => {
      const lesson = { id: lessonDoc.id, ...lessonDoc.data() };
      
      // Check if user has progress for this lesson
      const progressId = `${userId}_${lessonDoc.id}`;
      const progressDoc = await getDoc(doc(db, 'lesson_progress', progressId));
      
      return {
        lesson,
        progress: progressDoc.exists() ? { id: progressDoc.id, ...progressDoc.data() } : null,
        completed: progressDoc.exists() ? progressDoc.data().completed : false
      };
    });

    return Promise.all(lessonProgressPromises);
  } catch (error) {
    console.error('Error getting detailed course progress:', error);
    throw error;
  }
};

/**
 * Mark a lesson as completed or update progress
 * @param {string} userId - The user ID
 * @param {string} lessonId - The lesson ID
 * @param {string} courseId - The course ID
 * @param {Object} progressData - Additional progress data (time_spent, last_position, etc.)
 * @returns {Promise<void>}
 */
export const updateLessonProgress = async (userId, lessonId, courseId, progressData = {}) => {
  try {
    const progressId = `${userId}_${lessonId}`;
    const progressRef = doc(db, 'lesson_progress', progressId);
    const progressDoc = await getDoc(progressRef);

    const now = serverTimestamp();

    if (progressDoc.exists()) {
      // Update existing progress
      await updateDoc(progressRef, {
        ...progressData,
        updated_at: now,
      });
    } else {
      // Create new progress record
      await setDoc(progressRef, {
        user_id: userId,
        lesson_id: lessonId,
        course_id: courseId,
        completed: progressData.completed || false,
        time_spent: progressData.time_spent || 0,
        last_position: progressData.last_position || 0,
        started_at: now,
        updated_at: now,
        ...(progressData.completed && { completed_at: now }),
      });
    }

    // Update enrollment progress if lesson is completed
    if (progressData.completed) {
      await updateEnrollmentProgress(userId, courseId);
    }
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    throw error;
  }
};

/**
 * Update enrollment progress percentage
 * @param {string} userId - The user ID
 * @param {string} courseId - The course ID
 * @returns {Promise<void>}
 */
export const updateEnrollmentProgress = async (userId, courseId) => {
  try {
    const progress = await getCourseProgress(userId, courseId);
    
    if (progress.enrollment) {
      const enrollmentRef = doc(db, 'enrollments', progress.enrollment.id);
      await updateDoc(enrollmentRef, {
        progress_percentage: progress.progressPercentage,
        completed_lessons: progress.completedLessons,
        total_lessons: progress.totalLessons,
        status: progress.isCompleted ? 'completed' : 'active',
        updated_at: serverTimestamp(),
        ...(progress.isCompleted && { completed_at: serverTimestamp() }),
      });
    }
  } catch (error) {
    console.error('Error updating enrollment progress:', error);
    throw error;
  }
};

/**
 * Get next lesson for a user in a course
 * @param {string} userId - The user ID
 * @param {string} courseId - The course ID
 * @returns {Promise<Object|null>} Next incomplete lesson or null
 */
export const getNextLesson = async (userId, courseId) => {
  try {
    const detailedProgress = await getDetailedCourseProgress(userId, courseId);
    
    // Find first incomplete lesson
    const nextLesson = detailedProgress.find(item => !item.completed);
    
    return nextLesson?.lesson || null;
  } catch (error) {
    console.error('Error getting next lesson:', error);
    throw error;
  }
};

/**
 * Get user's progress across all enrolled courses
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of course progress data
 */
export const getAllUserProgress = async (userId) => {
  try {
    // Get all user enrollments
    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      where('user_id', '==', userId),
      orderBy('updated_at', 'desc')
    );
    const enrollmentsSnap = await getDocs(enrollmentsQuery);

    const progressPromises = enrollmentsSnap.docs.map(async (enrollmentDoc) => {
      const enrollment = { id: enrollmentDoc.id, ...enrollmentDoc.data() };
      const courseDoc = await getDoc(doc(db, 'courses', enrollment.course_id));
      const course = courseDoc.exists() ? { id: courseDoc.id, ...courseDoc.data() } : null;

      return {
        enrollment,
        course,
        progressPercentage: enrollment.progress_percentage || 0,
        completedLessons: enrollment.completed_lessons || 0,
        totalLessons: enrollment.total_lessons || 0,
      };
    });

    return Promise.all(progressPromises);
  } catch (error) {
    console.error('Error getting all user progress:', error);
    throw error;
  }
};

// ==================== LESSON PROGRESS QUERIES ====================

/**
 * Get lesson progress for a specific lesson
 * @param {string} userId - The user ID
 * @param {string} lessonId - The lesson ID
 * @returns {Promise<Object|null>} Lesson progress data or null
 */
export const getLessonProgress = async (userId, lessonId) => {
  try {
    const progressId = `${userId}_${lessonId}`;
    const progressDoc = await getDoc(doc(db, 'lesson_progress', progressId));
    
    return progressDoc.exists() ? { id: progressDoc.id, ...progressDoc.data() } : null;
  } catch (error) {
    console.error('Error getting lesson progress:', error);
    throw error;
  }
};

/**
 * Check if a lesson is completed
 * @param {string} userId - The user ID
 * @param {string} lessonId - The lesson ID
 * @returns {Promise<boolean>} True if completed
 */
export const isLessonCompleted = async (userId, lessonId) => {
  try {
    const progress = await getLessonProgress(userId, lessonId);
    return progress?.completed || false;
  } catch (error) {
    console.error('Error checking lesson completion:', error);
    return false;
  }
};
