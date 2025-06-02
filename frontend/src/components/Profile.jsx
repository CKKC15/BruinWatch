import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
//import { FaEdit } from 'react-icons/fa';

const Profile = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleInputChange = (e) => {
    setUser({
      ...user, [e.target.name]: e.target.value,
    });
  };

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userID = storedUser?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`/api/users/${userID}`, {
        method: "PUT",
        headers: {
          "Content-type": "application/json"
        },
        body: JSON.stringify(user),
      });

      if (res.ok) {
        alert("Profile successfully changed!");
      }
      else {
        alert("Something went wrong");
      }
    } catch (err) {
      alert("Connection error");
    }
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
        <form className="profile-form" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              type="text"
              name="name"
              placeholder="Ucla Student"
              value={user.name}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              placeholder="student@ucla.edu"
              value={user.email}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              placeholder="passwordis1234"
              value={user.password}
              onChange={handleInputChange}
            />
          </label>
          <button type="submit">Save</button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
