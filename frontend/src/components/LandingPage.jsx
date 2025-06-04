import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import logo from "/bruinwatch_logo.svg";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="landing-container">
      <div className="landing-left">
        <div className="logo-container">
          <img src={logo} alt="BruinWatch Logo" className="logo-image" />
        </div>
        <h1 className="brand-name">BruinWatch</h1>
        <p className="tagline">
          Revolutionizing the way students and educators engage<br />
          with long-form lecture videos.
        </p>
      </div>

      <div className="landing-right">
        <div className="feature-card">
          <h2 className="feature-title">Learning Made Easier</h2>

          <div className="feature-description">
            <p>
              BruinWatch is an AI-powered web app designed to transform passive
              lecture watching into active, efficient learning.
            </p>

            <p>
              Our technology parses video transcripts, distills them into concise,
              easy-to-review notes, and smart search for key concepts instantly
              with direct timestamp navigation.
            </p>

            <p>
              Our mission is to streamline academic video consumption by making
              lectures searchable, navigable, and digestible!
            </p>
          </div>

          <button
            className="get-started-button"
            onClick={handleGetStarted}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
