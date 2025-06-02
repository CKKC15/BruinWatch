import React, { useState, useEffect, useRef } from 'react';
import { FaRegStar} from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import axios from 'axios';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [cards, setCards] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    professor: '',
    term: '',
    color: '#cccccc'
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
  

  const handleCreate = async () => {
    try {
      const res = await axios.post(`${backendUrl}/users/${userId}/create_class`, {
        name: formData.name,
        professor: formData.professor,
        term: formData.term,
        color: formData.color
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  
      // Instead of manually adding to cards, trigger refetch
      setReloadFlag(prev => !prev);
      setFormData({ name: '', professor: '', term: '', color: '#cccccc' });
      setShowForm(false);
    } catch (err) {
      console.error('Error creating class:', err.response?.data || err.message);
      alert('Failed to create class. Please try again.');
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

        <div className="dashboard-card add-card" onClick={() => setShowForm(true)}>
          <p>+ Add Class</p>
        </div>
      </div>
      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add a Class</h2>
            <input
              type="text"
              placeholder="Class Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Professor"
              value={formData.professor}
              onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
            />
            <input
              type="text"
              placeholder="Term (e.g. Fall 2025)"
              value={formData.term}
              onChange={(e) => setFormData({ ...formData, term: e.target.value })}
            />
            <label>Color</label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
            <div className="modal-buttons">
              <button onClick={handleCreate}>Create</button>
              <button onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
