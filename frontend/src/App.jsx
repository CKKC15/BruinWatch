import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from 'react'
import './App.css'
import VideoInput from './components/VideoInput'
import VideoPlayer from './components/VideoPlayer'

function App() {
  const [count, setCount] = useState(0)

  return (
    // temporary routing
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VideoInput width={400} height={300} />} />
        <Route path="/videoplayer" element={<VideoPlayer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
