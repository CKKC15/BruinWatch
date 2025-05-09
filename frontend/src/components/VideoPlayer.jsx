import React from "react";
import ReactPlayer from "react-player";
import './VideoPlayer.css';

export default function VideoPlayer() {
    const Tabs = () => {
        return (
            <div>
                <div className="bloc-tabs">
                    <button className="tabs-option">
                        Hello
                    </button>
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

            <div className="tab-container">
                <h1>Here are the tabs</h1>
            </div>
        </div>


    );






}



