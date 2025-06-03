import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import "./Chat.css";

export default function Chat() {
  const socket = useRef(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState("");
  const [room, setRoom] = useState("");

  useEffect(() => {
    socket.current = io("http://localhost:5000");

    const handleMessage = (data) => {
      setChat((prevChat) => prevChat + `${data.sender}: ${data.message}\n`);
    };

    socket.current.on("receive-message", handleMessage);

    return () => {
      socket.current.off("receive-message", handleMessage);
      socket.current.disconnect(); // cleanup the socket
    };
  }, []);

  const joinRoom = () => {
    if (room !== "") {
      socket.current.emit("join-room", room);
    }
  };

  const sendMessage = () => {
    if (message.trim() !== "") {
      socket.current.emit("send-message", { message, room, sender: "You" });
      setMessage("");
    }
  };

  return (
    <div className="chat-container">
      <h1>Lecture Chat</h1>

      <input
        className="chat-input"
        placeholder="Enter room name..."
        value={room}
        onChange={(e) => setRoom(e.target.value)}
      />
      <button className="chat-button" onClick={joinRoom}>Join Room</button>

      <div className="chat-box">
        <pre className="chat-messages">{chat}</pre>
      </div>

      <div className="chat-controls">
        <input
          className="chat-input"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="chat-button" onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
