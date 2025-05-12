import React from "react";
import ReactPlayer from "react-player";
import './VideoPlayer.css';

export default function VideoPlayer() {
    const Tabs = () => {
        return (
            <div>
                <div className="tabs-container">
                    <div className="bloc-tabs">
                        <button className="tabs-option">Transcript</button>
                        <button className="tabs-option">Whiteboard</button>
                        <button className="tabs-option">Chat</button>
                    </div>
                    <div className="content-tabs">
                        <div className="content active-content">
                            <h2>Transcript</h2>
                            <hr></hr>
                            <p>Insert transcript here</p>
                        </div>
                        <div className="content active-content">
                            <h2>Whiteboard</h2>
                            <hr></hr>
                            <p>Insert whiteboard here</p>
                        </div>
                        <div className="content active-content">
                            <h2>Chat</h2>
                            <hr></hr>
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
                        width='100%'
                        height='100%'
                    />
                </div>
            </div>

            <div className="tab-section">
                <Tabs />
            </div>
        </div>


    );






}



