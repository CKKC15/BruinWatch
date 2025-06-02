import React, { useState, useEffect, useRef } from 'react';
import { FaRegStar} from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import axios from 'axios';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [cards, setCards] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    professor: '',
    term: ''
  });

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
  

  const fetchAllClasses = async () => {
    try {
      const res = await axios.get(`${backendUrl}/users/${userId}/get_classes?all=true`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAvailableClasses(res.data);
    } catch (err) {
      console.error('Error fetching available classes:', err);
    }
  };

  const handleOpenModal = () => {
    setShowForm(true);
    fetchAllClasses(); // Fetch classes when modal opens
  };

  const handleClassSelect = (classId) => {
    const selected = availableClasses.find(cls => cls._id === classId);
    setSelectedClass(selected);
    if (selected) {
      setFormData({
        name: selected.name,
        professor: selected.professor,
        term: selected.term
      });
    }
  };

  const handleJoin = async () => {
    if (!selectedClass) {
      alert('Please select a class to join');
      return;
    }

    try {
      const res = await axios.post(`${backendUrl}/users/${userId}/join/${selectedClass._id}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Trigger refetch of user's classes
      setReloadFlag(prev => !prev);
      setFormData({ name: '', professor: '', term: '' });
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
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdownId(openDropdownId === card.id ? null : card.id);
            }}
            style={{ position: 'relative', cursor: 'pointer' }}
          >
            <BsThreeDotsVertical size={20} />

            {openDropdownId === card.id && (
              <div
                ref={dropdownRef}
                className="card-dropdown"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '24px',
                  right: '0',
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  zIndex: 10,
                  boxShadow: '0px 2px 6px rgba(0,0,0,0.1)'
                }}
              >
                <div
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this class?')) {
                      handleDelete(card.id);
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
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
              value={selectedClass?._id || ''}
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
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>

            {selectedClass && (
              <>
                <label>Professor</label>
                <input
                  type="text"
                  value={formData.professor}
                  readOnly
                  style={{
                    backgroundColor: '#f5f5f5',
                    cursor: 'not-allowed'
                  }}
                />
                
                <label>Term</label>
                <input
                  type="text"
                  value={formData.term}
                  readOnly
                  style={{
                    backgroundColor: '#f5f5f5',
                    cursor: 'not-allowed'
                  }}
                />
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
