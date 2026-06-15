import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { API_BASE_URL } from '@/services/apiConfig';

const SignupForm = ({ toggleForm }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    console.log('Signing up with:', email);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        // Clear any existing user data
        localStorage.removeItem('user');
        localStorage.removeItem('applications');
        localStorage.removeItem('events');
        
        // Store token and temporary email so Dashboard can prefill it
        localStorage.setItem('token', data.token);
        localStorage.setItem('signupEmail', email);
        navigate('/dashboard');
      } else {
        alert(data.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.error('Error signing up:', err);
      alert('Backend connection failed. Is the server running?');
    }
  };

  return (
    <div className="auth-form">
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Create a password"
          />
        </div>
        <div className="input-group">
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm your password"
          />
        </div>
        <button type="submit" className="auth-btn">Sign Up</button>
      </form>
      <p className="auth-switch">
        Already have an account? <span onClick={toggleForm}>Log in</span>
      </p>
    </div>
  );
};

export default SignupForm;
