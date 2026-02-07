import { Timestamp } from 'firebase/firestore';

// ==================== ENUMS ====================

export type UserRole = 'admin' | 'instructor' | 'learner';

export type CourseStatus = 'draft' | 'published';

export type CourseVisibility = 'everyone' | 'signed_in';

export type CourseAccessType = 'open' | 'invitation';

export type LessonType = 'video' | 'document' | 'image' | 'quiz';

export type EnrollmentStatus = 'active' | 'completed' | 'dropped';

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

// ==================== 1. USERS COLLECTION ====================

export interface User {
  id: string; // Document ID (same as Firebase Auth UID)
  email: string;
  display_name: string;
  role: UserRole;
  avatar_url?: string; // R2 URL for profile image
  total_points: number;
  current_badge_id?: string; // Reference to badges collection
  bio?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  last_login?: Timestamp;
}

// ==================== 2. COURSES COLLECTION ====================

export interface Course {
  id: string; // Document ID
  title: string;
  description: string;
  instructor_id: string; // Reference to users collection
  instructor_name: string; // Denormalized for quick access
  thumbnail_url?: string; // R2 URL for course thumbnail
  status: CourseStatus;
  visibility: CourseVisibility;
  access_type: CourseAccessType;
  category?: string;
  tags?: string[];
  lesson_count: number;
  total_duration: number; // in minutes
  enrollment_count: number;
  average_rating?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  created_at: Timestamp;
  updated_at: Timestamp;
  published_at?: Timestamp;
}

// ==================== 3. LESSONS COLLECTION ====================

export interface Lesson {
  id: string; // Document ID
  course_id: string; // Reference to courses collection
  title: string;
  description?: string;
  type: LessonType;
  content_url?: string; // R2 URL for video/document/image
  content_text?: string; // For text-based lessons
  duration?: number; // in minutes (for videos)
  order_index: number; // For ordering lessons within a course
  quiz_id?: string; // Reference to quizzes collection (if type is 'quiz')
  points_awarded: number; // Points for completing this lesson
  is_required: boolean; // Whether lesson is required for course completion
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ==================== 4. QUIZZES COLLECTION ====================

export interface Quiz {
  id: string; // Document ID
  lesson_id: string; // Reference to lessons collection
  title: string;
  description?: string;
  passing_score: number; // Percentage (0-100)
  time_limit?: number; // in minutes
  max_attempts?: number; // null means unlimited
  points_awarded: number; // Base points for passing
  shuffle_questions: boolean;
  show_correct_answers: boolean; // After completion
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Subcollection: quizzes/{quizId}/questions
export interface QuizQuestion {
  id: string; // Document ID
  question_text: string;
  question_type: QuestionType;
  options?: QuizOption[]; // For multiple choice
  correct_answer: string | string[]; // string for single, array for multiple
  explanation?: string; // Shown after answering
  points: number;
  order_index: number;
  media_url?: string; // R2 URL for images/videos in questions
}

export interface QuizOption {
  id: string;
  text: string;
  is_correct: boolean;
}

// ==================== 5. ENROLLMENTS COLLECTION ====================

export interface Enrollment {
  id: string; // Document ID
  user_id: string; // Reference to users collection
  course_id: string; // Reference to courses collection
  status: EnrollmentStatus;
  progress_percentage: number; // 0-100
  completed_lessons: number;
  total_lessons: number;
  last_accessed_lesson_id?: string;
  enrolled_at: Timestamp;
  completed_at?: Timestamp;
  updated_at: Timestamp;
}

// ==================== 6. LESSON PROGRESS COLLECTION ====================

export interface LessonProgress {
  id: string; // Document ID (composite: userId_lessonId)
  user_id: string; // Reference to users collection
  lesson_id: string; // Reference to lessons collection
  course_id: string; // Reference to courses collection (denormalized)
  completed: boolean;
  time_spent: number; // in seconds
  last_position?: number; // For video lessons (in seconds)
  completed_at?: Timestamp;
  started_at: Timestamp;
  updated_at: Timestamp;
}

// ==================== 7. QUIZ ATTEMPTS COLLECTION ====================

export interface QuizAttempt {
  id: string; // Document ID
  user_id: string; // Reference to users collection
  quiz_id: string; // Reference to quizzes collection
  lesson_id: string; // Reference to lessons collection
  course_id: string; // Reference to courses collection
  attempt_number: number; // 1, 2, 3, etc.
  score: number; // Percentage (0-100)
  points_earned: number; // Actual points with decay applied
  answers: QuizAnswer[];
  passed: boolean;
  time_taken?: number; // in seconds
  started_at: Timestamp;
  completed_at: Timestamp;
}

export interface QuizAnswer {
  question_id: string;
  answer: string | string[];
  is_correct: boolean;
  points_earned: number;
}

// ==================== 8. BADGES COLLECTION ====================

export interface Badge {
  id: string; // Document ID
  name: string;
  description: string;
  icon_url: string; // R2 URL for badge icon
  points_required: number; // Minimum points to earn this badge
  color?: string; // Hex color for UI
  tier: number; // 1 = lowest, higher = more prestigious
  created_at: Timestamp;
}

// ==================== HELPER TYPES ====================

export interface UserBadge {
  user_id: string;
  badge_id: string;
  earned_at: Timestamp;
}

// For course invitations (if using invitation-based access)
export interface CourseInvitation {
  id: string;
  course_id: string;
  email: string;
  invited_by: string; // instructor_id
  status: 'pending' | 'accepted' | 'expired';
  created_at: Timestamp;
  expires_at: Timestamp;
}

// ==================== QUERY RESULT TYPES ====================

export interface CourseProgressResult {
  enrollment: Enrollment | null;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  isCompleted: boolean;
}

export interface DetailedLessonProgress {
  lesson: Lesson;
  progress: LessonProgress | null;
  completed: boolean;
}

export interface QuizPointsCalculation {
  attemptNumber: number;
  pointsEarned: number;
  decayFactor: number;
}
