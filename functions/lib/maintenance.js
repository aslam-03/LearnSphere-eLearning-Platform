"use strict";
/**
 * ============================================
 * MAINTENANCE CLOUD FUNCTIONS
 * ============================================
 *
 * Scheduled cleanup jobs and data integrity checks.
 * Runs on Cloud Scheduler to maintain platform health.
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
exports.cleanupOrphanedProgress = exports.recalculateCourseStats = exports.cleanupTempUploads = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const storage = admin.storage();
/**
 * Delete temporary upload files older than 24 hours
 * Scheduled: Runs daily at 2 AM UTC
 */
exports.cleanupTempUploads = functions.pubsub
    .schedule('0 2 * * *')
    .timeZone('UTC')
    .onRun(async (context) => {
    const bucket = storage.bucket();
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    try {
        const [files] = await bucket.getFiles({ prefix: 'temp/' });
        let deletedCount = 0;
        for (const file of files) {
            const [metadata] = await file.getMetadata();
            const createdTime = metadata.timeCreated ? new Date(metadata.timeCreated).getTime() : 0;
            if (createdTime > 0 && createdTime < cutoffTime) {
                await file.delete();
                deletedCount++;
            }
        }
        functions.logger.info(`Deleted ${deletedCount} temporary files`);
        return null;
    }
    catch (error) {
        functions.logger.error('Error cleaning up temp uploads:', error);
        return null;
    }
});
/**
 * Recalculate course statistics for data integrity
 * Scheduled: Runs weekly on Sunday at 3 AM UTC
 */
exports.recalculateCourseStats = functions.pubsub
    .schedule('0 3 * * 0')
    .timeZone('UTC')
    .onRun(async (context) => {
    try {
        const coursesSnapshot = await db.collection('courses').get();
        for (const courseDoc of coursesSnapshot.docs) {
            const courseId = courseDoc.id;
            // Count lessons
            const lessonsSnapshot = await db
                .collection('lessons')
                .where('courseId', '==', courseId)
                .get();
            // Count enrollments
            const enrollmentsSnapshot = await db
                .collection('enrollments')
                .where('course_id', '==', courseId)
                .get();
            // Update course stats
            await courseDoc.ref.update({
                lessonCount: lessonsSnapshot.size,
                enrollmentCount: enrollmentsSnapshot.size,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        functions.logger.info(`Recalculated stats for ${coursesSnapshot.size} courses`);
        return null;
    }
    catch (error) {
        functions.logger.error('Error recalculating course stats:', error);
        return null;
    }
});
/**
 * Clean up orphaned lesson progress records
 * Scheduled: Runs monthly on the 1st at 4 AM UTC
 */
exports.cleanupOrphanedProgress = functions.pubsub
    .schedule('0 4 1 * *')
    .timeZone('UTC')
    .onRun(async (context) => {
    try {
        const progressSnapshot = await db.collection('lesson_progress').get();
        let deletedCount = 0;
        for (const progressDoc of progressSnapshot.docs) {
            const data = progressDoc.data();
            const lessonId = data.lesson_id;
            // Check if lesson still exists
            const lessonDoc = await db.collection('lessons').doc(lessonId).get();
            if (!lessonDoc.exists) {
                await progressDoc.ref.delete();
                deletedCount++;
            }
        }
        functions.logger.info(`Deleted ${deletedCount} orphaned progress records`);
        return null;
    }
    catch (error) {
        functions.logger.error('Error cleaning up orphaned progress:', error);
        return null;
    }
});
//# sourceMappingURL=maintenance.js.map