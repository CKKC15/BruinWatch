import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaPlus, FaUser } from 'react-icons/fa';
import { BsMoonFill, BsSunFill } from 'react-icons/bs';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <nav className="navbar">
      <ul className="nav-icons">
        <li>
          <NavLink to="/add-video" className={({ isActive }) => isActive ? 'active' : ''}>
            <FaPlus className="nav-icon" />
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            <FaHome className="nav-icon" />
          </NavLink>
        </li>
        <li>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>
            <FaUser className="nav-icon" />
          </NavLink>
        </li>
      </ul>
      <div className="theme-toggle-container">
        <button
          onClick={toggleDarkMode}
          className="theme-toggle"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? (
            <BsSunFill className="nav-icon sun-icon" />
          ) : (
            <BsMoonFill className="nav-icon moon-icon" />
          )}
        </button>
      </div>
    </nav>
  );
};

export default Navbar; 