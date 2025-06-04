import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './TopBar.css';
import logo from "/bruinwatch_logo.gif";

// Preset profile pictures
const profilePictures = [
  '/profile-pics/avatar1.png',
  '/profile-pics/avatar2.png',
  '/profile-pics/avatar3.png',
  '/profile-pics/avatar4.png',
  '/profile-pics/avatar5.png',
  '/profile-pics/avatar6.png',
];

const getProfilePicturePath = (index) => {
  if (index >= 1 && index <= profilePictures.length) {
    return profilePictures[index - 1];
  }
  return '/pfp.png'; // default picture
};

const TopBar = () => {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user from localStorage and update on storage changes
    const updateUserFromStorage = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    };

    updateUserFromStorage(); // Initial load
    window.addEventListener('storage', updateUserFromStorage);

    return () => {
      window.removeEventListener('storage', updateUserFromStorage);
    };
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside of it
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login page
        navigate('/');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div className="topbar">
      <div className="topbar-content">
        <div className="topbar-logo-container">
          <div className="topbar-logo">
            <img src={logo} alt="BruinWatch Logo" className="topbar-logo" />
          </div>
          <h1 className="topbar-title">BruinWatch</h1>
        </div>

        {user && (
          <div className="user-profile" ref={dropdownRef}>
            <div className="user-info" onClick={toggleDropdown}>
              <span className="user-greeting">Hi, {user.name}</span>
              <img
                src={getProfilePicturePath(user.profilePictureIndex)}
                alt="Profile"
                className="profile-picture"
              />
            </div>

            {dropdownOpen && (
              <div className="dropdown-menu">
                <button onClick={handleLogout} className="dropdown-item">
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar; 