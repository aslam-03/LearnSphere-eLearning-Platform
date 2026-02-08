// Firestore-based API - Direct client-side database access
import {
  auth,
  db,
  COLLECTIONS,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  writeBatch,
  increment,
  Timestamp,
  secondaryAuth,
  createUserWithEmailAndPassword
} from './firebase';
import { signOut } from 'firebase/auth';
import type {
  User,
  Course,
  Lesson,
  Quiz,
  Question,
  Enrollment,
  Progress,
  QuizAttempt,
  Review,
  Invitation,
  ReportingOverview,
  ReportingDetail,
  InsertCourse,
  InsertLesson,
  InsertQuiz,
  InsertQuestion,
  InsertReview,
} from '@shared/types';

// Helper to convert Firestore doc to typed object
function docToData<T>(doc: any): T {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data?.createdAt?.toDate?.() || new Date(),
    updatedAt: data?.updatedAt?.toDate?.() || new Date(),
  } as T;
}

// =====================
// AUTH API
// =====================
export const authApi = {
  getCurrentUser: async (): Promise<User | null> => {
    const user = auth.currentUser;
    if (!user) return null;

    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
    if (!userDoc.exists()) {
      return {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'User',
        role: 'learner',
        points: 0,
      } as User;
    }
    return docToData<User>(userDoc);
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
      ...data,
      updatedAt: serverTimestamp(),
    });

    const updated = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
    return docToData<User>(updated);
  },
};

// =====================
// COURSES API
// =====================
export const coursesApi = {
  list: async (params?: { search?: string; instructorId?: string; published?: boolean }): Promise<Course[]> => {
    let q = query(collection(db, COLLECTIONS.COURSES), orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(q);
    let courses = snapshot.docs.map(doc => docToData<Course>(doc));

    // Client-side filtering
    if (params?.instructorId) {
      courses = courses.filter(c => c.instructorId === params.instructorId);
    }
    if (params?.published !== undefined) {
      courses = courses.filter(c => c.published === params.published);
    }
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      courses = courses.filter(c =>
        c.title.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower)
      );
    }

    return courses;
  },

  get: async (id: string): Promise<Course & { lessons: Lesson[]; quizzes: Quiz[]; instructor: User }> => {
    const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, id));
    if (!courseDoc.exists()) throw new Error('Course not found');

    const course = docToData<Course>(courseDoc);

    // Get lessons (sort client-side to avoid needing composite index)
    const lessonsSnapshot = await getDocs(
      query(collection(db, COLLECTIONS.LESSONS), where('courseId', '==', id))
    );
    const lessons = lessonsSnapshot.docs.map(doc => docToData<Lesson>(doc)).sort((a, b) => (a.order || 0) - (b.order || 0));

    // Get quizzes
    const quizzesSnapshot = await getDocs(
      query(collection(db, COLLECTIONS.QUIZZES), where('courseId', '==', id))
    );
    const quizzes = quizzesSnapshot.docs.map(doc => docToData<Quiz>(doc));

    // Get instructor
    let instructor: User = { id: course.instructorId, displayName: 'Unknown', email: '', role: 'instructor', points: 0 } as User;
    if (course.instructorId) {
      try {
        const instructorDoc = await getDoc(doc(db, COLLECTIONS.USERS, course.instructorId));
        if (instructorDoc.exists()) {
          instructor = docToData<User>(instructorDoc);
        }
      } catch (e) {
        console.error('Error fetching instructor:', e);
      }
    }

    return { ...course, lessons, quizzes, instructor };
  },

  create: async (data: InsertCourse): Promise<Course> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const courseData = {
      ...data,
      instructorId: user.uid,
      published: data.published ?? false,
      visibility: data.visibility ?? 'everyone',
      accessRule: data.accessRule ?? 'open',
      tags: data.tags ?? [],
      price: data.price ?? 0,
      viewsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.COURSES), courseData);
    return { id: docRef.id, ...courseData, createdAt: new Date(), updatedAt: new Date() } as Course;
  },

  update: async (id: string, data: Partial<InsertCourse>): Promise<Course> => {
    await updateDoc(doc(db, COLLECTIONS.COURSES, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });

    const updated = await getDoc(doc(db, COLLECTIONS.COURSES, id));
    return docToData<Course>(updated);
  },

  delete: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.COURSES, id));
  },

  publish: async (id: string, published: boolean): Promise<Course> => {
    await updateDoc(doc(db, COLLECTIONS.COURSES, id), {
      published,
      updatedAt: serverTimestamp(),
    });

    const updated = await getDoc(doc(db, COLLECTIONS.COURSES, id));
    return docToData<Course>(updated);
  },

  getEnrollments: async (courseId: string): Promise<(Enrollment & { user: User })[]> => {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.ENROLLMENTS), where('courseId', '==', courseId))
    );

    const enrollments = await Promise.all(
      snapshot.docs.map(async (enrollmentDoc) => {
        const enrollment = docToData<Enrollment>(enrollmentDoc);
        let user: User = { id: enrollment.userId, displayName: 'Unknown', email: '', role: 'learner', points: 0 } as User;

        if (enrollment.userId) {
          try {
            const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, enrollment.userId));
            if (userDoc.exists()) {
              user = docToData<User>(userDoc);
            }
          } catch (e) { }
        }

        return { ...enrollment, user };
      })
    );

    return enrollments;
  },
};

