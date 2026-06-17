import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { API_BASE_URL } from '../services/apiConfig';

// ─── Context ─────────────────────────────────────────────────────
const AuthContext = createContext(null);

/**
 * Custom hook to consume the AuthContext.
 * Must be used within an <AuthProvider>.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Sync the Firebase user to the backend MongoDB database.
 * Called after every successful authentication event.
 */
async function syncUserToBackend(firebaseUser) {
  try {
    const idToken = await firebaseUser.getIdToken();
    const res = await fetch(`${API_BASE_URL}/api/auth/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to sync user to backend');
    }

    const data = await res.json();
    return data.user;
  } catch (error) {
    console.error('Failed to sync user to backend:', error);
    return null;
  }
}

// ─── Provider ────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);         // Firebase Auth user object
  const [dbUser, setDbUser] = useState(null);      // MongoDB user profile
  const [loading, setLoading] = useState(true);    // Initial auth check
  const [error, setError] = useState(null);        // Auth error messages

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // ── Listen for Firebase auth state changes (login persistence) ──
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Sync to backend to ensure MongoDB user exists
        const mongoUser = await syncUserToBackend(firebaseUser);
        setDbUser(mongoUser);
      } else {
        setUser(null);
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ── Helper: Map Firebase error codes to friendly messages ───────
  const getErrorMessage = (errorCode) => {
    const errorMap = {
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/operation-not-allowed': 'This sign-in method is not enabled.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Invalid email or password. Please try again.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed.',
      'auth/cancelled-popup-request': 'Sign-in was cancelled.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
    };
    return errorMap[errorCode] || 'An unexpected error occurred. Please try again.';
  };

  // ── Sign Up with Email/Password ─────────────────────────────────
  const signUp = useCallback(async (email, password, displayName = '') => {
    try {
      setError(null);
      setLoading(true);

      const credential = await createUserWithEmailAndPassword(auth, email, password);

      // Update the Firebase profile with display name if provided
      if (displayName) {
        await updateProfile(credential.user, { displayName });
      }

      // Sync to backend
      const mongoUser = await syncUserToBackend(credential.user);
      setUser(credential.user);
      setDbUser(mongoUser);

      return { success: true, user: credential.user };
    } catch (err) {
      const message = getErrorMessage(err.code);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Log In with Email/Password ──────────────────────────────────
  const logIn = useCallback(async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const credential = await signInWithEmailAndPassword(auth, email, password);

      // Sync to backend
      const mongoUser = await syncUserToBackend(credential.user);
      setUser(credential.user);
      setDbUser(mongoUser);

      return { success: true, user: credential.user };
    } catch (err) {
      const message = getErrorMessage(err.code);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Sign In with Google ─────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const result = await signInWithPopup(auth, googleProvider);

      // Sync to backend
      const mongoUser = await syncUserToBackend(result.user);
      setUser(result.user);
      setDbUser(mongoUser);

      return { success: true, user: result.user };
    } catch (err) {
      // Don't show error if user just closed the popup
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setLoading(false);
        return { success: false, error: null };
      }
      const message = getErrorMessage(err.code);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Log Out ─────────────────────────────────────────────────────
  const logOut = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setDbUser(null);
      setError(null);

      // Clean up any legacy localStorage items
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('signupEmail');
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to log out. Please try again.');
    }
  }, []);

  // ── Get current Firebase ID Token (for manual use) ──────────────
  const getIdToken = useCallback(async () => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (err) {
      console.error('Failed to get ID token:', err);
      return null;
    }
  }, [user]);

  // ── Refresh MongoDB User Profile ──────────────────────────────────
  const refreshDbUser = useCallback(async () => {
    if (!user) return null;
    const mongoUser = await syncUserToBackend(user);
    setDbUser(mongoUser);
    return mongoUser;
  }, [user]);

  // ── Context value ──────────────────────────────────────────────
  const value = {
    // State
    user,       // Firebase Auth user
    dbUser,     // MongoDB user profile
    loading,    // Auth loading state
    error,      // Current error message
    setDbUser,  // Set MongoDB user profile directly

    // Actions
    signUp,
    logIn,
    signInWithGoogle,
    logOut,
    getIdToken,
    refreshDbUser,

    // Convenience getters
    isAuthenticated: !!user,
    isAdmin: dbUser?.role === 'admin',
    userEmail: user?.email || dbUser?.email || null,
    userName: dbUser?.firstName || user?.displayName || dbUser?.email || '',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
