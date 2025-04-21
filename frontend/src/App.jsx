import { useState } from 'react'
import './App.css'
import VideoInput from './components/VideoInput'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>Video upload</h1>
      <VideoInput width={400} height={300} />
    </div>
  )
}

export default App
