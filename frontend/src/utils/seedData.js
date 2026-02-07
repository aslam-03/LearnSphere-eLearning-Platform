/**
 * Seed data for LearnSphere Firestore Database
 * Use this to initialize the database with sample badges and test data
 */

import { collection, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// ==================== SAMPLE BADGES ====================

export const sampleBadges = [
  {
    name: 'Newbie',
    description: 'Welcome to LearnSphere! Start your learning journey.',
    icon_url: 'https://r2.yourdomain.com/badges/newbie.png',
    points_required: 0,
    color: '#95a5a6',
    tier: 1,
  },
  {
    name: 'Explorer',
    description: 'You\'ve taken your first steps in learning!',
    icon_url: 'https://r2.yourdomain.com/badges/explorer.png',
    points_required: 100,
    color: '#3498db',
    tier: 2,
  },
  {
    name: 'Learner',
    description: 'You\'re making steady progress!',
    icon_url: 'https://r2.yourdomain.com/badges/learner.png',
    points_required: 500,
    color: '#2ecc71',
    tier: 3,
  },
  {
    name: 'Scholar',
    description: 'Your dedication to learning is impressive!',
    icon_url: 'https://r2.yourdomain.com/badges/scholar.png',
    points_required: 1500,
    color: '#9b59b6',
    tier: 4,
  },
  {
    name: 'Expert',
    description: 'You\'ve mastered multiple subjects!',
    icon_url: 'https://r2.yourdomain.com/badges/expert.png',
    points_required: 3000,
    color: '#e74c3c',
    tier: 5,
  },
  {
    name: 'Master',
    description: 'A true master of knowledge!',
    icon_url: 'https://r2.yourdomain.com/badges/master.png',
    points_required: 5000,
    color: '#f39c12',
    tier: 6,
  },
  {
    name: 'Legend',
    description: 'You are a LearnSphere legend!',
    icon_url: 'https://r2.yourdomain.com/badges/legend.png',
    points_required: 10000,
    color: '#f1c40f',
    tier: 7,
  },
];

// ==================== SEED FUNCTIONS ====================

/**
 * Seed badges into Firestore
 */
export async function seedBadges() {
  try {
    console.log('Seeding badges...');
    const promises = sampleBadges.map((badge) =>
      addDoc(collection(db, 'badges'), {
        ...badge,
        created_at: serverTimestamp(),
      })
    );
    
    await Promise.all(promises);
    console.log(`✅ Successfully seeded ${sampleBadges.length} badges`);
  } catch (error) {
    console.error('Error seeding badges:', error);
    throw error;
  }
}

/**
 * Create a sample course with lessons
 */
export async function createSampleCourse(instructorId, instructorName) {
  try {
    console.log('Creating sample course...');
    
    // Create course
    const courseRef = await addDoc(collection(db, 'courses'), {
      title: 'Introduction to Web Development',
      description: 'Learn the fundamentals of web development including HTML, CSS, and JavaScript.',
      instructor_id: instructorId,
      instructor_name: instructorName,
      thumbnail_url: 'https://r2.yourdomain.com/courses/web-dev-intro.jpg',
      status: 'published',
      visibility: 'everyone',
      access_type: 'open',
      category: 'Web Development',
      tags: ['HTML', 'CSS', 'JavaScript', 'Beginner'],
      lesson_count: 5,
      total_duration: 120,
      enrollment_count: 0,
      difficulty_level: 'beginner',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      published_at: serverTimestamp(),
    });

    console.log(`✅ Course created: ${courseRef.id}`);

    // Create lessons
    const lessons = [
      {
        course_id: courseRef.id,
        title: 'Welcome to Web Development',
        description: 'An introduction to the course and what you\'ll learn.',
        type: 'video',
        content_url: 'https://r2.yourdomain.com/lessons/welcome.mp4',
        duration: 10,
        order_index: 1,
        points_awarded: 10,
        is_required: true,
      },
      {
        course_id: courseRef.id,
        title: 'HTML Basics',
        description: 'Learn the fundamentals of HTML markup.',
        type: 'video',
        content_url: 'https://r2.yourdomain.com/lessons/html-basics.mp4',
        duration: 30,
        order_index: 2,
        points_awarded: 20,
        is_required: true,
      },
      {
        course_id: courseRef.id,
        title: 'HTML Quiz',
        description: 'Test your HTML knowledge.',
        type: 'quiz',
        order_index: 3,
        points_awarded: 30,
        is_required: true,
      },
      {
        course_id: courseRef.id,
        title: 'CSS Styling',
        description: 'Learn how to style web pages with CSS.',
        type: 'video',
        content_url: 'https://r2.yourdomain.com/lessons/css-basics.mp4',
        duration: 40,
        order_index: 4,
        points_awarded: 20,
        is_required: true,
      },
      {
        course_id: courseRef.id,
        title: 'Final Assessment',
        description: 'Complete the final quiz to finish the course.',
        type: 'quiz',
        order_index: 5,
        points_awarded: 50,
        is_required: true,
      },
    ];

    const lessonPromises = lessons.map((lesson) =>
      addDoc(collection(db, 'lessons'), {
        ...lesson,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
    );

    const lessonRefs = await Promise.all(lessonPromises);
    console.log(`✅ Created ${lessonRefs.length} lessons`);

    // Create a quiz for the HTML Quiz lesson
    const quizLessonId = lessonRefs[2].id;
    const quizRef = await addDoc(collection(db, 'quizzes'), {
      lesson_id: quizLessonId,
      title: 'HTML Basics Quiz',
      description: 'Test your understanding of HTML fundamentals.',
      passing_score: 70,
      time_limit: 15,
      max_attempts: 3,
      points_awarded: 30,
      shuffle_questions: true,
      show_correct_answers: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    console.log(`✅ Quiz created: ${quizRef.id}`);

    // Create quiz questions
    const questions = [
      {
        question_text: 'What does HTML stand for?',
        question_type: 'multiple_choice',
        options: [
          { id: 'a', text: 'Hyper Text Markup Language', is_correct: true },
          { id: 'b', text: 'High Tech Modern Language', is_correct: false },
          { id: 'c', text: 'Home Tool Markup Language', is_correct: false },
          { id: 'd', text: 'Hyperlinks and Text Markup Language', is_correct: false },
        ],
        correct_answer: 'a',
        explanation: 'HTML stands for Hyper Text Markup Language.',
        points: 10,
        order_index: 1,
      },
      {
        question_text: 'Which HTML tag is used for the largest heading?',
        question_type: 'multiple_choice',
        options: [
          { id: 'a', text: '<h6>', is_correct: false },
          { id: 'b', text: '<h1>', is_correct: true },
          { id: 'c', text: '<heading>', is_correct: false },
          { id: 'd', text: '<head>', is_correct: false },
        ],
        correct_answer: 'b',
        explanation: 'The <h1> tag is used for the largest heading.',
        points: 10,
        order_index: 2,
      },
      {
        question_text: 'HTML documents must start with a <!DOCTYPE html> declaration.',
        question_type: 'true_false',
        options: [
          { id: 'true', text: 'True', is_correct: true },
          { id: 'false', text: 'False', is_correct: false },
        ],
        correct_answer: 'true',
        explanation: 'The <!DOCTYPE html> declaration defines the document type and HTML version.',
        points: 10,
        order_index: 3,
      },
    ];

    const questionPromises = questions.map((question) =>
      addDoc(collection(db, 'quizzes', quizRef.id, 'questions'), question)
    );

    await Promise.all(questionPromises);
    console.log(`✅ Created ${questions.length} quiz questions`);

    return {
      courseId: courseRef.id,
      lessonIds: lessonRefs.map(ref => ref.id),
      quizId: quizRef.id,
    };
  } catch (error) {
    console.error('Error creating sample course:', error);
    throw error;
  }
}

/**
 * Enroll a user in the sample course
 */
export async function enrollUserInSampleCourse(userId, courseId) {
  try {
    console.log('Enrolling user in course...');
    
    const enrollmentRef = await addDoc(collection(db, 'enrollments'), {
      user_id: userId,
      course_id: courseId,
      status: 'active',
      progress_percentage: 0,
      completed_lessons: 0,
      total_lessons: 5,
      enrolled_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    console.log(`✅ User enrolled: ${enrollmentRef.id}`);
    return enrollmentRef.id;
  } catch (error) {
    console.error('Error enrolling user:', error);
    throw error;
  }
}

/**
 * Run all seed functions
 */
export async function seedDatabase(instructorId, instructorName) {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Seed badges
    await seedBadges();
    
    // Create sample course
    const { courseId } = await createSampleCourse(instructorId, instructorName);
    
    console.log('✅ Database seeding completed successfully!');
    console.log(`Sample Course ID: ${courseId}`);
    
    return { courseId };
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// ==================== EXAMPLE DATA STRUCTURES ====================

/**
 * Example: Complete course object with all fields
 */
export const exampleCourse = {
  id: 'auto-generated',
  title: 'Advanced JavaScript Patterns',
  description: 'Master advanced JavaScript design patterns and best practices.',
  instructor_id: 'instructor-uid-123',
  instructor_name: 'John Doe',
  thumbnail_url: 'https://r2.yourdomain.com/courses/advanced-js.jpg',
  status: 'published',
  visibility: 'signed_in',
  access_type: 'open',
  category: 'Programming',
  tags: ['JavaScript', 'Design Patterns', 'Advanced'],
  lesson_count: 12,
  total_duration: 360,
  enrollment_count: 45,
  average_rating: 4.8,
  difficulty_level: 'advanced',
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-02-01T14:30:00Z',
  published_at: '2026-01-20T09:00:00Z',
};

/**
 * Example: Quiz attempt with decay calculation
 */
export const exampleQuizAttempt = {
  id: 'auto-generated',
  user_id: 'user-uid-456',
  quiz_id: 'quiz-789',
  lesson_id: 'lesson-101',
  course_id: 'course-202',
  attempt_number: 2, // Second attempt
  score: 85, // 85%
  points_earned: 68, // 100 * 0.85 * 0.8 = 68 (with decay)
  answers: [
    {
      question_id: 'q1',
      answer: 'a',
      is_correct: true,
      points_earned: 10,
    },
    {
      question_id: 'q2',
      answer: ['a', 'c'],
      is_correct: true,
      points_earned: 15,
    },
  ],
  passed: true,
  time_taken: 450, // 7.5 minutes
  started_at: '2026-02-07T10:00:00Z',
  completed_at: '2026-02-07T10:07:30Z',
};

/**
 * Example: Lesson progress tracking
 */
export const exampleLessonProgress = {
  id: 'user123_lesson456', // Composite ID
  user_id: 'user123',
  lesson_id: 'lesson456',
  course_id: 'course789',
  completed: true,
  time_spent: 1800, // 30 minutes
  last_position: 1750, // Video watched to 29:10
  completed_at: '2026-02-07T11:30:00Z',
  started_at: '2026-02-07T11:00:00Z',
  updated_at: '2026-02-07T11:30:00Z',
};
