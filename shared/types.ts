// Firebase-compatible shared types for LearnSphere
import { z } from "zod";

// =====================
// USER TYPES
// =====================
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'instructor' | 'learner';
  points: number;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const userSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  photoURL: z.string().url().optional(),
  role: z.enum(['admin', 'instructor', 'learner']).default('learner'),
  points: z.number().int().min(0).default(0),
  bio: z.string().optional(),
});

export type InsertUser = z.infer<typeof userSchema>;

// =====================
// COURSE TYPES
// =====================
export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  instructorId: string;
  published: boolean;
  price?: number;
  visibility: 'everyone' | 'signed_in';
  accessRule: 'open' | 'invitation' | 'payment';
  coverImage?: string;
  tags: string[];
  category?: string;
  totalDuration?: number;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
  // Populated fields
  instructor?: User;
  lessons?: Lesson[];
  quizzes?: Quiz[];
}

export const courseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().default(''),
  shortDescription: z.string().optional(),
  instructorId: z.string().optional(),
  published: z.boolean().default(false),
  price: z.number().int().min(0).optional(),
  visibility: z.enum(['everyone', 'signed_in']).default('everyone'),
  accessRule: z.enum(['open', 'invitation', 'payment']).default('open'),
  coverImage: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
  totalDuration: z.number().int().min(0).optional(),
});

export type InsertCourse = z.infer<typeof courseSchema>;

// =====================
// LESSON TYPES
// =====================
export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  type: 'video' | 'document' | 'image' | 'quiz';
  content?: string;
  description?: string;
  order: number;
  duration?: number;
  allowDownload: boolean;
  responsibleId?: string;
  createdAt: Date;
  updatedAt: Date;
  // Populated fields
  attachments?: Attachment[];
  progress?: Progress;
}

export const lessonSchema = z.object({
  courseId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  type: z.enum(['video', 'document', 'image', 'quiz']),
  content: z.string().optional(),
  description: z.string().optional(),
  order: z.number().int().min(0).default(0),
  duration: z.number().int().min(0).optional(),
  allowDownload: z.boolean().default(false),
  responsibleId: z.string().optional(),
});

export type InsertLesson = z.infer<typeof lessonSchema>;

// =====================
// ATTACHMENT TYPES
// =====================
export interface Attachment {
  id: string;
  lessonId: string;
  type: 'file' | 'link';
  name: string;
  url: string;
  createdAt: Date;
}

export const attachmentSchema = z.object({
  lessonId: z.string(),
  type: z.enum(['file', 'link']),
  name: z.string().min(1),
  url: z.string().url(),
});

export type InsertAttachment = z.infer<typeof attachmentSchema>;

// =====================
// QUIZ TYPES
// =====================
export interface QuizRewards {
  attempt1: number;
  attempt2: number;
  attempt3: number;
  attempt4Plus: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  lessonId?: string;
  title: string;
  description?: string;
  totalQuestions: number;
  rewards: QuizRewards;
  createdAt: Date;
  updatedAt: Date;
  // Populated fields
  questions?: Question[];
}

export const quizSchema = z.object({
  courseId: z.string().optional(),
  lessonId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  rewards: z.object({
    attempt1: z.number().int().min(0).default(10),
    attempt2: z.number().int().min(0).default(7),
    attempt3: z.number().int().min(0).default(5),
    attempt4Plus: z.number().int().min(0).default(3),
  }).default({
    attempt1: 10,
    attempt2: 7,
    attempt3: 5,
    attempt4Plus: 3
  }),
});

export type InsertQuiz = z.infer<typeof quizSchema>;

// =====================
// QUESTION TYPES
// =====================
export interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  quizId: string;
  text: string;
  options: QuestionOption[];
  points: number;
  order: number;
}

export const questionSchema = z.object({
  quizId: z.string().optional(),
  text: z.string().min(1, "Question text is required"),
  options: z.array(z.object({
    text: z.string().min(1),
    isCorrect: z.boolean(),
  })).min(2, "At least 2 options required"),
  points: z.number().int().min(0).default(10),
  order: z.number().int().min(0).default(0),
});

