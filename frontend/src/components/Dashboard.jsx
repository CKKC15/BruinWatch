import React, { useState, useEffect } from 'react';
import { FaRegStar } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [hoveredCard, setHoveredCard] = useState(null);


  const lectures = [
    { id: 1, title: 'Lecture 1', video: 'dummy.mp4' },
    { id: 2, title: 'Lecture 2', video: 'dummy.mp4' },
    { id: 3, title: 'Lecture 3', video: 'dummy.mp4' },
    { id: 4, title: 'Lecture 4', video: 'dummy.mp4' },
    { id: 5, title: 'Lecture 5', video: 'dummy.mp4' },
    { id: 6, title: 'Lecture 6', video: 'dummy.mp4' },
    { id: 7, title: 'Lecture 7', video: 'dummy.mp4' },
    { id: 8, title: 'Lecture 8', video: 'dummy.mp4' },
  ];

  return (
    <div className="dashboard-content">
      <div className="lecture-grid">
        {lectures.map((lecture) => (
          <div 
            key={lecture.id} 
            className="lecture-card"
            onMouseEnter={() => setHoveredCard(lecture.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {hoveredCard === lecture.id && (
              <>
                <button className="bookmark-button">
                  <FaRegStar size={20} />
                </button>
                <button className="options-button">
                  <BsThreeDotsVertical size={20} />
                </button>
              </>
            )}
            <video 
              src={lecture.video} 
              muted 
              loop 
              autoPlay
              className="lecture-video"
            />
            <div className="lecture-info">
              <h3>{lecture.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard; 