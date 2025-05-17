import React, { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import './VideoPlayer.css';
import { io } from "socket.io-client"
// const socket = io.connect("http://localhost:5001")


export default function VideoPlayer() {

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
                    <ReactPlayer
                        className="react-player"
                        url='https://youtu.be/e_04ZrNroTo?si=RU72z2S5nmrM62t0' //temporary url
                    />
                </div>
            </div>

            <div className="tab-section">
                <Tabs />
            </div>
        </div>


    );






}



