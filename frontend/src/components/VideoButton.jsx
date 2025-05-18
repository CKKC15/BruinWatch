import React from "react";
import { FaPlay } from "react-icons/fa";
import "./VideoCard.css";

export default function VideoButton({ videoId, title, date, className, onClick }) {
  const handleClick = () => {
    if (onClick) {
      onClick(videoId);
    }
  };

  return (
    <div className="video-card" onClick={handleClick}>
      <div className="video-thumbnail">
        <div className="thumbnail-box">
          <div className="play-overlay">
            <FaPlay className="play-icon" />
          </div>
        </div>
      </div>
      <div className="video-info">
        <h3 className="video-title">{title}</h3>
        <p className="video-meta">{className} • {date}</p>
      </div>
    </div>
  );
}