// =====================
// LESSONS API
// =====================
export const lessonsApi = {
  list: async (courseId: string): Promise<Lesson[]> => {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.LESSONS), where('courseId', '==', courseId))
    );
    return snapshot.docs.map(doc => docToData<Lesson>(doc)).sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  get: async (id: string): Promise<Lesson & { attachments: any[] }> => {
    const lessonDoc = await getDoc(doc(db, COLLECTIONS.LESSONS, id));
    if (!lessonDoc.exists()) throw new Error('Lesson not found');

    const lesson = docToData<Lesson>(lessonDoc);

    // Get attachments
    const attachmentsSnapshot = await getDocs(
      query(collection(db, COLLECTIONS.ATTACHMENTS), where('lessonId', '==', id))
    );
    const attachments = attachmentsSnapshot.docs.map(doc => docToData<any>(doc));

    return { ...lesson, attachments };
  },

  create: async (courseId: string, data: InsertLesson): Promise<Lesson> => {
    const lessonData = {
      ...data,
      courseId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.LESSONS), lessonData);
    return { id: docRef.id, ...lessonData, createdAt: new Date(), updatedAt: new Date() } as Lesson;
  },

  update: async (id: string, data: Partial<InsertLesson>): Promise<Lesson> => {
    await updateDoc(doc(db, COLLECTIONS.LESSONS, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });

    const updated = await getDoc(doc(db, COLLECTIONS.LESSONS, id));
    return docToData<Lesson>(updated);
  },

  delete: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.LESSONS, id));
  },

  reorder: async (courseId: string, lessonOrders: { id: string; order: number }[]): Promise<void> => {
    const batch = writeBatch(db);

    for (const { id, order } of lessonOrders) {
      batch.update(doc(db, COLLECTIONS.LESSONS, id), { order });
    }

    await batch.commit();
  },

  addAttachment: async (lessonId: string, data: { type: 'file' | 'link'; name: string; url: string }) => {
    const attachmentData = {
      ...data,
      lessonId,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.ATTACHMENTS), attachmentData);
    return { id: docRef.id, ...attachmentData };
  },

  deleteAttachment: async (attachmentId: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.ATTACHMENTS, attachmentId));
  },
};

