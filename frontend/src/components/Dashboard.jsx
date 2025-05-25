import React, { useState, useEffect } from 'react';
import { FaRegStar } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [cards, setCards] = useState([
    { id: 1, title: 'MATH 32B: Multivariable Calculus', color: '#a6e7ff'},
    { id: 2, title: 'CS 31: Intro to C++', color: '#ffb9b9'},
    { id: 3, title: 'MATH 33A: Linear Algebra', color: '#ffe2a6'},
    { id: 4, title: 'DESMA 21: Drawing & Color', color: '#b9ffd9'},
    { id: 5, title: 'MATH 32B Lecture 15', color: '#d4e7c5' },
    { id: 6, title: 'CS 31 Lecture 17', color: '#7c99b4' },
    { id: 7, title: 'MATH 33A Lecture 10', color: '#f2e38b' },
    { id: 8, title: 'DESMA 21 Lecture 16', color: '#e36d2f' },
  ]);

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
  }, [reloadFlag]); // 👈 rerun effect whenever reloadFlag changes
  

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
  

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>
      <div className="dashboard-grid">
        {cards.map(card => (
          <div key={card.id} className="dashboard-card" style={{ backgroundColor: card.color }}>
            <div className="card-buttons">
              {<FaRegStar size={20} />}
              <BsThreeDotsVertical size={20} />
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
