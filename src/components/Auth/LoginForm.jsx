import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginForm = ({ toggleForm }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Logging in with:', email, password);
    // Authenticate with MongoDB backend
    try {
      const res = await fetch(`http://localhost:5000/api/users/${email}`);
      if (res.ok) {
        const userData = await res.json();
        localStorage.setItem('user', JSON.stringify(userData));
        navigate('/dashboard');
      } else {
        alert('User not found. Please sign up first.');
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
