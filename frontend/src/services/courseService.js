// Firestore helper functions for common operations
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
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
  await updateDoc(userRef, {
    ...userData,
    totalPoints: 0,
    badge: 'Newbie',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
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
    updatedAt: serverTimestamp(),
  });
};

// ==================== COURSES ====================

export const createCourse = async (courseData) => {
  const coursesRef = collection(db, 'courses');
  const docRef = await addDoc(coursesRef, {
    ...courseData,
    lessonCount: 0,
    totalDuration: 0,
    enrollmentCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
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
    updatedAt: serverTimestamp(),
  });
};

export const deleteCourse = async (courseId) => {
  const courseRef = doc(db, 'courses', courseId);
  await deleteDoc(courseRef);
};

export const getCoursesByInstructor = async (instructorId) => {
  const q = query(
    collection(db, 'courses'),
    where('createdBy', '==', instructorId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getPublishedCourses = async (visibility = 'everyone') => {
  const q = query(
    collection(db, 'courses'),
    where('published', '==', true),
    where('visibility', '==', visibility),
    orderBy('createdAt', 'desc'),
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  // Increment course lesson count
  const courseRef = doc(db, 'courses', lessonData.courseId);
  await updateDoc(courseRef, {
    lessonCount: increment(1),
    totalDuration: increment(lessonData.duration || 0),
    updatedAt: serverTimestamp(),
  });
  
  return docRef.id;
};

export const getLessonsByCourse = async (courseId) => {
  const q = query(
    collection(db, 'lessons'),
    where('courseId', '==', courseId),
    orderBy('orderIndex', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const updateLesson = async (lessonId, data) => {
  const lessonRef = doc(db, 'lessons', lessonId);
  await updateDoc(lessonRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteLesson = async (lessonId, courseId) => {
  const lessonRef = doc(db, 'lessons', lessonId);
  await deleteDoc(lessonRef);
  
  // Decrement course lesson count
  const courseRef = doc(db, 'courses', courseId);
  await updateDoc(courseRef, {
    lessonCount: increment(-1),
    updatedAt: serverTimestamp(),
  });
};

// ==================== QUIZZES ====================

export const createQuiz = async (quizData) => {
  const quizzesRef = collection(db, 'quizzes');
  const docRef = await addDoc(quizzesRef, {
    ...quizData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getQuizByLesson = async (lessonId) => {
  const q = query(
    collection(db, 'quizzes'),
    where('lessonId', '==', lessonId),
    limit(1)
  );
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
};

export const updateQuiz = async (quizId, data) => {
  const quizRef = doc(db, 'quizzes', quizId);
  await updateDoc(quizRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// ==================== ENROLLMENTS ====================

export const enrollInCourse = async (userId, courseId) => {
  const enrollmentId = `${userId}_${courseId}`;
  const enrollmentRef = doc(db, 'enrollments', enrollmentId);
  
  // Check if already enrolled
  const enrollmentSnap = await getDoc(enrollmentRef);
  if (enrollmentSnap.exists()) {
    throw new Error('Already enrolled in this course');
  }
  
  const batch = writeBatch(db);
  
  // Create enrollment
  batch.set(enrollmentRef, {
    id: enrollmentId,
    userId,
    courseId,
    status: 'yet_to_start',
    progress: 0,
    enrolledAt: serverTimestamp(),
    timeSpent: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  // Increment course enrollment count
  const courseRef = doc(db, 'courses', courseId);
  batch.update(courseRef, {
    enrollmentCount: increment(1),
  });
  
  await batch.commit();
  return enrollmentId;
};

export const getEnrollmentsByCourse = async (courseId) => {
  const q = query(
    collection(db, 'enrollments'),
    where('courseId', '==', courseId),
    orderBy('enrolledAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getEnrollmentsByUser = async (userId) => {
  const q = query(
    collection(db, 'enrollments'),
    where('userId', '==', userId),
    orderBy('enrolledAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const updateEnrollment = async (enrollmentId, data) => {
  const enrollmentRef = doc(db, 'enrollments', enrollmentId);
  await updateDoc(enrollmentRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// ==================== LESSON PROGRESS ====================

export const updateLessonProgress = async (enrollmentId, userId, courseId, lessonId, completed) => {
  const progressId = `${enrollmentId}_${lessonId}`;
  const progressRef = doc(db, 'lessonProgress', progressId);
  
  const progressSnap = await getDoc(progressRef);
  
  if (!progressSnap.exists()) {
    // Create new progress
    await updateDoc(progressRef, {
      id: progressId,
      enrollmentId,
      userId,
      courseId,
      lessonId,
      completed,
      completedAt: completed ? serverTimestamp() : null,
      timeSpent: 0,
      lastAccessedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Update existing
    await updateDoc(progressRef, {
      completed,
      completedAt: completed ? serverTimestamp() : progressSnap.data().completedAt,
      lastAccessedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
};

export const getLessonProgressByEnrollment = async (enrollmentId) => {
  const q = query(
    collection(db, 'lessonProgress'),
    where('enrollmentId', '==', enrollmentId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// ==================== QUIZ ATTEMPTS ====================

export const submitQuizAttempt = async (attemptData) => {
  const attemptsRef = collection(db, 'quizAttempts');
  const docRef = await addDoc(attemptsRef, {
    ...attemptData,
    submittedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getQuizAttemptsByUser = async (userId, quizId) => {
  const q = query(
    collection(db, 'quizAttempts'),
    where('userId', '==', userId),
    where('quizId', '==', quizId),
    orderBy('attemptNumber', 'asc')
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
    await updateDoc(reviewRef, {
      id: reviewId,
      userId,
      courseId,
      rating,
      comment,
      userName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(reviewRef, {
      rating,
      comment,
      updatedAt: serverTimestamp(),
    });
  }
};

export const getReviewsByCourse = async (courseId) => {
  const q = query(
    collection(db, 'reviews'),
    where('courseId', '==', courseId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// ==================== GAMIFICATION ====================

export const BADGE_LEVELS = {
  'Newbie': 0,
  'Explorer': 20,
  'Achiever': 40,
  'Specialist': 60,
  'Expert': 80,
  'Master': 100,
};

export const calculateBadge = (points) => {
  const badges = Object.entries(BADGE_LEVELS).sort((a, b) => b[1] - a[1]);
  for (const [badge, threshold] of badges) {
    if (points >= threshold) return badge;
  }
  return 'Newbie';
};