// =====================
// QUIZZES API
// =====================
export const quizzesApi = {
  list: async (courseId: string): Promise<Quiz[]> => {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.QUIZZES), where('courseId', '==', courseId))
    );
    return snapshot.docs.map(doc => docToData<Quiz>(doc));
  },

  get: async (id: string): Promise<Quiz & { questions: Question[] }> => {
    const quizDoc = await getDoc(doc(db, COLLECTIONS.QUIZZES, id));
    if (!quizDoc.exists()) throw new Error('Quiz not found');

    const quiz = docToData<Quiz>(quizDoc);

    // Get questions (sort client-side to avoid needing composite index)
    const questionsSnapshot = await getDocs(
      query(collection(db, COLLECTIONS.QUESTIONS), where('quizId', '==', id))
    );
    const questions = questionsSnapshot.docs.map(doc => docToData<Question>(doc)).sort((a, b) => (a.order || 0) - (b.order || 0));

    return { ...quiz, questions };
  },

  create: async (courseId: string, data: InsertQuiz): Promise<Quiz> => {
    const quizData = {
      ...data,
      courseId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.QUIZZES), quizData);
    return { id: docRef.id, ...quizData, createdAt: new Date(), updatedAt: new Date() } as Quiz;
  },

  update: async (id: string, data: Partial<InsertQuiz>): Promise<Quiz> => {
    await updateDoc(doc(db, COLLECTIONS.QUIZZES, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });

    const updated = await getDoc(doc(db, COLLECTIONS.QUIZZES, id));
    return docToData<Quiz>(updated);
  },

  delete: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.QUIZZES, id));
  },

  addQuestion: async (quizId: string, data: InsertQuestion): Promise<Question> => {
    const questionData = {
      ...data,
      quizId,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.QUESTIONS), questionData);
    return { id: docRef.id, ...questionData, createdAt: new Date() } as Question;
  },

  updateQuestion: async (questionId: string, data: Partial<InsertQuestion>): Promise<Question> => {
    await updateDoc(doc(db, COLLECTIONS.QUESTIONS, questionId), data);

    const updated = await getDoc(doc(db, COLLECTIONS.QUESTIONS, questionId));
    return docToData<Question>(updated);
  },

  deleteQuestion: async (questionId: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.QUESTIONS, questionId));
  },

  submitAttempt: async (quizId: string, answers: { questionId: string; selectedOption: number }[]): Promise<QuizAttempt> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Get quiz and questions
    const quiz = await quizzesApi.get(quizId);

    // Calculate score
    let score = 0;
    let totalPoints = 0;

    for (const question of quiz.questions) {
      totalPoints += question.points || 10;
      const answer = answers.find(a => a.questionId === question.id);
      if (answer && question.options[answer.selectedOption]?.isCorrect) {
        score += question.points || 10;
      }
    }

    // Get previous attempts count
    const prevAttemptsSnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.QUIZ_ATTEMPTS),
        where('quizId', '==', quizId),
        where('userId', '==', user.uid)
      )
    );
    const attemptNumber = prevAttemptsSnapshot.size + 1;

    const quizProgressSnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.PROGRESS),
        where('userId', '==', user.uid),
        where('lessonId', '==', `quiz-${quizId}`)
      )
    );
    const isQuizAlreadyCompleted = quizProgressSnapshot.docs.some(doc => doc.data().completed);

    // Calculate points earned based on attempt number
    let pointsEarned = score;
    if (quiz.rewards) {
      if (attemptNumber === 1) pointsEarned = Math.round(score * quiz.rewards.attempt1 / 10);
      else if (attemptNumber === 2) pointsEarned = Math.round(score * quiz.rewards.attempt2 / 10);
      else if (attemptNumber === 3) pointsEarned = Math.round(score * quiz.rewards.attempt3 / 10);
      else pointsEarned = Math.round(score * quiz.rewards.attempt4Plus / 10);
    }

    if (isQuizAlreadyCompleted) {
      pointsEarned = 0;
    }

    const attemptData = {
      quizId,
      userId: user.uid,
      score,
      maxScore: totalPoints,
      attemptNumber,
      answers: answers.map(a => ({ ...a, correct: quiz.questions.find(q => q.id === a.questionId)?.options[a.selectedOption]?.isCorrect || false })),
      pointsEarned,
      completedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.QUIZ_ATTEMPTS), attemptData);

    // Award points to user
    if (pointsEarned > 0) {
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        points: increment(pointsEarned),
      });
    }

    return { id: docRef.id, ...attemptData, completedAt: new Date() } as QuizAttempt;
  },

  getAttempts: async (quizId: string): Promise<QuizAttempt[]> => {
    const user = auth.currentUser;
    if (!user) return [];

    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.QUIZ_ATTEMPTS),
        where('quizId', '==', quizId),
        where('userId', '==', user.uid)
      )
    );
    return snapshot.docs.map(doc => docToData<QuizAttempt>(doc));
  },
};

