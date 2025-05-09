import React from "react";
import ReactPlayer from "react-player";
import './VideoPlayer.css';

export default function VideoPlayer() {
    const Tabs = () => {
        return (
            <div>
                <div className="container">
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
        <div>
            <div className="video-page">
                <div className="video-section">
                    <ReactPlayer
                        className="react-player"
                        url='https://youtu.be/e_04ZrNroTo?si=RU72z2S5nmrM62t0' //temporary url
                        width='100%'
                        height='100%'
                    />
                </div>
            </div>

            <div className="tab-section">
                <h1>Here are the tabs</h1>
                <Tabs />
            </div>
        </div>


    );






}