export type InsertQuestion = z.infer<typeof questionSchema>;

// =====================
// ENROLLMENT TYPES
// =====================
export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: 'active' | 'completed';
  enrolledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  timeSpent: number;
  // Populated fields
  course?: Course;
  user?: User;
}

export const enrollmentSchema = z.object({
  userId: z.string(),
  courseId: z.string(),
  status: z.enum(['active', 'completed']).default('active'),
});

export type InsertEnrollment = z.infer<typeof enrollmentSchema>;

// =====================
// PROGRESS TYPES
// =====================
export interface Progress {
  id: string;
  odId: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  viewedAt: Date;
  completedAt?: Date;
}

export const progressSchema = z.object({
  userId: z.string(),
  lessonId: z.string(),
  completed: z.boolean().default(false),
});

export type InsertProgress = z.infer<typeof progressSchema>;

// =====================
// QUIZ ATTEMPT TYPES
// =====================
export interface QuizAnswer {
  questionId: string;
  selectedOption: number;
  correct: boolean;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  maxScore: number;
  attemptNumber: number;
  answers: QuizAnswer[];
  pointsEarned: number;
  completedAt: Date;
}

export const quizAttemptSchema = z.object({
  quizId: z.string(),
  answers: z.array(z.object({
    questionId: z.string(),
    selectedOption: z.number().int().min(0),
  })),
});

export type InsertQuizAttempt = z.infer<typeof quizAttemptSchema>;

// =====================
// REVIEW TYPES
// =====================
export interface Review {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
  // Populated fields
  user?: User;
}

export const reviewSchema = z.object({
  courseId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export type InsertReview = z.infer<typeof reviewSchema>;

// =====================
// INVITATION TYPES
// =====================
export interface Invitation {
  id: string;
  courseId: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired';
  invitedBy: string;
  createdAt: Date;
  expiresAt: Date;
}

export const invitationSchema = z.object({
  courseId: z.string(),
  email: z.string().email(),
});

export type InsertInvitation = z.infer<typeof invitationSchema>;

// =====================
// BADGE TYPES
// =====================
export interface Badge {
  name: string;
  points: number;
  icon: string;
}

export const BADGE_LEVELS: Badge[] = [
  { name: 'Newbie', points: 20, icon: '🌱' },
  { name: 'Explorer', points: 40, icon: '🔍' },
  { name: 'Achiever', points: 60, icon: '🏆' },
  { name: 'Specialist', points: 80, icon: '⭐' },
  { name: 'Expert', points: 100, icon: '💎' },
  { name: 'Master', points: 120, icon: '👑' },
];

export function getUserBadge(points: number): { current: Badge | null; next: Badge | null } {
  let current: Badge | null = null;
  let next: Badge | null = BADGE_LEVELS[0];

  for (let i = BADGE_LEVELS.length - 1; i >= 0; i--) {
    if (points >= BADGE_LEVELS[i].points) {
      current = BADGE_LEVELS[i];
      next = BADGE_LEVELS[i + 1] || null;
      break;
    }
  }

  return { current, next };
}

// =====================
// REPORTING TYPES
// =====================
export interface ReportingOverview {
  totalParticipants: number;
  yetToStart: number;
  inProgress: number;
  completed: number;
}

export interface ReportingDetail {
  courseId: string;
  courseName: string;
  userName: string;
  userId: string;
  enrolledDate: Date;
  startDate: Date | null;
  timeSpent: number;
  completionPercentage: number;
  completedDate: Date | null;
  status: 'yet_to_start' | 'in_progress' | 'completed';
}

// =====================
// API RESPONSE TYPES
// =====================
export interface ApiError {
  message: string;
  field?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CourseWithProgress extends Course {
  completionPercentage: number;
  isEnrolled: boolean;
  enrollmentStatus?: 'active' | 'completed';
}

export interface QuizWithAttempts extends Quiz {
  attempts?: QuizAttempt[];
  bestScore?: number;
  lastAttempt?: QuizAttempt;
}

// =====================
// FORM HELPER SCHEMAS
// =====================
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(2, "Name must be at least 2 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
