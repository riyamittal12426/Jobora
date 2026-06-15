import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { API_BASE_URL } from '@/services/apiConfig';

const LoginForm = ({ toggleForm }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Logging in with:', email);
    // Authenticate with MongoDB backend
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        alert(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Error logging in:', err);
      alert('Backend connection failed. Is the server running?');
    }
  };

  return (
    <div className="auth-form">
      <h2>Welcome Back</h2>
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
            placeholder="Enter your password"
          />
        </div>
        <button type="submit" className="auth-btn">Log In</button>
      </form>
      <p className="auth-switch">
        Don't have an account? <span onClick={toggleForm}>Sign up</span>
      </p>
    </div>
  );
};

export default LoginForm;
