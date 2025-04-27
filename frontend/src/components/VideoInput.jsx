import React from 'react';
import './VideoInput.css';

const VideoInput = () => {
  return (
    <div className="video-input-container">
      <h1>Upload Video</h1>
      <p>This is the video upload page you would see after successful login.</p>
      
      <div className="upload-box">
        <input 
          type="file" 
          id="video-upload" 
          className="file-input"
          accept="video/*"
        />
        <label htmlFor="video-upload" className="upload-label">
          <span className="upload-icon">+</span>
          <span>Select a video file to upload</span>
        </label>
      </div>
    </div>
  );
};

export default VideoInput;
