import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import TopBar from './components/TopBar';
import VideoInput from './components/VideoInput';
import VideoPlayer from './components/VideoPlayer';
import AddVideo from './components/AddVideo';
import LandingPage from './components/LandingPage';
import Profile from './components/Profile';
import Info from './components/Info';
import ClassPage from './components/ClassPage';
import './App.css';

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  // Simple auth check
  const isAuthenticated = () => !!localStorage.getItem('token');

  // Protected route wrapper
  const RequireAuth = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" replace />;
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <RequireAuth>
              <Navbar />
              <TopBar />
              <main>
                <Dashboard />
              </main>
            </RequireAuth>
          } />
          
          <Route path="/add-video" element={
            <RequireAuth>
              <Navbar />
              <TopBar />
              <main>
                <AddVideo />
              </main>
            </RequireAuth>
          } />
          
          <Route path="/videoplayer/:videoId?" element={
            <RequireAuth>
              <Navbar />
              <TopBar />
              <main>
                <VideoPlayer />
              </main>
            </RequireAuth>
          } />
          
          <Route path="/videoinput" element={
            <RequireAuth>
              <Navbar />
              <TopBar />
              <main>
                <VideoInput />
              </main>
            </RequireAuth>
          } />
          
          <Route path="/profile" element={
            <RequireAuth>
              <Navbar />
              <TopBar />
              <main>
                <Profile />
              </main>
            </RequireAuth>
          } />

          <Route path="/info" element={
            <RequireAuth>
              <Navbar />
              <TopBar />
              <main>
                <Info />
              </main>
            </RequireAuth>
          } />

          <Route path="/class/:classId" element={
            <RequireAuth>
              <Navbar />
              <TopBar />
              <main>
                <ClassPage />
              </main>
            </RequireAuth>
          } />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;