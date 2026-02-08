import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { 
  auth, 
  authFunctions, 
  db, 
  doc, 
  getDoc,
  COLLECTIONS 
} from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'instructor' | 'learner';
  points: number;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
      
      if (user) {
        // Invalidate user query when auth state changes
        queryClient.invalidateQueries({ queryKey: ["user"] });
      } else {
        queryClient.setQueryData(["user"], null);
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  // Fetch user profile from Firestore
  const { data: user, isLoading: isProfileLoading } = useQuery<User | null>({
    queryKey: ["user", firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser) return null;
      
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
      
      if (!userDoc.exists()) {
        // Return basic user info if profile doesn't exist yet
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          photoURL: firebaseUser.photoURL,
          role: 'learner' as const,
          points: 0
        };
      }
      
      const data = userDoc.data();
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || data.email,
        displayName: data.displayName || firebaseUser.displayName,
        photoURL: data.photoURL || firebaseUser.photoURL,
        role: data.role || 'learner',
        points: data.points || 0
      };
    },
    enabled: !!firebaseUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Sign up mutation
  const signUpMutation = useMutation({
    mutationFn: async ({ email, password, displayName }: { email: string; password: string; displayName: string }) => {
      return authFunctions.signUp(email, password, displayName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  // Sign in mutation
  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return authFunctions.signIn(email, password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  // Google sign in mutation
  const googleSignInMutation = useMutation({
    mutationFn: async () => {
      return authFunctions.signInWithGoogle();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  // Sign out mutation
  const signOutMutation = useMutation({
    mutationFn: async () => {
      return authFunctions.signOut();
    },
    onSuccess: () => {
      queryClient.setQueryData(["user"], null);
      queryClient.clear();
    },
  });

  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      return authFunctions.resetPassword(email);
    },
  });

  // Get ID token for API calls
  const getIdToken = async (): Promise<string | null> => {
    if (!firebaseUser) return null;
    try {
      return await firebaseUser.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  };

  return {
    user,
    firebaseUser,
    isLoading: loading || isProfileLoading,
    isAuthenticated: !!firebaseUser,
    
    // Auth methods
    signUp: signUpMutation.mutate,
    signIn: signInMutation.mutate,
    signInWithGoogle: googleSignInMutation.mutate,
    signOut: signOutMutation.mutate,
    resetPassword: resetPasswordMutation.mutate,
    
    // Loading states
    isSigningUp: signUpMutation.isPending,
    isSigningIn: signInMutation.isPending,
    isSigningInWithGoogle: googleSignInMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    
    // Errors
    signUpError: signUpMutation.error,
    signInError: signInMutation.error,
    googleSignInError: googleSignInMutation.error,
    
    // Utility
    getIdToken,
    
    // Legacy compatibility
    logout: signOutMutation.mutate,
    isLoggingOut: signOutMutation.isPending,
  };
}
