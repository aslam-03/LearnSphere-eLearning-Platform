// Firebase Client Configuration
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  type User
} from 'firebase/auth';
import { 
  getFirestore, 
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
  limit,
  addDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Firebase configuration - Using environment variables
// You need to create a .env file with your Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize a secondary app for admin user creation (to avoid signing out current admin)
const secondaryApp = initializeApp(firebaseConfig, 'secondary');
const secondaryAuth = getAuth(secondaryApp);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export secondary auth for admin use
export { secondaryAuth, createUserWithEmailAndPassword };

// Auth providers
export const googleProvider = new GoogleAuthProvider();

// Collection references
export const COLLECTIONS = {
  USERS: 'users',
  COURSES: 'courses',
  LESSONS: 'lessons',
  QUIZZES: 'quizzes',
  QUESTIONS: 'questions',
  ENROLLMENTS: 'enrollments',
  PROGRESS: 'progress',
  QUIZ_ATTEMPTS: 'quizAttempts',
  REVIEWS: 'reviews',
  INVITATIONS: 'invitations',
  ATTACHMENTS: 'attachments'
};

// Auth functions
export const authFunctions = {
  // Sign up with email and password
  signUp: async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    
    // Create user document in Firestore
    await setDoc(doc(db, COLLECTIONS.USERS, userCredential.user.uid), {
      email,
      displayName,
      role: 'learner',
      points: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return userCredential.user;
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user document exists, if not create one
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        photoURL: user.photoURL,
        role: 'learner',
        points: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return user;
  },

  // Sign out
  signOut: async () => {
    await signOut(auth);
    window.location.href = '/';
  },

  // Password reset
  resetPassword: async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  },

  // Get current user
  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },

  // Subscribe to auth state changes
  onAuthStateChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
};

// Firestore helper functions
export const firestoreHelpers = {
  // Convert Firestore Timestamp to Date
  timestampToDate: (timestamp: Timestamp | null): Date | null => {
    return timestamp ? timestamp.toDate() : null;
  },

  // Get server timestamp
  getServerTimestamp: () => serverTimestamp(),

  // Generate a new document ID
  generateId: (collectionName: string) => {
    return doc(collection(db, collectionName)).id;
  }
};

// Storage helper functions
export const storageHelpers = {
  // Upload file
  uploadFile: async (path: string, file: File): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  },

  // Get download URL
  getFileUrl: async (path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    return getDownloadURL(storageRef);
  }
};

export {
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
  limit,
  addDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  increment
};

export default app;
