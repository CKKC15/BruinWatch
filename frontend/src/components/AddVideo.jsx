import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import VideoInput from './VideoInput';
import 'react-datepicker/dist/react-datepicker.css';
import './AddVideo.css';
import { FaFileVideo, FaLink } from 'react-icons/fa';

const AddVideo = () => {
  const [lectureTitle, setLectureTitle] = useState('');
  const [className, setClassName] = useState('');  
  const [availableClasses, setAvailableClasses] = useState([]);
  const [classLoading, setClassLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoSource, setVideoSource] = useState(null); // 'file' or 'youtube'
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [youtubeError, setYoutubeError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const videoInputRef = useRef();
  const fileInputRef = useRef();

  // Handler to receive the uploaded file from VideoInput component
  const handleFileUploaded = (uploadedFile, name) => {
    setFile(uploadedFile);
    setFileName(name);
    setVideoSource('file');
    
    // Create object URL for preview
    if (uploadedFile) {
      const objectUrl = URL.createObjectURL(uploadedFile);
      setPreviewUrl(objectUrl);
    }
    
    // Clear YouTube input if it was previously set
    if (youtubeUrl) {
      setYoutubeUrl('');
    }
  };
  
  // Handler for file drop zone
  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      handleFileUploaded(droppedFile, droppedFile.name);
    }
  };
  
  // Handler for file browse
  const handleFileBrowse = () => {
    fileInputRef.current.click();
  };
  
  // Handler for file selection via input
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileUploaded(selectedFile, selectedFile.name);
    }
  };
  
  // Handler for YouTube URL input with auto-processing
  const handleYoutubeUrlChange = (e) => {
    const value = e.target.value;
    setYoutubeUrl(value);
    setYoutubeError('');
    
    // If value is empty, clear the preview
    if (!value) {
      setVideoSource(null);
      setPreviewUrl('');
      return;
    }
    
    // Auto-process URL after a short delay
    // Basic YouTube URL validation
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})$/;
    
    if (youtubeRegex.test(value)) {
      processYoutubeUrl(value);
    } else {
      // If not a valid URL format, clear the preview
      setVideoSource(null);
      setPreviewUrl('');
    }
  };
  
  // Function to process YouTube URL
  const processYoutubeUrl = (url) => {
    // Extract video ID
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) {
      const videoId = match[1];
      // Set as video source
      setVideoSource('youtube');
      setPreviewUrl(`https://www.youtube.com/embed/${videoId}`);
      
      // Clear file upload if it was previously set
      if (file) {
        setFile(null);
        setFileName('');
      }
    } else {
      setYoutubeError('Could not extract video ID from URL');
    }
  };
  
    const handleClassNameSelect = (name) => {
      setClassName(name);
  };

  useEffect(() => {
    const fetchClasses = async () => {
      setClassLoading(true);
      try {
        const token = localStorage.getItem('token');
        const userJson = localStorage.getItem('user');
        const userId = JSON.parse(userJson).id;
        
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${userId}/classnames`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const classNames = await response.json();
          setAvailableClasses(classNames);
        } else {
          console.error('Failed to fetch class names');
        }
      } catch (error) {
        console.error('Error fetching class names:', error);
      } finally {
        setClassLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const handleDateChange = (date) => {
    setDate(date);
  };

  const handleSave = async () => {
    if (!file && !youtubeUrl) {
      setError('Please upload a video file or enter a YouTube URL');
      return;
    }

    if (!lectureTitle || !className || !date) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');        
      const userId = user.id;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      
      // Add common fields
      formData.append('title', lectureTitle);
      formData.append('className', className);
      formData.append('date', date.toISOString());
      
      if (file) {
        // For file uploads - field name must be 'file' to match backend expectation
        formData.append('file', file);
      } else if (youtubeUrl) {
        // For YouTube URLs
        formData.append('youtubeUrl', youtubeUrl);
      }

      setStatus('Uploading video...');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${userId}/videos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        // We'll use this to track upload progress in the future if needed
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upload video');
      }

      setStatus('Processing video (this may take a few minutes)...');
      
      // If you want to show more detailed progress, you could use Server-Sent Events (SSE)
      // or WebSockets. For now, we'll just show a generic processing message.
      
      const data = await response.json();
      setStatus('Processing complete! Redirecting...');
      
      // Navigate to the video player with the new video ID
      setTimeout(() => {
        navigate(`/videoplayer/${data.videoId || data._id}`);
      }, 1000);
      
    } catch (err) {
      setError('Failed to save video: ' + (err.message || 'Unknown error'));
      console.error('Error saving video:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && videoSource === 'file') {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, videoSource]);

  return (
    <div className="add-video-container">
      <div className="add-video-content">
        {/* Left Column */}
        <div className="upload-section">
          {videoSource === 'youtube' ? (
            // Show video details when YouTube URL is processed
            <div className="video-details-section">
              <h2>Video Details</h2>
              <p>Enter information about your YouTube video</p>
            
              <div className="form-group">
                <label>Lecture Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={lectureTitle}
                  onChange={(e) => setLectureTitle(e.target.value)}
                  placeholder="Enter lecture title"
                  disabled={loading}
                />
              </div>
            
              <div className="form-group">
                <label>Class Name</label>
                {classLoading ? (
                  <p>Loading class names...</p>
                ) : availableClasses.length > 0 ? (
                  <div className="class-buttons-container">
                    {availableClasses.map((name, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`class-button ${className === name ? 'selected' : ''}`}
                        onClick={() => handleClassNameSelect(name)}
                        disabled={loading}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p>No available classes. Please create a class first.</p>
                )}
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
              
              {error && <div className="error-message">{error}</div>}
              {status && <div className="status-message">{status}</div>}
              {success && <div className="success-message">Video saved successfully! Redirecting to video player...</div>}
              
              <button 
                onClick={handleSave} 
                className="save-button"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Video'}
              </button>
            </div>
          ) : (
            // Show file upload UI
            <div className="file-upload-section">
              <h2>Upload Video File</h2>
              
              <div 
                className={`dropzone ${previewUrl && videoSource === 'file' ? 'with-video' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={previewUrl && videoSource === 'file' ? null : handleFileBrowse}
              >
                <div className="dropzone-content">
                  <FaFileVideo className="dropzone-icon" />
                  <p>Drag & Drop or</p>
                  <button className="browse-button">Browse Files</button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept="video/*" 
                    className="file-input-hidden" 
                  />
                </div>
                
                {previewUrl && videoSource === 'file' && (
                  <div className="inline-video-preview">
                    <video 
                      src={previewUrl} 
                      controls 
                    ></video>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Right Column */}
        <div className="form-section">
          {videoSource === 'file' ? (
            // Show video details when file is uploaded
            <div className="video-details-section">
              <h2>Video Details</h2>
              <p>Enter information about your uploaded video</p>
              
              <div className="form-group">
                <label>Lecture Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={lectureTitle}
                  onChange={(e) => setLectureTitle(e.target.value)}
                  placeholder="Enter lecture title"
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Class Name</label>
                {classLoading ? (
                  <p>Loading class names...</p>
                ) : availableClasses.length > 0 ? (
                  <div className="class-buttons-container">
                    {availableClasses.map((name, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`class-button ${className === name ? 'selected' : ''}`}
                        onClick={() => handleClassNameSelect(name)}
                        disabled={loading}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p>No available classes. Please create a class first.</p>
                )}
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
              
              {error && <div className="error-message">{error}</div>}
              {status && <div className="status-message">{status}</div>}
              {success && <div className="success-message">Video uploaded successfully! Redirecting...</div>}
              
              <button 
                onClick={handleSave} 
                className="save-button"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Video'}
              </button>
            </div>
          ) : (
            // Show YouTube link input
            <div className="youtube-section">
              <h2>Upload Youtube Link</h2>
              
              <div className={`youtube-input-container ${previewUrl && videoSource === 'youtube' ? 'youtube-container-expanded' : ''}`}>
                <div className="youtube-input-wrapper">
                  <FaLink className="youtube-icon" />
                  <p>Paste URL</p>
                  <div className="youtube-url-input-container">
                    <input
                      type="text"
                      placeholder="youtube.com"
                      value={youtubeUrl}
                      onChange={handleYoutubeUrlChange}
                      className="youtube-url-input"
                    />
                  </div>
                  {youtubeError && <div className="youtube-error">{youtubeError}</div>}
                </div>
                
                {previewUrl && videoSource === 'youtube' && (
                  <div className="inline-video-preview">
                    <iframe 
                      src={previewUrl} 
                      title="YouTube video player" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddVideo;
