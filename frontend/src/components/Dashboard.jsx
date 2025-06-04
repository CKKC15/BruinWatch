import React, { useState, useEffect, useRef } from 'react';
import { FaRegStar } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import axios from 'axios';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [cards, setCards] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    professor: '',
    term: '',
    color: '#FF6B6B'
  });

  // Hardcoded classes
  const availableClasses = [
    {
      id: 'cs31',
      code: 'CS31',
      name: 'Introduction to Computer Science I',
      professors: ['Carey Nachenberg', 'David Smallberg']
    },
    {
      id: 'cs32',
      code: 'CS32',
      name: 'Introduction to Computer Science II',
      professors: ['Carey Nachenberg', 'David Smallberg']
    },
    {
      id: 'math31a',
      code: 'Math31A',
      name: 'Differential & Integral Calculus',
      professors: ['Steve Butler']
    }
  ];

  const termOptions = ['fall', 'winter', 'spring', 'summer'];

  // Preset color options
  const colorOptions = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#FF8A80', '#8BC34A', '#FFB74D', '#CE93D8'
  ];

  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const userId = user.id;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [reloadFlag, setReloadFlag] = useState(false);
  const navigate = useNavigate();
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${backendUrl}/users/${userId}/get_classes`, {
          headers: {
            Authorization: `Bearer ${token}` // replace with your actual token
          }
        });
        const classCards = res.data.map(cls => ({
          id: cls._id,
          name: cls.name,
          color: cls.color,
          professor: cls.professor
        }));
        setCards(classCards);
      } catch (err) {
        console.error('Error fetching classes:', err);
      }
    };

    fetchClasses();
  }, [reloadFlag]); // rerun effect whenever reloadFlag changes

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOpenModal = () => {
    setShowForm(true);
  };

  const handleClassSelect = (classId) => {
    const selected = availableClasses.find(cls => cls.id === classId);
    setSelectedClass(selected);
    if (selected) {
      setFormData({
        code: selected.code,
        name: selected.name,
        professor: '',
        term: '',
        color: selected.color || '#FF6B6B'
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleJoin = async () => {
    if (!selectedClass || !formData.professor || !formData.term) {
      alert('Please fill in all fields');
      return;
    }

    try {
      // Create a class object with the selected information
      const classData = {
        code: selectedClass.code,
        name: selectedClass.name,
        professor: formData.professor,
        term: formData.term,
        color: formData.color
      };

      const res = await axios.post(`${backendUrl}/users/${userId}/join_class`, classData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Trigger refetch of user's classes
      setReloadFlag(prev => !prev);
      setFormData({ code: '', name: '', professor: '', term: '', color: '#FF6B6B' });
      setSelectedClass(null);
      setShowForm(false);
    } catch (err) {
      console.error('Error joining class:', err.response?.data || err.message);
      alert('Failed to join class. Please try again.');
    }
  };

  const handleDelete = async (classId) => {
    try {
      await axios.delete(
        `${backendUrl}/users/${userId}/delete_class/${classId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      // Trigger refetch
      setReloadFlag(prev => !prev);
      console.log("class delete and video delete successful")
    } catch (err) {
      console.error('Error deleting class:', err.response?.data || err.message);
      alert('Unable to delete class. Please try again.');
    }
  };


  const handleClassClick = (card) => {
    navigate(`/class/${card.id}`);
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>
      <div className="dashboard-grid">
        {cards.map(card => (
          <div
            key={card.id}
            className="dashboard-card"
            style={{ backgroundColor: card.color }}
            onClick={() => handleClassClick(card)}
          >
            <div className="card-buttons">
              <FaRegStar size={20} />

              <div
                className="three-dots-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdownId(openDropdownId === card.id ? null : card.id);
                }}
              >
                <BsThreeDotsVertical size={20} />

                {openDropdownId === card.id && (
                  <div
                    ref={dropdownRef}
                    className="card-dropdown"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className="delete-button"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this class?')) {
                          handleDelete(card.id);
                        }
                      }}
                    >
                      Delete
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card-label">
              <p>{card.name}</p>
            </div>
          </div>
        ))}

        <div className="dashboard-card add-card" onClick={handleOpenModal}>
          <p>+ Join Class</p>
        </div>
      </div>
      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>Join a Class</h2>

            <label>Select Class</label>
            <select
              value={selectedClass?.id || ''}
              onChange={(e) => handleClassSelect(e.target.value)}
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                fontSize: '14px'
              }}
            >
              <option value="">Choose a class...</option>
              {availableClasses.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.code}: {cls.name}
                </option>
              ))}
            </select>

            {selectedClass && (
              <>
                <label>Professor</label>
                <select
                  value={formData.professor}
                  onChange={(e) => handleInputChange('professor', e.target.value)}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Choose a professor...</option>
                  {selectedClass.professors.map(prof => (
                    <option key={prof} value={prof}>
                      {prof}
                    </option>
                  ))}
                </select>

                <label>Term</label>
                <select
                  value={formData.term}
                  onChange={(e) => handleInputChange('term', e.target.value)}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Choose a term...</option>
                  {termOptions.map(term => (
                    <option key={term} value={term}>
                      {term.charAt(0).toUpperCase() + term.slice(1)}
                    </option>
                  ))}
                </select>

                <label>Color</label>
                <div className="color-picker-grid">
                  {colorOptions.map(color => (
                    <div
                      key={color}
                      className={`color-option ${formData.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleInputChange('color', color)}
                      title={color}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="modal-buttons">
              <button className="cancel-button" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="join-button" onClick={handleJoin}>Join</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
