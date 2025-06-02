import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import { FaEdit } from 'react-icons/fa';

const Profile = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Profile updated with:', { fullName, email, password });
    alert('Profile saved!');
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="page-title">Edit Profile</h1>
        <div className="avatar-container">
          <img
            src="https://cdn-icons-png.flaticon.com/512/9131/9131529.png"
            alt="Avatar"
            className="avatar"
          />
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              type="text"
              placeholder="Ucla Student"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              placeholder="student@ucla.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              placeholder="passwordis1234"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit">Save</button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
