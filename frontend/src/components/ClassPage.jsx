import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ClassPage.css';

const ClassPage = () => {
  const [classData, setClassData] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { classId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userJson = localStorage.getItem('user');
        const userId = JSON.parse(userJson).id;

        if (!token || !userId) {
          navigate('/login');
          return;
        }

        // Fetch class details
        const classResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${userId}/classes/${classId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Fetch videos for the class
        const videosResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${userId}/classes/${classId}/videos`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!classResponse.ok || !videosResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const classDetails = await classResponse.json();
        const videoIds = await videosResponse.json();

        // Fetch full details for each video
        const videoDetailsPromises = videoIds.map(videoId => 
          fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${userId}/videos/${videoId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(res => res.json())
        );

        const videoDetails = await Promise.all(videoDetailsPromises);
        
        setClassData(classDetails);
        setVideos(videoDetails);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId, navigate]);

  const handleVideoClick = (videoId) => {
    navigate(`/videoplayer/${videoId}`);
  };

  if (loading) return <div className="class-page-loading">Loading...</div>;
  if (error) return <div className="class-page-error">Error: {error}</div>;
  if (!classData) return <div className="class-page-error">Class not found</div>;

  return (
    <div className="class-page-container">
      <div className="class-page-header">
        <h1>{classData.name}</h1>
        <div className="class-details">
          {classData.professor && <span>Professor: {classData.professor}</span>}
          {classData.term && <span>Term: {classData.term}</span>}
        </div>
      </div>

      <div className="videos-grid">
        {videos.length === 0 ? (
          <p className="no-videos-message">No videos available for this class yet.</p>
        ) : (
          videos.map((video) => (
            <div 
              key={video._id}
              className="video-card"
              onClick={() => handleVideoClick(video._id)}
            >
              <div className="video-preview">
                {video.link && (
                  <video 
                    src={video.link} 
                    preload="metadata"
                    poster={video.thumbnail}
                  />
                )}
              </div>
              <div className="video-card-content">
                <h3>{video.title}</h3>
                <p>{new Date(video.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClassPage;

