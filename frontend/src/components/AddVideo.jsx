import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import VideoInput from './VideoInput';
import 'react-datepicker/dist/react-datepicker.css';
import './AddVideo.css';

const AddVideo = () => {
  const [className, setClassName] = useState('');
  const [date, setDate] = useState(null);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const videoInputRef = useRef();

  // Handler to receive the uploaded file from VideoInput component
  const handleFileUploaded = (uploadedFile, name) => {
    setFile(uploadedFile);
    setFileName(name);
  };

  const handleClassNameChange = (e) => {
    setClassName(e.target.value);
  };

  const handleDateChange = (date) => {
    setDate(date);
  };

  const handleSave = async () => {
    if (!file) {
      setError('Please upload a video file');
      return;
    }

    if (!className || !date) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      
      setSuccess(true);
      // Navigate to video player page
      setTimeout(() => {
        navigate(`/videoplayer/${video._id}`);
      }, 1500);
    } catch (err) {
      setError('Failed to create video: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-video-container">
      <div className="add-video-content">
        <div className="upload-section">
          <h2>Upload Video</h2>
          <p>Upload a video file from your computer</p>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100% - 80px)', margin: 40 }}>
            <VideoInput ref={videoInputRef} onFileUploaded={handleFileUploaded} />
          </div>
        </div>
        
        <div className="form-section">
          <h2>Video Details</h2>
          <p>Enter information about your video</p>
          
          <div className="form-group">
            <label htmlFor="className">Class Name</label>
            <input
              type="text"
              id="className"
              placeholder="Enter class name"
              value={className}
              onChange={handleClassNameChange}
              className="form-input"
              disabled={loading}
            />
          </div>
          
          <div className="form-group calendar-container">
            <label>Date</label>
            <div className="calendar-wrapper">
              <DatePicker
                selected={date}
                onChange={handleDateChange}
                inline
                className="centered-calendar"
                dateFormat="MMMM d, yyyy"
              />
            </div>
          </div>
          
          {fileName && (
            <div className="file-info">
              <span>Selected file:</span> {fileName}
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">Video saved successfully! Redirecting to video player...</div>}
          
          <button 
            onClick={handleSave} 
            className="save-button"
            disabled={loading || !file}
          >
            {loading ? 'Saving...' : 'Save Video'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddVideo;
