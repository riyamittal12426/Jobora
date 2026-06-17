import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm = ({ toggleForm }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { logIn, signInWithGoogle, error: authError } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email) {
      setLocalError('Email is required.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setLocalError('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setLocalError('Password is required.');
      return false;
    }
    setLocalError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setLocalError('');

    const res = await logIn(email, password);
    setIsSubmitting(false);

    if (res.success) {
      navigate('/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setLocalError('');
    
    const res = await signInWithGoogle();
    setIsSubmitting(false);

    if (res.success) {
      navigate('/dashboard');
    } else if (res.error) {
      setLocalError(res.error);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="auth-form">
      <h2>Welcome Back</h2>
      
      {displayError && (
        <div className="auth-error">
          <span>⚠️</span>
          <span>{displayError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            placeholder="name@example.com"
            autoComplete="email"
            required
          />
        </div>
        
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        <button 
          type="submit" 
          className="auth-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <div className="auth-divider">or</div>

      <button 
        type="button" 
        className="google-btn"
        onClick={handleGoogleSignIn}
        disabled={isSubmitting}
      >
        <img 
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
          alt="Google logo" 
        />
        Continue with Google
      </button>

      <p className="auth-switch">
        Don't have an account? <span onClick={isSubmitting ? null : toggleForm}>Sign up</span>
      </p>
    </div>
  );
};

export default LoginForm;