async function getCourseProgressForUser(userId: string, courseId: string): Promise<{ progress: Progress[]; percentage: number }> {
  // Get lesson count
  const lessonsSnapshot = await getDocs(
    query(collection(db, COLLECTIONS.LESSONS), where('courseId', '==', courseId))
  );

  const lessonIds = new Set(lessonsSnapshot.docs.map(doc => doc.id));

  const progressSnapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.PROGRESS),
      where('userId', '==', userId),
      where('courseId', '==', courseId)
    )
  );

  let progress = progressSnapshot.docs.map(doc => docToData<Progress>(doc));

  // Backfill progress records that predate courseId
  if (progress.length === 0) {
    const allProgressSnapshot = await getDocs(
      query(collection(db, COLLECTIONS.PROGRESS), where('userId', '==', userId))
    );

    progress = allProgressSnapshot.docs
      .map(doc => docToData<Progress>(doc))
      .filter(p => lessonIds.has(p.lessonId));

    const batch = writeBatch(db);
    let hasUpdates = false;

    allProgressSnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data.courseId && lessonIds.has(data.lessonId)) {
        batch.update(docSnap.ref, { courseId });
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      await batch.commit();
    }
  }

  const totalLessons = lessonsSnapshot.size;
  const completedLessonIds = new Set(
    progress
      .filter(p => p.completed && lessonIds.has(p.lessonId))
      .map(p => p.lessonId)
  );
  const percentage = totalLessons > 0
    ? Math.min(100, Math.round((completedLessonIds.size / totalLessons) * 100))
    : 0;

  return { progress, percentage };
}

// =====================
// ENROLLMENTS API
// =====================
export const enrollmentsApi = {
  list: async (): Promise<(Enrollment & { course: Course; progress?: number })[]> => {
    const user = auth.currentUser;
    if (!user) return [];

    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.ENROLLMENTS), where('userId', '==', user.uid))
    );

    const enrollments = await Promise.all(
      snapshot.docs.map(async (enrollmentDoc) => {
        const enrollment = docToData<Enrollment>(enrollmentDoc);
        let course: Course = { id: enrollment.courseId, title: '', description: '', instructorId: '' } as Course;

        try {
          const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, enrollment.courseId));
          if (courseDoc.exists()) {
            course = docToData<Course>(courseDoc);
          }
        } catch (e) { }

        const progressInfo = await getCourseProgressForUser(user.uid, enrollment.courseId);

        return { ...enrollment, course, progress: progressInfo.percentage };
      })
    );

    return enrollments;
  },

  enroll: async (courseId: string): Promise<Enrollment> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Check if already enrolled
    const existingSnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.ENROLLMENTS),
        where('userId', '==', user.uid),
        where('courseId', '==', courseId)
      )
    );

    if (!existingSnapshot.empty) {
      return docToData<Enrollment>(existingSnapshot.docs[0]);
    }

    const enrollmentData = {
      userId: user.uid,
      courseId,
      status: 'active',
      enrolledAt: serverTimestamp(),
      timeSpent: 0,
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.ENROLLMENTS), enrollmentData);
    return { id: docRef.id, ...enrollmentData, enrolledAt: new Date(), timeSpent: 0 } as Enrollment;
  },

  complete: async (courseId: string): Promise<Enrollment> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.ENROLLMENTS),
        where('userId', '==', user.uid),
        where('courseId', '==', courseId)
      )
    );

    if (snapshot.empty) throw new Error('Enrollment not found');

    const enrollmentDoc = snapshot.docs[0];
    await updateDoc(enrollmentDoc.ref, {
      status: 'completed',
      completedAt: serverTimestamp(),
    });

    // Award points
    await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
      points: increment(100),
    });

    const updated = await getDoc(enrollmentDoc.ref);
    return docToData<Enrollment>(updated);
  },
};

