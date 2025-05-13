import React from "react";
import ReactPlayer from "react-player";
import "./VideoPlayer.css";
import {io} from "socket.io-client"
import { useEffect, useState } from "react";
const socket = io.connect("http://localhost:5001")

export default function VideoPlayer() {
    const [message, setMessage] = useState("");
    const [chat, setChat] = useState("");
    const [messageReceived, setMessageReceived] = useState("");
    const sendMessage = () => {
        socket.emit("send-message", {message})
        setChat((prevChat) => prevChat + message + "\n");
    }

    useEffect(() => {
        const handleMessage = (data) => {
          setChat((prevChat) => prevChat + data.message + "\n");
        };
      
        // Add the listener
        socket.on("receive_message", handleMessage);
      
        // Cleanup the listener when the component is unmounted or socket changes
        return () => {
          socket.off("receive_message", handleMessage);
        };
      }, [socket]); 

  const Tabs = () => {
    return (
      <div>
        <div className="bloc-tabs">
          <button className="tabs-option">Hello</button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="video-page">
        <div className="video-section">
          <ReactPlayer
            className="react-player"
            url="https://youtu.be/e_04ZrNroTo?si=RU72z2S5nmrM62t0" //temporary url
            width="100%"
            height="100%"
            controls
          />
        </div>
      </div>

      <div className="tab-container">
        <h1>Here are the tabs</h1>
      </div>

      <div className="socket">
        <input placeholder="message" onChange={(event) => {
            setMessage(event.target.value)
        }}></input>
        <button onClick={sendMessage}>Send Message</button>
        <h1>Message: </h1>
        <p className="chat-styling">{chat}</p>
        
      </div>
    </div>
  );
}
