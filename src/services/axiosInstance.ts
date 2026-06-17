import axios from 'axios';
import { auth } from '../config/firebase';
import { API_BASE_URL } from './apiConfig';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Automatically inject the Firebase ID token if a user is logged in
axiosInstance.interceptors.request.use(
  async (config) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (err) {
        console.error('Error fetching Firebase ID token for request interceptor:', err);
      }
    } else {
      // Fallback: If currentUser is null (e.g. during initial load/onAuthStateChanged delay),
      // check if we stored a token as a fallback (though auth.currentUser is the source of truth)
      // Usually, onAuthStateChanged handles this, so auth.currentUser is reliable.
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Global error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response) {
      const { status } = error.response;
      
      // 401 Unauthorized: Session is expired or invalid
      if (status === 401 && !originalRequest._retry) {
        console.warn('🔒 Unauthorized access detected (401). session may have expired.');
        // We let the components/contexts handle redirecting or cleaning up if necessary.
      }
      
      // 403 Forbidden: User does not have authorization (e.g. not admin)
      if (status === 403) {
        console.error('🚫 Access denied (403). Insufficient permissions.');
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