// =====================
// PROGRESS API
// =====================
export const progressApi = {
  getCourseProgress: async (courseId: string): Promise<{ progress: Progress[]; percentage: number }> => {
    const user = auth.currentUser;
    if (!user) return { progress: [], percentage: 0 };

    return getCourseProgressForUser(user.uid, courseId);
  },

  updateLessonProgress: async (lessonId: string, completed: boolean, courseIdOverride?: string): Promise<Progress> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Get lesson to find courseId (quizzes don't exist in lessons collection)
    const lessonDoc = await getDoc(doc(db, COLLECTIONS.LESSONS, lessonId));
    let courseId = courseIdOverride;

    if (lessonDoc.exists()) {
      const lesson = lessonDoc.data();
      courseId = lesson.courseId;
    }

    if (!courseId) {
      throw new Error('Lesson not found');
    }

    // Check if progress exists
    const existingSnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.PROGRESS),
        where('userId', '==', user.uid),
        where('lessonId', '==', lessonId)
      )
    );

    if (!existingSnapshot.empty) {
      const progressDoc = existingSnapshot.docs[0];
      await updateDoc(progressDoc.ref, {
        completed,
        completedAt: completed ? serverTimestamp() : null,
        courseId,
      });

      const updated = await getDoc(progressDoc.ref);
      return docToData<Progress>(updated);
    }

    const progressData = {
      userId: user.uid,
      courseId,
      lessonId,
      odId: `${user.uid}_${lessonId}`,
      completed,
      viewedAt: serverTimestamp(),
      completedAt: completed ? serverTimestamp() : null,
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.PROGRESS), progressData);

    // Award points if completed
    if (completed) {
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        points: increment(10),
      });
    }

    return { id: docRef.id, ...progressData, viewedAt: new Date(), completedAt: completed ? new Date() : undefined } as Progress;
  },
};

// =====================
// REVIEWS API
// =====================
export const reviewsApi = {
  list: async (courseId: string): Promise<{ reviews: (Review & { user: User })[]; averageRating: number }> => {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.REVIEWS), where('courseId', '==', courseId))
    );

    const reviews = await Promise.all(
      snapshot.docs.map(async (reviewDoc) => {
        const review = docToData<Review>(reviewDoc);
        let user: User = { id: review.userId, displayName: 'Anonymous', email: '', role: 'learner', points: 0 } as User;

        if (review.userId) {
          try {
            const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, review.userId));
            if (userDoc.exists()) {
              user = docToData<User>(userDoc);
            }
          } catch (e) { }
        }

        return { ...review, user };
      })
    );

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return { reviews, averageRating };
  },

  create: async (courseId: string, data: InsertReview): Promise<Review> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const reviewData = {
      ...data,
      courseId,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.REVIEWS), reviewData);
    return { id: docRef.id, ...reviewData, createdAt: new Date(), updatedAt: new Date() } as Review;
  },

  update: async (reviewId: string, data: Partial<InsertReview>): Promise<Review> => {
    await updateDoc(doc(db, COLLECTIONS.REVIEWS, reviewId), {
      ...data,
      updatedAt: serverTimestamp(),
    });

    const updated = await getDoc(doc(db, COLLECTIONS.REVIEWS, reviewId));
    return docToData<Review>(updated);
  },

  delete: async (reviewId: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.REVIEWS, reviewId));
  },
};

