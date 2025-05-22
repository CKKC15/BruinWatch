import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        <h1 className="landing-title">BruinWatch</h1>
        <p className="landing-subtitle">Your video learning platform</p>
        <button 
          className="get-started-button" 
          onClick={handleGetStarted}
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
