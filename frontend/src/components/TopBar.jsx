import React from 'react';
import './TopBar.css';

const TopBar = () => {
  return (
    <div className="topbar">
      <div className="topbar-content">
        <div className="topbar-logo-container">
          <div className="topbar-logo" />
          <h1 className="topbar-title">BruinWatch</h1>
        </div>
      </div>
    </div>
  );
};

export default TopBar; 