import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ClassPage.css';

function formatTimestamp(seconds) {
  if (seconds === undefined || seconds === null || isNaN(seconds)) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } else {
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}

const ClassPage = () => {
  const [classData, setClassData] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { classId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

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

        // Fetch class details (still need auth to verify user is in class)
        const classResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${userId}/classes/${classId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Fetch ALL videos for the class (no userId needed since auth was removed)
        const videosResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${userId}/classes/${classId}/videos`);

        if (!classResponse.ok || !videosResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const classDetails = await classResponse.json();
        const allVideos = await videosResponse.json(); // This should now return full video objects, not just IDs

        console.log('Class details:', classDetails);
        console.log('Videos received from API:', allVideos);
        console.log('Number of videos:', allVideos.length);

        setClassData(classDetails);
        setVideos(allVideos); // Directly set the videos since we get full objects
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

  const handleSearch = async () => {
    if (!searchTerm.trim() || !classData?.name) return;

    try {
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');
      const userId = JSON.parse(userJson).id;

      const className = encodeURIComponent(classData.name);  // URL-safe
      console.log(`${className}`)
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/users/${userId}/videos/search/${className}?keyword=${encodeURIComponent(searchTerm)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        const text = await response.text();
        console.error('Backend error:', response.status, text);
        throw new Error('Failed to search videos');
      }

      const results = await response.json();
      setSearchResults(results);
    } catch (err) {
      setError(err.message);
    }
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
      <div className="class-page-search">
        <form
          onSubmit={(e) => {
            e.preventDefault(); // Prevent form from reloading the page
            handleSearch();
          }}
        >
          <input
            type="text"
            placeholder="Search videos by keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>


      <div className="videos-grid">
        {searchResults.length > 0
          ? searchResults.map(({ video, matchedSegments }) => (
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

                {matchedSegments && matchedSegments.length > 0 && (
                  <div className="matched-segments">
                    <strong>Matched Segments:</strong>
                    <ul>
                      {matchedSegments.map((segment, i) => (
                        <li key={i}>
                          <span>
                            <button
                              className="timestamp-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/videoplayer/${video._id}`, {
                                  state: { startTime: Math.floor(segment.start) }
                                });
                              }}
                            >
                              {segment.text} ({formatTimestamp(segment.start)})
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))
          : videos.map((video) => (
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
          ))}

      </div>
    </div>
  );
};

export default ClassPage;

