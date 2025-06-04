import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

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

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: '',
    profilePictureIndex: 1
  });
  const [showPictureSelector, setShowPictureSelector] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/users/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const userData = response.data;
        setUser(userData);
        setEditedUser({
          name: userData.name,
          profilePictureIndex: userData.profilePictureIndex || 1
        });

        // Update localStorage with fresh data from server
        const userForStorage = {
          id: userData._id,
          name: userData.name,
          email: userData.email,
          profilePictureIndex: userData.profilePictureIndex || 1,
          profilePicture: getProfilePicturePath(userData.profilePictureIndex || 1)
        };
        localStorage.setItem('user', JSON.stringify(userForStorage));

        fetchUserClasses(userData._id);
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Failed to load user data');
      }
    };

    fetchCurrentUser();
  }, []);

  const fetchUserClasses = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/users/${userId}/get_classes`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleEdit = () => {
    setError('');
    setSuccess('');
    setIsEditing(true);
    setEditedUser({
      name: user.name,
      profilePictureIndex: user.profilePictureIndex || 1
    });
  };

  const handleSave = async () => {
    try {
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/users/${user._id}`,
        {
          name: editedUser.name,
          profilePictureIndex: editedUser.profilePictureIndex
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        // Update both user state and localStorage with the new data
        const updatedUser = {
          ...user,
          name: editedUser.name,
          profilePictureIndex: editedUser.profilePictureIndex,
          profilePicture: getProfilePicturePath(editedUser.profilePictureIndex)
        };

        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSuccess('Profile updated successfully!');

        // Force a re-render of the TopBar by updating localStorage
        const event = new Event('storage');
        window.dispatchEvent(event);

        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setError('');
    setSuccess('');
    setEditedUser({
      name: user.name,
      profilePictureIndex: user.profilePictureIndex || 1
    });
    setIsEditing(false);
    setShowPictureSelector(false);
  };

  const handlePictureSelect = (index) => {
    setEditedUser({ ...editedUser, profilePictureIndex: index });
    setShowPictureSelector(false);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        <div className="profile-header">
          <h1 className="profile-title">Profile</h1>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="profile-main">
          <div className="profile-picture-section">
            <div className="profile-picture-container">
              <img
                src={getProfilePicturePath(editedUser.profilePictureIndex)}
                alt="Profile"
                className="profile-picture-large"
              />
              {isEditing && (
                <button
                  className="change-picture-button"
                  onClick={() => setShowPictureSelector(!showPictureSelector)}
                >
                  Change Picture
                </button>
              )}
            </div>

            {showPictureSelector && (
              <div className="picture-selector">
                {profilePictures.map((pic, index) => (
                  <img
                    key={index}
                    src={pic}
                    alt={`Avatar ${index + 1}`}
                    onClick={() => handlePictureSelect(index + 1)}
                    className={`picture-option ${editedUser.profilePictureIndex === index + 1 ? 'selected' : ''}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="profile-info">
            <div className="info-group">
              <label><strong>Name</strong></label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedUser.name}
                  onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                  className="edit-input"
                />
              ) : (
                <p>{user.name}</p>
              )}
            </div>
            <div className="info-group">
              <label><strong>Email</strong></label>
              <p>{user.email}</p>
            </div>
            {!isEditing ? (
              <button className="edit-button" onClick={handleEdit}>
                Edit Profile
              </button>
            ) : (
              <div className="button-group">
                <button className="save-button" onClick={handleSave}>
                  Save Changes
                </button>
                <button className="cancel-button" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="profile-classes">
            <h2>My Classes</h2>
            {classes.length > 0 ? (
              <div className="classes-grid">
                {classes.map((cls) => (
                  <div key={cls._id} className="class-card">
                    <h3>{cls.name}</h3>
                    <p>Professor: {cls.professor}</p>
                    <p>Term: {cls.term}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-classes">No classes joined yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
