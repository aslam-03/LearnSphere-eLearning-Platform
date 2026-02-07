import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ==================== QUIZ ATTEMPTS ====================

/**
 * Calculate points with decay based on attempt number
 * @param {string} userId - The user ID
 * @param {string} quizId - The quiz ID
 * @param {number} score - The quiz score (0-100)
 * @param {number} basePoints - Base points for the quiz
 * @returns {Promise<Object>} Calculation result with attempt number and points
 */
export const calculateQuizPoints = async (userId, quizId, score, basePoints) => {
  try {
    // Get previous attempts
    const attemptsQuery = query(
      collection(db, 'quiz_attempts'),
      where('user_id', '==', userId),
      where('quiz_id', '==', quizId),
      orderBy('attempt_number', 'desc')
    );
    const attemptsSnap = await getDocs(attemptsQuery);
    const attemptNumber = attemptsSnap.size + 1;

    // Apply decay formula: points = basePoints * (score/100) * (0.8 ^ (attempt - 1))
    const decayFactor = Math.pow(0.8, attemptNumber - 1);
    const pointsEarned = Math.round(basePoints * (score / 100) * decayFactor);

    return {
      attemptNumber,
      pointsEarned,
      decayFactor,
      maxPossiblePoints: basePoints,
      scorePercentage: score
    };
  } catch (error) {
    console.error('Error calculating quiz points:', error);
    throw error;
  }
};

/**
 * Submit a quiz attempt
 * @param {Object} attemptData - Quiz attempt data
 * @returns {Promise<string>} The attempt document ID
 */
export const submitQuizAttempt = async (attemptData) => {
  try {
    const { user_id, quiz_id, lesson_id, course_id, score, answers, time_taken } = attemptData;

    // Get quiz details to check passing score and points
    const quizDoc = await getDoc(doc(db, 'quizzes', quiz_id));
    if (!quizDoc.exists()) {
      throw new Error('Quiz not found');
    }

    const quiz = { id: quizDoc.id, ...quizDoc.data() };
    const passed = score >= quiz.passing_score;

    // Calculate points with decay
    const pointsCalculation = await calculateQuizPoints(
      user_id,
      quiz_id,
      score,
      quiz.points_awarded
    );

    // Create quiz attempt record
    const attemptRef = await addDoc(collection(db, 'quiz_attempts'), {
      user_id,
      quiz_id,
      lesson_id,
      course_id,
      attempt_number: pointsCalculation.attemptNumber,
      score,
      points_earned: passed ? pointsCalculation.pointsEarned : 0,
      answers,
      passed,
      time_taken: time_taken || null,
      started_at: attemptData.started_at || serverTimestamp(),
      completed_at: serverTimestamp(),
    });

    // If passed, award points to user
    if (passed) {
      await updateUserPointsAndBadge(user_id, pointsCalculation.pointsEarned);
      
      // Mark lesson as completed if not already
      await markLessonCompleted(user_id, lesson_id, course_id);
    }

    return attemptRef.id;
  } catch (error) {
    console.error('Error submitting quiz attempt:', error);
    throw error;
  }
};

/**
 * Get quiz attempts for a user and quiz
 * @param {string} userId - The user ID
 * @param {string} quizId - The quiz ID
 * @returns {Promise<Array>} Array of quiz attempts
 */
export const getQuizAttempts = async (userId, quizId) => {
  try {
    const attemptsQuery = query(
      collection(db, 'quiz_attempts'),
      where('user_id', '==', userId),
      where('quiz_id', '==', quizId),
      orderBy('attempt_number', 'desc')
    );
    const attemptsSnap = await getDocs(attemptsQuery);
    
    return attemptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting quiz attempts:', error);
    throw error;
  }
};

/**
 * Get best quiz attempt for a user
 * @param {string} userId - The user ID
 * @param {string} quizId - The quiz ID
 * @returns {Promise<Object|null>} Best attempt or null
 */
export const getBestQuizAttempt = async (userId, quizId) => {
  try {
    const attempts = await getQuizAttempts(userId, quizId);
    
    if (attempts.length === 0) {
      return null;
    }

    // Find attempt with highest score
    return attempts.reduce((best, current) => 
      (current.score > best.score) ? current : best
    );
  } catch (error) {
    console.error('Error getting best quiz attempt:', error);
    throw error;
  }
};

/**
 * Check if user can attempt a quiz (based on max attempts)
 * @param {string} userId - The user ID
 * @param {string} quizId - The quiz ID
 * @returns {Promise<Object>} Attempt eligibility status
 */
export const canAttemptQuiz = async (userId, quizId) => {
  try {
    const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
    if (!quizDoc.exists()) {
      throw new Error('Quiz not found');
    }

    const quiz = { id: quizDoc.id, ...quizDoc.data() };
    const attempts = await getQuizAttempts(userId, quizId);
    
    const canAttempt = !quiz.max_attempts || attempts.length < quiz.max_attempts;
    const remainingAttempts = quiz.max_attempts 
      ? quiz.max_attempts - attempts.length 
      : null;

    return {
      canAttempt,
      attemptsMade: attempts.length,
      maxAttempts: quiz.max_attempts,
      remainingAttempts,
      hasPassedBefore: attempts.some(a => a.passed)
    };
  } catch (error) {
    console.error('Error checking quiz attempt eligibility:', error);
    throw error;
  }
};

