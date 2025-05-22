  import React, { useState, forwardRef, useImperativeHandle } from 'react';
import './VideoInput.css';

const VideoInput = forwardRef(({ onFileUploaded }, ref) => {
  const [source, setSource] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [error, setError] = useState('');

  useImperativeHandle(ref, () => ({
    // Methods that parent can call
    reset: () => {
      setSource('');
      setIsUploaded(false);
      setError('');
    }
  }));

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSource(file.name);
      setIsUploading(true);
      setError('');
      
      // Simulate upload process
      try {
        // For a real implementation, you might want to do pre-processing here
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsUploaded(true);
        // Pass the file data back to parent component
        if (onFileUploaded) {
          onFileUploaded(file, file.name);
        }
      } catch (error) {
        setError('Upload failed');
        setIsUploaded(false);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="video-input-container">
      <div className="upload-box" onClick={() => document.getElementById('video-upload').click()}>
        <input 
          type="file" 
          id="video-upload" 
          className="file-input"
          accept="video/*"
          onChange={handleFileChange}
        />
        <label htmlFor="video-upload" className="upload-label">
          <span className="upload-icon">+</span>
          <span>Select a video file to upload</span>
        </label>

        <div className="VideoInput_footer">
          {error && <div style={{ color: 'red', marginBottom: 6 }}>{error}</div>}
          {isUploading ? (
            <div>Uploading {source}...</div>
          ) : isUploaded ? (
            <div className="upload-success">
              <div>{source} uploaded successfully!</div>
            </div>
          ) : (
            <div>{source || "No file selected"}</div>
          )}
        </div>
      </div>
    </div>
  );
});

export default VideoInput;
