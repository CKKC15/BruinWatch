import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import './VideoPlayer.css';
import { io } from "socket.io-client"
// const socket = io.connect("http://localhost:5001")

export default function VideoPlayer() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user.id;
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${userId}/videos/${videoId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch video');
        }

        const data = await response.json();
        setVideo(data);
      } catch (err) {
        setError('Failed to load video. Please try again.');
        console.error('Error fetching video:', err);
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideo();
    }
  }, [videoId, navigate]);

    const Tabs = () => {
        const [toggleState, setToggleState] = useState(1);

        const toggleTab = (index) => {
            setToggleState(index)
        }

        return (
            <div>
                <div className="tabs-container">
                    <div className="bloc-tabs">
                        <button className={toggleState === 1 ? 'tabs active-tabs' : 'tabs'}
                            onClick={() => toggleTab(1)}>
                            Transcript
                        </button>
                        <button className={toggleState === 2 ? 'tabs active-tabs' : 'tabs'}
                            onClick={() => toggleTab(2)}>
                            Chatbot
                        </button>

                        <button className={toggleState === 3 ? 'tabs active-tabs' : 'tabs'}
                            onClick={() => toggleTab(3)}>
                            Chat
                        </button>
                    </div>
                    <div className="content-tabs">
                        <div className={toggleState === 1 ? 'content active-content' : 'content'}>
                            <p>Insert transcript here</p>
                        </div>
                        <div className={toggleState === 2 ? 'content active-content' : 'content'}>
                            <p> Insert bot here</p>
                        </div>
                        <div className={toggleState === 3 ? 'content active-content' : 'content'}>
                            <p>Insert chat here</p>

                        </div>
                    </div>
                </div>

            </div>
        );


    }

    return (
        <div className="page-container">
            <div className="video-section">
                <div className="video-container">
                    <div className="video-player-wrapper">
                        {loading ? (
                            <div className="loading-message">Loading video...</div>
                        ) : error ? (
                            <div className="error-message">{error}</div>
                        ) : video?.link ? (
                            <ReactPlayer
                                className="react-player"
                                url={video.link}
                                width="100%"
                                height="100%"
                                controls
                                config={{
                                    file: {
                                        attributes: {
                                            controlsList: 'nodownload',
                                            disablePictureInPicture: true
                                        }
                                    }
                                }}
                            />
                        ) : (
                            <div className="error-message">No video source available</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="tab-section">
                <Tabs />
            </div>
        </div>


    );






}



