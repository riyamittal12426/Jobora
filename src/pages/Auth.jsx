import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/Auth/LoginForm';
import SignupForm from '../components/Auth/SignupForm';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const toggleForm = () => setIsLogin(!isLogin);

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0b0b0e] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-800 border-t-purple-500"></div>
        <p className="mt-4 text-sm font-medium tracking-wide text-gray-400">Loading session...</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        {isLogin ? (
          <LoginForm toggleForm={toggleForm} />
        ) : (
          <SignupForm toggleForm={toggleForm} />
        )}
      </div>
    </div>
  );
};

export default Auth;