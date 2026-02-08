"use strict";
/**
 * ============================================
 * GAMIFICATION CLOUD FUNCTIONS
 * ============================================
 *
 * Handles all point calculations, badge upgrades, and reward logic.
 * These functions are triggered by Firestore events and are 100% server-side.
 *
 * FEATURES:
 * 1. Award points when lessons are completed
 * 2. Calculate quiz scores with decay for retries
 * 3. Upgrade badges automatically when thresholds are reached
 * 4. Award bonus points for course completion
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.awardCourseCompletionBonus = exports.calculateQuizScore = exports.awardLessonPoints = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Award points when a lesson is marked as completed
 * Triggered on: lesson_progress document created/updated
 * Points: 10 per lesson completion (first time only)
 */
exports.awardLessonPoints = functions.firestore
    .document('lesson_progress/{progressId}')
    .onWrite(async (change, context) => {
    const after = change.after.exists ? change.after.data() : null;
    const before = change.before.exists ? change.before.data() : null;
    // Only award points if lesson was just completed (not already completed)
    if (!after || !after.completed)
        return null;
    if (before && before.completed)
        return null; // Already completed before
    const userId = after.user_id;
    const pointsToAward = 10; // Base points per lesson
    try {
        // Update user's total points
        const userRef = db.collection('users').doc(userId);
        await userRef.update({
            total_points: admin.firestore.FieldValue.increment(pointsToAward),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Check for badge upgrade
        await checkAndUpgradeBadge(userId);
        functions.logger.info(`Awarded ${pointsToAward} points to user ${userId} for lesson completion`);
        return null;
    }
    catch (error) {
        functions.logger.error('Error awarding lesson points:', error);
        return null;
    }
});
/**
 * Calculate quiz score and award points with decay
 * Triggered on: quiz_attempts document created
 * Formula: points = basePoints * (score/100) * (0.8 ^ (attemptNumber - 1))
 */
exports.calculateQuizScore = functions.firestore
    .document('quiz_attempts/{attemptId}')
    .onCreate(async (snap, context) => {
    const attempt = snap.data();
    const { user_id, quiz_id, score, attempt_number, passed } = attempt;
    if (!passed) {
        functions.logger.info(`User ${user_id} failed quiz ${quiz_id}, no points awarded`);
        return null;
    }
    try {
        // Get quiz base points
        const quizDoc = await db.collection('quizzes').doc(quiz_id).get();
        if (!quizDoc.exists) {
            functions.logger.error(`Quiz ${quiz_id} not found`);
            return null;
        }
        const quiz = quizDoc.data();
        const basePoints = (quiz === null || quiz === void 0 ? void 0 : quiz.points_awarded) || 20;
        // Calculate points with decay
        const decayFactor = Math.pow(0.8, attempt_number - 1);
        const pointsEarned = Math.round(basePoints * (score / 100) * decayFactor);
        // Update attempt with calculated points
        await snap.ref.update({
            points_earned: pointsEarned,
            decay_factor: decayFactor,
        });
        // Award points to user
        const userRef = db.collection('users').doc(user_id);
        await userRef.update({
            total_points: admin.firestore.FieldValue.increment(pointsEarned),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Check for badge upgrade
        await checkAndUpgradeBadge(user_id);
        functions.logger.info(`Awarded ${pointsEarned} points to user ${user_id} for quiz (attempt ${attempt_number})`);
        return null;
    }
    catch (error) {
        functions.logger.error('Error calculating quiz score:', error);
        return null;
    }
});
/**
 * Award bonus points for completing an entire course
 * Triggered on: enrollment document updated (when status becomes 'completed')
 * Bonus: 50 points per course completion
 */
exports.awardCourseCompletionBonus = functions.firestore
    .document('enrollments/{enrollmentId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    // Only trigger if status just changed to completed
    if (before.status === 'completed' || after.status !== 'completed') {
        return null;
    }
    const userId = after.user_id;
    const courseId = after.course_id;
    const bonusPoints = 50;
    try {
        // Award bonus points
        const userRef = db.collection('users').doc(userId);
        await userRef.update({
            total_points: admin.firestore.FieldValue.increment(bonusPoints),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Check for badge upgrade
        await checkAndUpgradeBadge(userId);
        functions.logger.info(`Awarded ${bonusPoints} bonus points to user ${userId} for completing course ${courseId}`);
        return null;
    }
    catch (error) {
        functions.logger.error('Error awarding course completion bonus:', error);
        return null;
    }
});
/**
 * Check if user qualifies for a badge upgrade and update if so
 * @param userId - The user ID to check
 */
async function checkAndUpgradeBadge(userId) {
    try {
        // Get user's current points
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists)
            return;
        const userData = userDoc.data();
        const totalPoints = (userData === null || userData === void 0 ? void 0 : userData.total_points) || 0;
        const currentBadgeId = userData === null || userData === void 0 ? void 0 : userData.current_badge_id;
        // Find the highest badge the user qualifies for
        const badgesSnapshot = await db
            .collection('badges')
            .where('points_required', '<=', totalPoints)
            .orderBy('points_required', 'desc')
            .limit(1)
            .get();
        if (badgesSnapshot.empty)
            return;
        const topBadge = badgesSnapshot.docs[0];
        const topBadgeId = topBadge.id;
        // Only update if it's a different (higher) badge
        if (currentBadgeId !== topBadgeId) {
            await db.collection('users').doc(userId).update({
                current_badge_id: topBadgeId,
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });
            functions.logger.info(`User ${userId} upgraded to badge ${topBadgeId} with ${totalPoints} points`);
        }
    }
    catch (error) {
        functions.logger.error('Error checking badge upgrade:', error);
    }
}
//# sourceMappingURL=gamification.js.map