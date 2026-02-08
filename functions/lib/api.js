"use strict";
/**
 * ============================================
 * CALLABLE API FUNCTIONS
 * ============================================
 *
 * HTTP callable functions for privileged operations.
 * These are invoked from the frontend using Firebase Functions SDK.
 * All functions enforce authentication and role-based access.
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
exports.bulkEnroll = exports.generateCertificate = exports.createInstructor = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Create a new instructor account (Admin only)
 * Callable from frontend: firebase.functions().httpsCallable('createInstructor')
 */
exports.createInstructor = functions.https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Verify admin role
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();
    if (!userData || userData.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can create instructors');
    }
    const { email, password, displayName } = data;
    // Validate input
    if (!email || !password || !displayName) {
        throw new functions.https.HttpsError('invalid-argument', 'Email, password, and display name are required');
    }
    try {
        // Create Firebase Auth user
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName,
        });
        // Create Firestore user document
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email,
            displayName,
            role: 'instructor',
            total_points: 0,
            current_badge_id: null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        functions.logger.info(`Admin ${context.auth.uid} created instructor ${userRecord.uid}`);
        return {
            success: true,
            instructorId: userRecord.uid,
            message: 'Instructor account created successfully',
        };
    }
    catch (error) {
        functions.logger.error('Error creating instructor:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
/**
 * Generate course completion certificate (Authenticated users)
 * Callable from frontend: firebase.functions().httpsCallable('generateCertificate')
 */
exports.generateCertificate = functions.https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { courseId } = data;
    const userId = context.auth.uid;
    // Validate input
    if (!courseId) {
        throw new functions.https.HttpsError('invalid-argument', 'Course ID is required');
    }
    try {
        // Verify user completed the course
        const enrollmentSnapshot = await db
            .collection('enrollments')
            .where('user_id', '==', userId)
            .where('course_id', '==', courseId)
            .where('status', '==', 'completed')
            .limit(1)
            .get();
        if (enrollmentSnapshot.empty) {
            throw new functions.https.HttpsError('failed-precondition', 'Course not completed');
        }
        // Get course and user details
        const courseDoc = await db.collection('courses').doc(courseId).get();
        const userDoc = await db.collection('users').doc(userId).get();
        if (!courseDoc.exists || !userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Course or user not found');
        }
        const course = courseDoc.data();
        const user = userDoc.data();
        const enrollment = enrollmentSnapshot.docs[0].data();
        // Create certificate record
        const certificateData = {
            userId,
            courseId,
            courseName: course === null || course === void 0 ? void 0 : course.title,
            userName: user === null || user === void 0 ? void 0 : user.displayName,
            completedAt: enrollment.completed_at,
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
            certificateId: `CERT-${Date.now()}-${userId.substring(0, 6)}`,
        };
        const certificateRef = await db.collection('certificates').add(certificateData);
        functions.logger.info(`Generated certificate ${certificateRef.id} for user ${userId}`);
        return {
            success: true,
            certificateId: certificateRef.id,
            certificateData,
            message: 'Certificate generated successfully',
        };
    }
    catch (error) {
        functions.logger.error('Error generating certificate:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
/**
 * Bulk enroll users in a course (Instructor/Admin only)
 * Callable from frontend: firebase.functions().httpsCallable('bulkEnroll')
 */
exports.bulkEnroll = functions.https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Verify instructor or admin role
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();
    if (!userData || !['admin', 'instructor'].includes(userData.role)) {
        throw new functions.https.HttpsError('permission-denied', 'Only instructors and admins can bulk enroll');
    }
    const { courseId, userEmails } = data;
    // Validate input
    if (!courseId || !Array.isArray(userEmails) || userEmails.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Course ID and user emails are required');
    }
    try {
        const results = {
            success: [],
            failed: [],
        };
        for (const email of userEmails) {
            try {
                // Find user by email
                const userRecord = await admin.auth().getUserByEmail(email);
                const userId = userRecord.uid;
                // Check if already enrolled
                const existingEnrollment = await db
                    .collection('enrollments')
                    .where('user_id', '==', userId)
                    .where('course_id', '==', courseId)
                    .limit(1)
                    .get();
                if (!existingEnrollment.empty) {
                    results.failed.push({ email, error: 'Already enrolled' });
                    continue;
                }
                // Create enrollment
                await db.collection('enrollments').add({
                    user_id: userId,
                    course_id: courseId,
                    status: 'active',
                    progress_percentage: 0,
                    completed_lessons: 0,
                    total_lessons: 0,
                    enrolled_at: admin.firestore.FieldValue.serverTimestamp(),
                    updated_at: admin.firestore.FieldValue.serverTimestamp(),
                });
                results.success.push(email);
            }
            catch (error) {
                results.failed.push({ email, error: error.message });
            }
        }
        functions.logger.info(`Bulk enrolled ${results.success.length} users in course ${courseId}`);
        return {
            success: true,
            results,
            message: `Enrolled ${results.success.length} users, ${results.failed.length} failed`,
        };
    }
    catch (error) {
        functions.logger.error('Error in bulk enroll:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=api.js.map