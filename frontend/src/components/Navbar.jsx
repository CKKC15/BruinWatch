import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa';
import { FaInfoCircle } from 'react-icons/fa';
import { FaUser } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
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
          <NavLink to="/info" className={({ isActive }) => isActive ? 'active' : ''}>
            <FaInfoCircle className="nav-icon" />
          </NavLink>
        </li>
        <li>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>
            <FaUser className="nav-icon" />
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar; 