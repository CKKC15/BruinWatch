import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './Chat.css';

// Preset profile pictures
const profilePictures = [
  '/profile-pics/avatar1.png',
  '/profile-pics/avatar2.png',
  '/profile-pics/avatar3.png',
  '/profile-pics/avatar4.png',
  '/profile-pics/avatar5.png',
  '/profile-pics/avatar6.png',
];

const getProfilePicturePath = (index) => {
  if (index >= 1 && index <= profilePictures.length) {
    return profilePictures[index - 1];
  }
  return '/pfp.png'; // default picture
};

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [userProfilePicIndex, setUserProfilePicIndex] = useState(1);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUsername(user.name || user.email.split('@')[0]);
      setUserProfilePicIndex(user.profilePictureIndex || 1);
      setShowUsernameInput(false);
    } else {
      setShowUsernameInput(true);
    }

    const newSocket = io(import.meta.env.VITE_BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('receive-message', (data) => {
      setMessages(prev => [...prev, {
        message: data.message,
        sender: data.sender,
        timestamp: data.timestamp,
        isOwn: false,
        profilePictureIndex: data.profilePictureIndex
      }]);
    });

    newSocket.on('user-joined', (data) => {
      setMessages(prev => [...prev, {
        message: data.message,
        sender: data.sender,
        timestamp: data.timestamp,
        isSystem: true,
        profilePictureIndex: data.profilePictureIndex
      }]);
    });

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createRoom = () => {
    if (!socket || !username.trim()) return;

    socket.emit('create-room', (response) => {
      if (response.success) {
        setCurrentRoom(response.roomId);
        setRoomCode(response.roomCode);
        setMessages([]);
      }
    });
  };

  const joinRoom = () => {
    if (!socket || !joinCode.trim() || !username.trim()) return;

    socket.emit('join-room', joinCode.toUpperCase(), {
      username,
      profilePictureIndex: userProfilePicIndex
    }, (response) => {
      if (response.success) {
        setCurrentRoom(response.roomId);
        setRoomCode(joinCode.toUpperCase());
        setMessages([]);
      } else {
        alert('Room not found!');
      }
    });
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !currentRoom || !socket) return;

    const messageData = {
      room: currentRoom,
      message: inputMessage,
      sender: username,
      profilePictureIndex: userProfilePicIndex,
      timestamp: Date.now()
    };

    socket.emit('send-message', messageData);

    setMessages(prev => [...prev, {
      message: inputMessage,
      sender: username,
      timestamp: Date.now(),
      isOwn: true,
      profilePictureIndex: userProfilePicIndex
    }]);

    setInputMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleUsernameSubmit = () => {
    if (username.trim()) {
      setShowUsernameInput(false);
    }
  };

  if (showUsernameInput) {
    return (
      <div className="chat-container">
        <div className="username-setup">
          <h3>Enter your name</h3>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name..."
            onKeyPress={(e) => e.key === 'Enter' && handleUsernameSubmit()}
          />
          <button onClick={handleUsernameSubmit} disabled={!username.trim()}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="chat-container">
        <div className="room-setup">
          <h3>Live Chat</h3>

          <div className="room-actions">
            <div className="create-room-section">
              <button onClick={createRoom} className="create-room-btn">
                Create New Room
              </button>
            </div>

            <div className="join-room-section">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter room code..."
                maxLength={6}
              />
              <button onClick={joinRoom} disabled={!joinCode.trim()}>
                Join Room
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h4>Room: {roomCode}</h4>
        <button
          onClick={() => {
            setCurrentRoom(null);
            setRoomCode('');
            setMessages([]);
          }}
          className="leave-room-btn"
        >
          Leave Room
        </button>
      </div>

      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.isOwn ? 'own' : msg.isSystem ? 'system' : 'other'}`}>
            <img
              src={getProfilePicturePath(msg.profilePictureIndex)}
              alt="Profile"
              className="chat-profile-picture"
            />
            <div className="message-content">
              <div className="message-sender">{msg.sender}</div>
              <div className="message-text">{msg.message}</div>
              <div className="message-timestamp">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="chat-input"
            rows="1"
          />
          <button
            onClick={sendMessage}
            className="send-button-inside"
            disabled={!inputMessage.trim()}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
