// user controller

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import {
  createVideoRecord,
  fetchAllVideos,
  fetchVideoById,
  updateVideoRecord,
  deleteVideoRecord
} from './videoController.js';

// register and login user
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email }, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ user: { id: user._id, name: user.name, email: user.email }, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// logout user
export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};

// update user info (by ID)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (password) updates.password = await bcrypt.hash(password, 12);
    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// fetch all videos
export const getAllVideos = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const videos = await fetchAllVideos(userId);
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// create a new video and link to user
export const createVideo = async (req, res) => {
  try {
    const { title, link, transcript } = req.body;
    const { id: userId } = req.params;
    if (!title || !link) return res.status(400).json({ message: 'Missing fields' });
    const video = await createVideoRecord({ title, link, transcript, userId });
    await User.findByIdAndUpdate(userId, { $push: { videos: video._id } });
    res.status(201).json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// fetch single video
export const getVideoById = async (req, res) => {
  try {
    const { id: userId, videoId } = req.params;
    const video = await fetchVideoById(userId, videoId);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// update video
export const updateVideo = async (req, res) => {
  try {
    const { id: userId, videoId } = req.params;
    const updatedData = req.body;
    const video = await updateVideoRecord(userId, videoId, updatedData);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// delete video and unlink from user
export const deleteVideo = async (req, res) => {
  try {
    const { id: userId, videoId } = req.params;
    const video = await deleteVideoRecord(userId, videoId);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    await User.findByIdAndUpdate(userId, { $pull: { videos: videoId } });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
