import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import './VideoPlayer.css';
import { io } from "socket.io-client"
// const socket = io.connect("http://localhost:5001")

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

export default function VideoPlayer() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('transcript');
  const playerRef = useRef(null);
  
  // Chatbot states
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  
  // Function to seek video to specific time
  const seekToTime = (timeInSeconds) => {
    if (playerRef.current) {
      playerRef.current.currentTime = timeInSeconds;
    }
  };

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

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || chatLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat/${videoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: userMessage })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { type: 'bot', content: data.answer || data.message }]);
    } catch (err) {
      setMessages(prev => [...prev, { type: 'bot', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) return <div className="video-player-loading">Loading...</div>;
  if (error) return <div className="video-player-error">Error: {error}</div>;
  if (!video) return <div className="video-player-error">Video not found</div>;

  return (
    <div className="page-container">
      <div className="video-section">
        <div className="video-container">
          <video controls className="main-video" ref={playerRef}>
            <source src={video.link} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
      <div className="tabs-container">
        <div className="bloc-tabs">
          <button
            className={activeTab === 'transcript' ? 'tabs active-tabs' : 'tabs'}
            onClick={() => setActiveTab('transcript')}
          >
            Transcript
          </button>
          <button
            className={activeTab === 'chatbot' ? 'tabs active-tabs' : 'tabs'}
            onClick={() => setActiveTab('chatbot')}
          >
            Chatbot
          </button>
          <button
            className={activeTab === 'chat' ? 'tabs active-tabs' : 'tabs'}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
        </div>
        <div className="content-tabs">
          <div className={activeTab === 'transcript' ? 'content active-content' : 'content'}>
            <div className="transcript-container">
              <div className="transcript-content">
                {video.transcript?.segments?.map((segment, idx) => (
                  <div
                    key={idx}
                    className="transcript-entry"
                    onClick={() => seekToTime(segment.start)}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="transcript-timestamp">{formatTimestamp(segment.start)}</span>
                    <span className="transcript-text">{segment.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className={activeTab === 'chatbot' ? 'content active-content' : 'content'}>
            <div className="content-area">
              <h3>Ask about this video</h3>
              <div className="content-body chat-body">
                <div className="messages-container">
                  {messages.length === 0 && (
                    <div className="empty-chat">
                      <p>Ask me anything about this video!</p>
                    </div>
                  )}
                  {messages.map((message, index) => (
                    <div key={index} className={`message ${message.type}`}>
                      <div className="message-content">
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="message bot">
                      <div className="message-content typing">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              <div className="chat-input-container">
                <div className="chat-input-wrapper">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about this video..."
                    className="chat-input"
                    rows="1"
                    disabled={chatLoading}
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="send-button"
                    disabled={!inputMessage.trim() || chatLoading}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className={activeTab === 'chat' ? 'content active-content' : 'content'}>
            <div className="chat-container">
              <p>Chat functionality coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



