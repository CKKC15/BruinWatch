import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import TopBar from './components/TopBar';
import './App.css';

function App() {
  // Dummy Google Client ID for development
  const googleClientId = "123456789-abcdef.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <>
                <Navbar />
                <TopBar />
                <main>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/add-video" element={<div>Add Video Page</div>} />
                    <Route path="/info" element={<div>Info Page</div>} />
                    <Route path="/profile" element={<div>Profile Page</div>} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </main>
              </>
            }
          />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
