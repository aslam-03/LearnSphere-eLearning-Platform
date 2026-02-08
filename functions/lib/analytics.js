"use strict";
/**
 * ============================================
 * ANALYTICS CLOUD FUNCTIONS
 * ============================================
 *
 * Real-time analytics aggregation for instructors and admins.
 * Tracks course views, enrollments, completion rates, and quiz scores.
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
exports.updateCourseQuizAverage = exports.updateCourseCompletionStats = exports.incrementCourseViews = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Increment course view count when enrollment is created
 * Triggered on: enrollment document created
 */
exports.incrementCourseViews = functions.firestore
    .document('enrollments/{enrollmentId}')
    .onCreate(async (snap, context) => {
    const enrollment = snap.data();
    const courseId = enrollment.course_id;
    try {
        await db.collection('courses').doc(courseId).update({
            viewsCount: admin.firestore.FieldValue.increment(1),
            enrollmentCount: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        functions.logger.info(`Incremented views for course ${courseId}`);
        return null;
    }
    catch (error) {
        functions.logger.error('Error incrementing course views:', error);
        return null;
    }
});
/**
 * Calculate and update course completion statistics
 * Triggered on: enrollment status update to 'completed'
 */
exports.updateCourseCompletionStats = functions.firestore
    .document('enrollments/{enrollmentId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    // Only trigger when course is marked completed
    if (before.status === 'completed' || after.status !== 'completed') {
        return null;
    }
    const courseId = after.course_id;
    try {
        // Get all enrollments for this course
        const enrollmentsSnapshot = await db
            .collection('enrollments')
            .where('course_id', '==', courseId)
            .get();
        const totalEnrollments = enrollmentsSnapshot.size;
        const completedEnrollments = enrollmentsSnapshot.docs.filter((doc) => doc.data().status === 'completed').length;
        const completionRate = totalEnrollments > 0
            ? Math.round((completedEnrollments / totalEnrollments) * 100)
            : 0;
        // Update course analytics
        await db.collection('courses').doc(courseId).update({
            completionRate,
            completedCount: completedEnrollments,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        functions.logger.info(`Updated completion rate for course ${courseId}: ${completionRate}%`);
        return null;
    }
    catch (error) {
        functions.logger.error('Error updating course completion stats:', error);
        return null;
    }
});
/**
 * Calculate average quiz score for a course
 * Triggered on: quiz_attempts document created
 */
exports.updateCourseQuizAverage = functions.firestore
    .document('quiz_attempts/{attemptId}')
    .onCreate(async (snap, context) => {
    const attempt = snap.data();
    const courseId = attempt.course_id;
    try {
        // Get all quiz attempts for this course
        const attemptsSnapshot = await db
            .collection('quiz_attempts')
            .where('course_id', '==', courseId)
            .get();
        const scores = attemptsSnapshot.docs.map((doc) => doc.data().score);
        const averageScore = scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;
        // Update course analytics
        await db.collection('courses').doc(courseId).update({
            averageQuizScore: averageScore,
            totalQuizAttempts: scores.length,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        functions.logger.info(`Updated average quiz score for course ${courseId}: ${averageScore}%`);
        return null;
    }
    catch (error) {
        functions.logger.error('Error updating course quiz average:', error);
        return null;
    }
});
//# sourceMappingURL=analytics.js.map