// =====================
// INVITATIONS API
// =====================
export const invitationsApi = {
  list: async (courseId: string): Promise<Invitation[]> => {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.INVITATIONS), where('courseId', '==', courseId))
    );
    return snapshot.docs.map(doc => docToData<Invitation>(doc));
  },

  send: async (courseId: string, email: string): Promise<Invitation> => {
    const invitationData = {
      courseId,
      email,
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.INVITATIONS), invitationData);
    return { id: docRef.id, ...invitationData, createdAt: new Date() } as Invitation;
  },
};

// =====================
// REPORTING API
// =====================
export const reportingApi = {
  getOverview: async (): Promise<ReportingOverview> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Get instructor's courses
    const coursesSnapshot = await getDocs(
      query(collection(db, COLLECTIONS.COURSES), where('instructorId', '==', user.uid))
    );

    const courseIds = coursesSnapshot.docs.map(d => d.id);

    let totalEnrollments = 0;
    let completedEnrollments = 0;

    if (courseIds.length > 0) {
      for (const courseId of courseIds) {
        const enrollmentsSnapshot = await getDocs(
          query(collection(db, COLLECTIONS.ENROLLMENTS), where('courseId', '==', courseId))
        );
        totalEnrollments += enrollmentsSnapshot.size;
        completedEnrollments += enrollmentsSnapshot.docs.filter(d => d.data().status === 'completed').length;
      }
    }

    // Calculate in-progress enrollments
    const inProgressEnrollments = totalEnrollments - completedEnrollments;

    return {
      totalParticipants: totalEnrollments,
      yetToStart: 0,
      inProgress: inProgressEnrollments,
      completed: completedEnrollments,
    } as ReportingOverview;
  },

  getDetails: async (courseId?: string): Promise<ReportingDetail[]> => {
    const user = auth.currentUser;
    if (!user) return [];

    let q = query(collection(db, COLLECTIONS.COURSES), where('instructorId', '==', user.uid));

    const snapshot = await getDocs(q);
    const details: ReportingDetail[] = [];

    for (const courseDoc of snapshot.docs) {
      if (courseId && courseDoc.id !== courseId) continue;

      const course = docToData<Course>(courseDoc);

      const enrollmentsSnapshot = await getDocs(
        query(collection(db, COLLECTIONS.ENROLLMENTS), where('courseId', '==', courseDoc.id))
      );

      // Get each enrollment as a detail row
      for (const enrollDoc of enrollmentsSnapshot.docs) {
        const enrollment = enrollDoc.data();
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, enrollment.userId));
        const userData = userDoc.exists() ? userDoc.data() : null;

        const enrolledDate = enrollment.enrolledAt?.toDate?.() || new Date();
        const startDate = enrollment.startedAt?.toDate?.() || null;
        const completedDate = enrollment.completedAt?.toDate?.() || null;

        let status: 'yet_to_start' | 'in_progress' | 'completed' = 'yet_to_start';
        if (enrollment.status === 'completed') status = 'completed';
        else if (startDate) status = 'in_progress';

        details.push({
          courseId: courseDoc.id,
          courseName: course.title,
          userName: userData?.displayName || userData?.email || 'Unknown',
          userId: enrollment.userId,
          enrolledDate,
          startDate,
          timeSpent: enrollment.timeSpent || 0,
          completionPercentage: enrollment.status === 'completed' ? 100 : 0,
          completedDate,
          status,
        });
      }
    }

    return details;
  },
};

