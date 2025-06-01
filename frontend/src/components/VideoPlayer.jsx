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
        console.log('Video data:', data); // Debug log
        console.log('Transcript data:', data.transcript); // Debug log
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

        // Format timestamp to MM:SS
        const formatTime = (seconds) => {
            if (typeof seconds !== 'number') {
                console.warn('Invalid timestamp:', seconds);
                return '00:00';
            }
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        };

        // Helper to get transcript data
        const getTranscript = () => {
            if (!video) return [];
            
            // Check for segments array in the transcript object
            if (video.transcript?.segments) {
                return video.transcript.segments;
            }
            // Fallback to direct transcript array
            else if (video.transcript) {
                return Array.isArray(video.transcript) ? video.transcript : [];
            }
            // Check other possible locations
            else if (video.transcripts?.segments) {
                return video.transcripts.segments;
            } 
            else if (video.transcripts) {
                return Array.isArray(video.transcripts) ? video.transcripts : [];
            } 
            else if (video.transcription?.segments) {
                return video.transcription.segments;
            }
            else if (video.transcription) {
                return Array.isArray(video.transcription) ? video.transcription : [];
            }
            
            console.log('No transcript found in video object. Available keys:', Object.keys(video));
            return [];
        };
        
        const transcript = getTranscript();
        console.log('Processed transcript data:', transcript);

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
                            <div className="transcript-container">
                                {transcript.length > 0 ? (
                                    <div className="transcript-content">
                                        {transcript.map((entry, index) => {
                                            // Handle both segment objects with start/end/text and direct text entries
                                            const text = entry.text || entry;
                                            const startTime = entry.start || 0;
                                            
                                            return (
                                                <div key={index} className="transcript-entry">
                                                    <span className="transcript-timestamp">
                                                        {formatTime(startTime)}
                                                    </span>
                                                    <span className="transcript-text">{text}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p>No transcript available for this video.</p>
                                )}
                            </div>
                        </div>
                        <div className={toggleState === 2 ? 'content active-content' : 'content'}>
                            <p>Insert bot here</p>
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



