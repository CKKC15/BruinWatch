import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
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
        
        setIsSubmitting(false);
        navigate('/dashboard');
      } catch (error) {
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
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialResponse.credential
        }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setErrors({
          ...errors,
          google: data.message || 'Google authentication failed'
        });
      }
    } catch (error) {
      setErrors({
        ...errors,
        google: 'An error occurred during Google login'
      });
    }
  };

  const handleGoogleError = () => {
    setErrors({
      ...errors,
      google: 'Google sign in was unsuccessful'
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
    <div className="whole-container">
      <div className="auth-container">
        <div className="brand-title">
          BruinWatch
        </div>
        
        <div className="auth-card">
          <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-field">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="name"
              />
              {errors.name && <div className="error-message">{errors.name}</div>}
            </div>
          )}
          
          {errors.general && (
            <div className="error-text">
              {errors.general}
            </div>
          )}
          
          {errors.auth && (
            <div className="error-text">
              {errors.auth}
            </div>
          )}
          
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email"
            />
            {errors.email && (
              <div className="error-text">
                {errors.email}
              </div>
            )}
          </div>
          
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="password"
            />
            {errors.password && (
              <div className="error-text">
                {errors.password}
              </div>
            )}
          </div>
          
          {!isLogin && (
            <div className="form-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="confirm password"
              />
              {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
            </div>
          )}
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (isLogin ? 'Logging in...' : 'Creating account...') 
              : (isLogin ? 'Login' : 'Sign Up')}
          </button>
          
          <div className="google-button-container">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              text={isLogin ? "signin_with" : "signup_with"}
              shape="rectangular"
              size="large"
            />
          </div>
          {errors.google && <div className="error-message">{errors.google}</div>}
          
          <div className="link-text">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <a href="#" onClick={(e) => {e.preventDefault(); toggleForm();}}>
              {isLogin ? 'Sign up' : 'Sign in'}
            </a>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 