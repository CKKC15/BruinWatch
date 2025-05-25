import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Info.css';

const Info = () => {
  const navigate = useNavigate();

  return (
    <div className="info-container">
      <div className="info-content">
        <div className="info-header">
          <h1 className="info-title">Info</h1>
        </div>
      </div>
    </div>
  );
};

export default Info;
