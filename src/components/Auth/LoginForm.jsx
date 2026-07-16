import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
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

    const trimmedEmail = email.trim();
    console.log('[Login Debug] Attempting login with email:', trimmedEmail);
    const res = await logIn(trimmedEmail, password);
    console.log('[Login Debug] Result:', res);
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

        <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '8px' }}>
          <span 
            onClick={async () => {
              const trimmed = email.trim();
              if (!trimmed) { setLocalError('Enter your email first, then click Forgot Password.'); return; }
              try {
                await sendPasswordResetEmail(auth, trimmed);
                setLocalError('');
                alert('Password reset email sent! Check your inbox.');
              } catch (err) {
                console.error(err);
                setLocalError('Could not send reset email. Check the email address.');
              }
            }}
            style={{ fontSize: '12px', color: '#a78bfa', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Forgot Password?
          </span>
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