// =====================
// GAMIFICATION API
// =====================
const BADGES = [
  { name: 'Newbie', points: 0, icon: '🌱' },
  { name: 'Learner', points: 100, icon: '📚' },
  { name: 'Scholar', points: 500, icon: '🎓' },
  { name: 'Expert', points: 1000, icon: '⭐' },
  { name: 'Master', points: 5000, icon: '👑' },
];

export const gamificationApi = {
  getBadges: async () => BADGES,

  getUserBadge: async (userId: string) => {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    const points = userDoc.exists() ? (userDoc.data().points || 0) : 0;

    let currentBadge = BADGES[0];
    let nextBadge: typeof BADGES[0] | null = null;

    for (let i = 0; i < BADGES.length; i++) {
      if (points >= BADGES[i].points) {
        currentBadge = BADGES[i];
        nextBadge = BADGES[i + 1] || null;
      }
    }

    return {
      currentBadge,
      nextBadge,
      points,
      pointsToNextBadge: nextBadge ? nextBadge.points - points : 0,
    };
  },
};

// =====================
// ADMIN API (Admin only functions)
// =====================
export const adminApi = {
  getAllUsers: async (): Promise<User[]> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Verify admin role
    const currentUserDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    return snapshot.docs.map(doc => docToData<User>(doc));
  },

  // Get all instructors
  getInstructors: async (): Promise<User[]> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Verify admin role
    const currentUserDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.USERS), where('role', '==', 'instructor'))
    );
    return snapshot.docs.map(doc => docToData<User>(doc));
  },

  // Create new instructor account
  createInstructor: async (email: string, password: string, displayName: string): Promise<User> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Verify admin role
    const currentUserDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    // Validate inputs
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    if (!displayName || displayName.trim().length < 2) {
      throw new Error('Display name must be at least 2 characters long');
    }

    let newUserId: string | null = null;

    // Step 1: Create user in Firebase Auth
    try {
      console.log('Creating instructor with email:', email);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      newUserId = userCredential.user.uid;
      console.log('User created in Firebase Auth with ID:', newUserId);

      // Sign out from secondary auth immediately
      await signOut(secondaryAuth);
    } catch (error: any) {
      // Log full error for debugging
      console.error('Firebase Auth Error:', {
        code: error?.code,
        message: error?.message,
        fullError: error
      });

      // Handle Firebase Auth errors with user-friendly messages
      const errorCode = error?.code || '';
      const errorMessage = error?.message || '';

      if (errorCode === 'auth/email-already-in-use') {
        throw new Error('This email address is already registered in Firebase Auth');
      } else if (errorCode === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address');
      } else if (errorCode === 'auth/weak-password') {
        throw new Error('Password is too weak. Use at least 6 characters');
      } else if (errorCode === 'auth/operation-not-allowed' || errorMessage.includes('ADMIN_ONLY_OPERATION')) {
        throw new Error('Email/Password sign-in is NOT enabled. Go to Firebase Console → Authentication → Sign-in method → Enable Email/Password');
      } else if (errorCode === 'auth/configuration-not-found' || errorMessage.includes('CONFIGURATION_NOT_FOUND')) {
        throw new Error('Firebase Auth is not configured properly. Check your Firebase project settings');
      } else if (errorMessage.includes('ADMIN_ONLY_OPERATION')) {
        throw new Error('Email/Password sign-in must be enabled in Firebase Console → Authentication → Sign-in method');
      } else {
        throw new Error(`Firebase Auth Error: ${errorCode || 'unknown'} - ${errorMessage || 'Failed to create account'}`);
      }
    }

    // Step 2: Create user document in Firestore
    if (!newUserId) {
      throw new Error('Failed to create user - no user ID returned');
    }

    const instructorData = {
      email,
      displayName: displayName.trim(),
      role: 'instructor' as const,
      points: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      console.log('Creating Firestore document for user:', newUserId);
      await setDoc(doc(db, COLLECTIONS.USERS, newUserId), instructorData);
      console.log('User document created in Firestore successfully');
    } catch (firestoreError: any) {
      console.error('Firestore Error:', {
        code: firestoreError?.code,
        message: firestoreError?.message,
        fullError: firestoreError
      });

      // User was created in Auth but Firestore failed
      // This is likely a permissions issue
      const errorMsg = firestoreError?.message || '';
      if (errorMsg.includes('permission') || errorMsg.includes('PERMISSION_DENIED')) {
        throw new Error(
          'User created in Authentication but Firestore permission denied. ' +
          'Update Firestore rules to allow admins to write to users collection. ' +
          'Go to Firebase Console → Firestore Database → Rules'
        );
      }
      throw new Error(`User created in Auth but Firestore failed: ${errorMsg}`);
    }

    return {
      id: newUserId,
      ...instructorData,
      createdAt: new Date(),
      updatedAt: new Date()
    } as User;
  },

  getPlatformStats: async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const [usersSnapshot, coursesSnapshot, enrollmentsSnapshot] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.USERS)),
      getDocs(collection(db, COLLECTIONS.COURSES)),
      getDocs(collection(db, COLLECTIONS.ENROLLMENTS)),
    ]);

    const users = usersSnapshot.docs.map(doc => doc.data());
    const enrollments = enrollmentsSnapshot.docs.map(doc => doc.data());

    // Count new users this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newUsersThisMonth = users.filter((u: any) => {
      const createdAt = u.createdAt?.toDate?.() || new Date(0);
      return createdAt >= startOfMonth;
    }).length;

    // Count completed enrollments
    const completedEnrollments = enrollments.filter((e: any) => e.completedAt).length;

    return {
      totalUsers: usersSnapshot.size,
      totalCourses: coursesSnapshot.size,
      totalEnrollments: enrollmentsSnapshot.size,
      completedEnrollments,
      newUsersThisMonth,
    };
  },

  updateUserRole: async (userId: string, role: 'admin' | 'instructor' | 'learner'): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Verify admin role
    const currentUserDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      role,
      updatedAt: serverTimestamp(),
    });
  },

  deleteUser: async (userId: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Verify admin role
    const currentUserDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    // Prevent self-deletion
    if (userId === user.uid) {
      throw new Error('Cannot delete your own account');
    }

    // Delete user document
    await deleteDoc(doc(db, COLLECTIONS.USERS, userId));

    // Optionally: Delete user's enrollments, progress, etc.
    const enrollmentsSnapshot = await getDocs(
      query(collection(db, COLLECTIONS.ENROLLMENTS), where('userId', '==', userId))
    );
    const batch = writeBatch(db);
    enrollmentsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  },

  deleteCourse: async (courseId: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Verify admin role
    const currentUserDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    // Delete course and related data
    const batch = writeBatch(db);

    // Delete lessons
    const lessonsSnapshot = await getDocs(
      query(collection(db, COLLECTIONS.LESSONS), where('courseId', '==', courseId))
    );
    lessonsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Delete quizzes
    const quizzesSnapshot = await getDocs(
      query(collection(db, COLLECTIONS.QUIZZES), where('courseId', '==', courseId))
    );
    quizzesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Delete enrollments
    const enrollmentsSnapshot = await getDocs(
      query(collection(db, COLLECTIONS.ENROLLMENTS), where('courseId', '==', courseId))
    );
    enrollmentsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Delete course
    batch.delete(doc(db, COLLECTIONS.COURSES, courseId));

    await batch.commit();
  },
};

// Export all APIs
export const api = {
  auth: authApi,
  courses: coursesApi,
  lessons: lessonsApi,
  quizzes: quizzesApi,
  enrollments: enrollmentsApi,
  progress: progressApi,
  reviews: reviewsApi,
  invitations: invitationsApi,
  reporting: reportingApi,
  gamification: gamificationApi,
  admin: adminApi,
};

export default api;
