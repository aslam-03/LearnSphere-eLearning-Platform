/**
 * ============================================
 * LEARNSPHERE AUTHENTICATION CONTEXT
 * ============================================
 * 
 * PURPOSE:
 * Central authentication state management for the LearnSphere platform.
 * Handles Firebase Auth integration and Firestore user profile resolution.
 * 
 * ROLE RESOLUTION FLOW:
 * 1. Firebase Auth State Changes → onAuthStateChanged triggered
 * 2. If user logged in → Fetch user document from Firestore (users/{uid})
 * 3. Extract role field from Firestore: "admin" | "instructor" | "learner"
 * 4. Store in userProfile state (NEVER localStorage)
 * 5. Components consume role via useAuth() hook
 * 
 * CRITICAL RULES:
 * - Role MUST come from Firestore only
 * - No role in localStorage
 * - Loading state prevents UI flicker
 * - Role field is mandatory in Firestore
 * 
 * FIRESTORE USER DOCUMENT STRUCTURE:
 * {
 *   uid: string,
 *   email: string,
 *   displayName: string,
 *   role: "admin" | "instructor" | "learner",  // ← MANDATORY
 *   totalPoints: number,
 *   badge: string,
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp
 * }
 */

import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

/**
 * Custom hook to access authentication context
 * @throws {Error} If used outside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

/**
 * Helper function to get role-based redirect path
 * Implements LearnSphere role routing rules:
 * - admin → /admin
 * - instructor → /instructor  
 * - learner → /app
 */
export const getRoleRedirectPath = (role) => {
  const roleRoutes = {
    admin: '/admin',
    instructor: '/instructor',
    learner: '/app',
  };
  return roleRoutes[role] || '/app'; // Default to learner dashboard
};

export const AuthProvider = ({ children }) => {
  // Auth state: Firebase user object
  const [currentUser, setCurrentUser] = useState(null);
  
  // User profile: Firestore user document with role
  const [userProfile, setUserProfile] = useState(null);
  
  // Loading state: true during auth initialization and role resolution
  const [loading, setLoading] = useState(true);

  /**
   * Register new user
   * NOTE: Only learners can self-register. 
   * Instructors are created by admins via /admin/create-instructor
   * 
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} displayName - User full name
   * @param {string} role - User role (default: 'learner')
   * @returns {Promise<User>} Firebase user object
   */
  const register = async (email, password, displayName, role = 'learner') => {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create Firestore user document with role
      const userRef = doc(db, 'users', user.uid);
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName,
        role, // ← CRITICAL: Role stored in Firestore
        totalPoints: 0,
        badge: 'Newbie',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await setDoc(userRef, userData);

      // Fetch and set profile immediately
      await fetchUserProfile(user.uid);

      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  /**
   * Login existing user
   * Role resolution happens automatically via onAuthStateChanged
   * 
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<UserCredential>} Firebase user credential
   */
  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  /**
   * Logout current user
   * Clears auth state and user profile
   */
  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  /**
   * Fetch user profile from Firestore
   * This is where role resolution happens
   * 
   * @param {string} uid - User ID
   * @returns {Promise<Object|null>} User profile with role or null
   */
  const fetchUserProfile = async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const profile = { id: userSnap.id, ...userSnap.data() };
        
        // Validate that role exists
        if (!profile.role) {
          console.error('User profile missing role field:', uid);
          throw new Error('User profile is missing required role field');
        }

        // Validate role value
        const validRoles = ['admin', 'instructor', 'learner'];
        if (!validRoles.includes(profile.role)) {
          console.error('Invalid role value:', profile.role);
          throw new Error(`Invalid role: ${profile.role}`);
        }

        setUserProfile(profile);
        return profile;
      } else {
        console.error('User profile not found in Firestore:', uid);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

  /**
   * Listen to Firebase auth state changes
   * This is the core of our auth system:
   * 1. User logs in → onAuthStateChanged fires
   * 2. Fetch user profile from Firestore
   * 3. Extract role and store in userProfile
   * 4. Set loading to false (enable UI)
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // User is logged in - fetch their profile and role from Firestore
        try {
          await fetchUserProfile(user.uid);
        } catch (error) {
          console.error('Failed to load user profile:', error);
          // If profile fetch fails, sign out the user
          await signOut(auth);
          setUserProfile(null);
        }
      } else {
        // User is logged out
        setUserProfile(null);
      }
      
      // Auth state resolved - stop loading
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const value = {
    currentUser,        // Firebase Auth user
    userProfile,        // Firestore user document with role
    role: userProfile?.role,  // Quick access to role
    loading,            // Auth initialization state
    register,           // Register function
    login,              // Login function
    logout,             // Logout function
    refreshProfile: () => currentUser && fetchUserProfile(currentUser.uid),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
