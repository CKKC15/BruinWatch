import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (validateForm()) {
      // Simulate API call
      setTimeout(() => {
        console.log('Login successful with:', formData);
        setIsSubmitting(false);
        navigate('/dashboard');
      }, 1000);
    } else {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    console.log('Google login successful:', credentialResponse);
    // For development, just navigate to dashboard
    alert('Google authentication is in development mode. Proceeding to dashboard...');
    navigate('/dashboard');
  };

  const handleGoogleError = () => {
    console.log('Google login failed');
    alert('Google authentication is in development mode. Please use the username/password form instead.');
    setErrors({
      ...errors,
      google: 'Google sign-in is in development mode. Please use the form above.'
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Sign in to continue to BruinWatch</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? 'error' : ''}
              placeholder="Enter your username"
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              placeholder="Enter your password"
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="separator">
          <span>OR</span>
        </div>
        
        <div className="google-login-container">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            shape="rectangular"
            text="signin_with"
            theme="filled_blue"
            size="large"
            width="100%"
          />
          {errors.google && <span className="error-message">{errors.google}</span>}
        </div>
      </div>
    </div>
  );
};

export default Login; 