// ==================== POINTS & BADGES ====================

/**
 * Update user's total points and check for badge upgrades
 * @param {string} userId - The user ID
 * @param {number} pointsToAdd - Points to add
 * @returns {Promise<Object>} Updated user data with new badge if applicable
 */
export const updateUserPointsAndBadge = async (userId, pointsToAdd) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Increment total points
    await updateDoc(userRef, {
      total_points: increment(pointsToAdd),
      updated_at: serverTimestamp()
    });

    // Get updated user data
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    const updatedPoints = userData.total_points;

    // Check for badge upgrade
    const badgesQuery = query(
      collection(db, 'badges'),
      where('points_required', '<=', updatedPoints),
      orderBy('points_required', 'desc'),
      limit(1)
    );
    const badgeSnap = await getDocs(badgesQuery);
    
    let newBadge = null;
    if (!badgeSnap.empty) {
      const topBadge = badgeSnap.docs[0];
      const currentBadgeId = userData.current_badge_id;
      
      // Only update if it's a different (higher) badge
      if (currentBadgeId !== topBadge.id) {
        await updateDoc(userRef, {
          current_badge_id: topBadge.id,
          updated_at: serverTimestamp()
        });
        newBadge = { id: topBadge.id, ...topBadge.data() };
      }
    }

    return {
      totalPoints: updatedPoints,
      pointsAdded: pointsToAdd,
      newBadge,
      badgeUpgraded: !!newBadge
    };
  } catch (error) {
    console.error('Error updating user points and badge:', error);
    throw error;
  }
};

/**
 * Get user's current badge
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} Badge data or null
 */
export const getUserBadge = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    if (!userData.current_badge_id) {
      return null;
    }

    const badgeDoc = await getDoc(doc(db, 'badges', userData.current_badge_id));
    return badgeDoc.exists() ? { id: badgeDoc.id, ...badgeDoc.data() } : null;
  } catch (error) {
    console.error('Error getting user badge:', error);
    throw error;
  }
};

/**
 * Get all available badges
 * @returns {Promise<Array>} Array of all badges sorted by points required
 */
export const getAllBadges = async () => {
  try {
    const badgesQuery = query(
      collection(db, 'badges'),
      orderBy('points_required', 'asc')
    );
    const badgesSnap = await getDocs(badgesQuery);
    
    return badgesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting all badges:', error);
    throw error;
  }
};

/**
 * Get next badge for user to achieve
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} Next badge or null if at highest
 */
export const getNextBadge = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    const currentPoints = userData.total_points || 0;

    // Get next badge above current points
    const nextBadgeQuery = query(
      collection(db, 'badges'),
      where('points_required', '>', currentPoints),
      orderBy('points_required', 'asc'),
      limit(1)
    );
    const nextBadgeSnap = await getDocs(nextBadgeQuery);
    
    if (nextBadgeSnap.empty) {
      return null; // User is at max badge
    }

    const nextBadge = nextBadgeSnap.docs[0];
    const pointsNeeded = nextBadge.data().points_required - currentPoints;

    return {
      badge: { id: nextBadge.id, ...nextBadge.data() },
      pointsNeeded,
      currentPoints
    };
  } catch (error) {
    console.error('Error getting next badge:', error);
    throw error;
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Mark a lesson as completed (used after passing quiz)
 * @param {string} userId - The user ID
 * @param {string} lessonId - The lesson ID
 * @param {string} courseId - The course ID
 * @returns {Promise<void>}
 */
const markLessonCompleted = async (userId, lessonId, courseId) => {
  try {
    const { updateLessonProgress } = await import('./progressService.js');
    await updateLessonProgress(userId, lessonId, courseId, { completed: true });
  } catch (error) {
    console.error('Error marking lesson completed:', error);
    throw error;
  }
};

/**
 * Get quiz statistics for a course
 * @param {string} userId - The user ID
 * @param {string} courseId - The course ID
 * @returns {Promise<Object>} Quiz statistics
 */
export const getCourseQuizStatistics = async (userId, courseId) => {
  try {
    const attemptsQuery = query(
      collection(db, 'quiz_attempts'),
      where('user_id', '==', userId),
      where('course_id', '==', courseId)
    );
    const attemptsSnap = await getDocs(attemptsQuery);
    const attempts = attemptsSnap.docs.map(doc => doc.data());

    const totalAttempts = attempts.length;
    const passedAttempts = attempts.filter(a => a.passed).length;
    const totalPointsEarned = attempts.reduce((sum, a) => sum + (a.points_earned || 0), 0);
    const averageScore = totalAttempts > 0
      ? attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts
      : 0;

    return {
      totalAttempts,
      passedAttempts,
      failedAttempts: totalAttempts - passedAttempts,
      totalPointsEarned,
      averageScore: Math.round(averageScore * 100) / 100
    };
  } catch (error) {
    console.error('Error getting course quiz statistics:', error);
    throw error;
  }
};
