import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    email: '',
    confirmPassword: ''
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
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!isLogin) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (validateForm()) {
      try {
        const apiEndpoint = isLogin ? '/users/login' : '/users/register';
        const payload = isLogin ? 
          { email: formData.email, password: formData.password } :
          { name: formData.name, email: formData.email, password: formData.password };

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${apiEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Authentication failed');
        }
        
        // Save token to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log(isLogin ? 'Login successful' : 'Registration successful', data);
        setIsSubmitting(false);
        navigate('/dashboard');
      } catch (error) {
        console.error('Authentication error:', error);
        setErrors({
          ...errors,
          auth: error.message || 'Authentication failed. Please try again.'
        });
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    console.log('Google login successful:', credentialResponse);
    
    try {
      // In a real implementation, you would send the credential to your backend
      // For now, we'll just simulate the backend response
      alert('Google authentication is in development mode. Proceeding to dashboard...');
      
      // You would typically do something like this:
      /*
      const response = await fetch('http://localhost:5000/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      
      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      */
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Google authentication error:', error);
      setErrors({
        ...errors,
        google: 'Google authentication failed. Please try again.'
      });
    }
  };

  const handleGoogleError = () => {
    console.log('Google login failed');
    alert('Google authentication is in development mode. Please use the email/password form instead.');
    setErrors({
      ...errors,
      google: 'Google login is in development mode. Please use the form above.'
    });
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setErrors({});
    // Reset form data when toggling
    setFormData({
      name: '',
      password: '',
      email: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p>{isLogin ? 'Login to continue to BruinWatch' : 'Sign up to get started'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
                placeholder="Enter your full name"
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="Enter your email"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
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
              placeholder={isLogin ? 'Enter your password' : 'Create a password (min 6 characters)'}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'error' : ''}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          )}
          
          {errors.auth && <div className="error-message auth-error">{errors.auth}</div>}
          
          <button 
            type="submit" 
            className="login-button"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (isLogin ? 'Logging in...' : 'Creating account...') 
              : (isLogin ? 'Login' : 'Sign Up')}
          </button>
          
          <div className="form-footer">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" className="toggle-form-button" onClick={toggleForm}>
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </div>
        </form>
        
        <div className="separator">
          <span>OR</span>
        </div>
        
        <div className="google-login-container">
          <div className="google-button-container">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              shape="rectangular"
              text={isLogin ? "signin_with" : "signup_with"}
              theme="filled_blue"
              size="large"
              width="100%"
              logo_alignment="left"
              type="standard"
              locale="en"
              ux_mode="popup"
            />
          </div>
          {errors.google && <span className="error-message">{errors.google}</span>}
        </div>
      </div>
    </div>
  );
};

export default Login; 