// Firestore helper functions for common operations
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ==================== USERS ====================

export const createUserProfile = async (uid, userData) => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    ...userData,
    total_points: 0,
    current_badge_id: null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
};

export const getUserProfile = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
};

export const updateUserProfile = async (uid, data) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...data,
    updated_at: serverTimestamp(),
  });
};

// ==================== COURSES ====================

export const createCourse = async (courseData) => {
  const coursesRef = collection(db, 'courses');
  const docRef = await addDoc(coursesRef, {
    ...courseData,
    lesson_count: 0,
    total_duration: 0,
    enrollment_count: 0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return docRef.id;
};

export const getCourse = async (courseId) => {
  const courseRef = doc(db, 'courses', courseId);
  const courseSnap = await getDoc(courseRef);
  return courseSnap.exists() ? { id: courseSnap.id, ...courseSnap.data() } : null;
};

export const updateCourse = async (courseId, data) => {
  const courseRef = doc(db, 'courses', courseId);
  await updateDoc(courseRef, {
    ...data,
    updated_at: serverTimestamp(),
  });
};

export const deleteCourse = async (courseId) => {
  const courseRef = doc(db, 'courses', courseId);
  await deleteDoc(courseRef);
};

export const getCoursesByInstructor = async (instructorId) => {
  const q = query(
    collection(db, 'courses'),
    where('instructor_id', '==', instructorId),
    orderBy('created_at', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getPublishedCourses = async (visibility = 'everyone') => {
  const q = query(
    collection(db, 'courses'),
    where('status', '==', 'published'),
    where('visibility', '==', visibility),
    orderBy('created_at', 'desc'),
    limit(50)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// ==================== LESSONS ====================

export const createLesson = async (lessonData) => {
  const lessonsRef = collection(db, 'lessons');
  const docRef = await addDoc(lessonsRef, {
    ...lessonData,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  
  // Increment course lesson count
  const courseRef = doc(db, 'courses', lessonData.course_id);
  await updateDoc(courseRef, {
    lesson_count: increment(1),
    total_duration: increment(lessonData.duration || 0),
    updated_at: serverTimestamp(),
  });
  
  return docRef.id;
};

export const getLessonsByCourse = async (courseId) => {
  const q = query(
    collection(db, 'lessons'),
    where('course_id', '==', courseId),
    orderBy('order_index', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const updateLesson = async (lessonId, data) => {
  const lessonRef = doc(db, 'lessons', lessonId);
  await updateDoc(lessonRef, {
    ...data,
    updated_at: serverTimestamp(),
  });
};

export const deleteLesson = async (lessonId, courseId) => {
  const lessonRef = doc(db, 'lessons', lessonId);
  await deleteDoc(lessonRef);
  
  // Decrement course lesson count
  const courseRef = doc(db, 'courses', courseId);
  await updateDoc(courseRef, {
    lesson_count: increment(-1),
    updated_at: serverTimestamp(),
  });
};

// ==================== QUIZZES ====================

export const createQuiz = async (quizData) => {
  const quizzesRef = collection(db, 'quizzes');
  const docRef = await addDoc(quizzesRef, {
    ...quizData,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return docRef.id;
};

export const getQuizByLesson = async (lessonId) => {
  const q = query(
    collection(db, 'quizzes'),
    where('lesson_id', '==', lessonId),
    limit(1)
  );
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
};

export const updateQuiz = async (quizId, data) => {
  const quizRef = doc(db, 'quizzes', quizId);
  await updateDoc(quizRef, {
    ...data,
    updated_at: serverTimestamp(),
  });
};

// ==================== ENROLLMENTS ====================

export const enrollInCourse = async (userId, courseId, courseData) => {
  const enrollmentsRef = collection(db, 'enrollments');
  
  // Check if already enrolled
  const q = query(
    enrollmentsRef,
    where('user_id', '==', userId),
    where('course_id', '==', courseId),
    limit(1)
  );
  const existingSnap = await getDocs(q);
  
  if (!existingSnap.empty) {
    throw new Error('Already enrolled in this course');
  }
  
  const batch = writeBatch(db);
  
  // Create enrollment
  const enrollmentRef = doc(enrollmentsRef);
  batch.set(enrollmentRef, {
    user_id: userId,
    course_id: courseId,
    status: 'active',
    progress_percentage: 0,
    completed_lessons: 0,
    total_lessons: courseData?.lesson_count || 0,
    enrolled_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  
  // Increment course enrollment count
  const courseRef = doc(db, 'courses', courseId);
  batch.update(courseRef, {
    enrollment_count: increment(1),
  });
  
  await batch.commit();
  return enrollmentRef.id;
};

export const getEnrollmentsByCourse = async (courseId) => {
  const q = query(
    collection(db, 'enrollments'),
    where('course_id', '==', courseId),
    orderBy('enrolled_at', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getEnrollmentsByUser = async (userId) => {
  const q = query(
    collection(db, 'enrollments'),
    where('user_id', '==', userId),
    orderBy('enrolled_at', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const updateEnrollment = async (enrollmentId, data) => {
  const enrollmentRef = doc(db, 'enrollments', enrollmentId);
  await updateDoc(enrollmentRef, {
    ...data,
    updated_at: serverTimestamp(),
  });
};

// ==================== LESSON PROGRESS ====================
// Note: Use progressService.js for full progress tracking functionality
// These are legacy functions maintained for backward compatibility

export const updateLessonProgressLegacy = async (enrollmentId, userId, courseId, lessonId, completed) => {
  const progressId = `${userId}_${lessonId}`;
  const progressRef = doc(db, 'lesson_progress', progressId);
  
  const progressSnap = await getDoc(progressRef);
  
  if (!progressSnap.exists()) {
    // Create new progress
    await setDoc(progressRef, {
      user_id: userId,
      lesson_id: lessonId,
      course_id: courseId,
      completed,
      time_spent: 0,
      completed_at: completed ? serverTimestamp() : null,
      started_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  } else {
    // Update existing
    await updateDoc(progressRef, {
      completed,
      completed_at: completed ? serverTimestamp() : progressSnap.data().completed_at,
      updated_at: serverTimestamp(),
    });
  }
};

export const getLessonProgressByEnrollment = async (enrollmentId, userId) => {
  const q = query(
    collection(db, 'lesson_progress'),
    where('user_id', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// ==================== QUIZ ATTEMPTS ====================
// Note: Use quizService.js for full quiz functionality with points decay
// These are legacy functions maintained for backward compatibility

export const submitQuizAttemptLegacy = async (attemptData) => {
  const attemptsRef = collection(db, 'quiz_attempts');
  const docRef = await addDoc(attemptsRef, {
    ...attemptData,
    completed_at: serverTimestamp(),
  });
  return docRef.id;
};

export const getQuizAttemptsByUser = async (userId, quizId) => {
  const q = query(
    collection(db, 'quiz_attempts'),
    where('user_id', '==', userId),
    where('quiz_id', '==', quizId),
    orderBy('attempt_number', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// ==================== REVIEWS ====================

export const createOrUpdateReview = async (userId, courseId, rating, comment, userName) => {
  const reviewId = `${userId}_${courseId}`;
  const reviewRef = doc(db, 'reviews', reviewId);
  
  const reviewSnap = await getDoc(reviewRef);
  
  if (!reviewSnap.exists()) {
    await setDoc(reviewRef, {
      user_id: userId,
      course_id: courseId,
      rating,
      comment,
      user_name: userName,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  } else {
    await updateDoc(reviewRef, {
      rating,
      comment,
      updated_at: serverTimestamp(),
    });
  }
};

export const getReviewsByCourse = async (courseId) => {
  const q = query(
    collection(db, 'reviews'),
    where('course_id', '==', courseId),
    orderBy('created_at', 'desc'),
    limit(50)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// ==================== QUIZ QUESTIONS ====================

export const createQuizQuestion = async (quizId, questionData) => {
  const questionsRef = collection(db, 'quizzes', quizId, 'questions');
  const docRef = await addDoc(questionsRef, questionData);
  return docRef.id;
};

export const getQuizQuestions = async (quizId) => {
  const q = query(
    collection(db, 'quizzes', quizId, 'questions'),
    orderBy('order_index', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const updateQuizQuestion = async (quizId, questionId, data) => {
  const questionRef = doc(db, 'quizzes', quizId, 'questions', questionId);
  await updateDoc(questionRef, data);
};

export const deleteQuizQuestion = async (quizId, questionId) => {
  const questionRef = doc(db, 'quizzes', quizId, 'questions', questionId);
  await deleteDoc(questionRef);
};
