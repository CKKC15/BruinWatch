// user controller

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/user.js';
import Class from '../models/class.js';
import Video from '../models/video.js';
import { verifyGoogleToken, findOrCreateGoogleUser } from '../service/googleAuth.js';
import { createVideoRecord, fetchAllVideos, fetchVideoById, updateVideoRecord, deleteVideoRecord } from './videoController.js';
import { uploadFileToS3 } from '../service/awsUpload.js';
import { createClassRecord, fetchAllClasses, fetchClassById, updateClassRecord, deleteClassRecord, fetchAllClassesNames, fetchAllVideosFromClass } from './classController.js';
import {transcribeMedia} from '../service/transcript.js';
import {createEmbeddings} from '../service/embedding.js';

// register and login user
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
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
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
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

// get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// verify Google token and authenticate user
export const verifyGoogle = async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ message: 'Google token is required' });
    }
    
    // Verify the Google token
    const payload = await verifyGoogleToken(credential);
    
    // Find or create user based on Google profile
    const user = await findOrCreateGoogleUser(payload);
    
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    // Return user info and token
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture || payload.picture
      }
    });
  } catch (err) {
    console.error('Google verification error:', err);
    res.status(401).json({ message: 'Invalid Google token' });
  }
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

// create a new video and link to user and class
export const createVideo = async (req, res) => {
  try {
    const { title, className, date } = req.body;
    const { id: userId } = req.params;
    
    if (!title || !req.file) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // 1. Find the class by name
    const classRecord = await Class.findOne({ name: className });
    if (!classRecord) {
      return res.status(404).json({ message: 'Class not found ' + className });
    }

    // 2. Upload video to S3
    const s3Url = await uploadFileToS3(req.file, 'videos');
    
    // 3. Transcribe the video
    const transcript = await transcribeMedia(req.file.buffer);
    
    // 4. Generate embeddings
    const embeddings = await createEmbeddings(transcript.segments);
    
    // 5. Create video record with transcript
    const video = await createVideoRecord({ 
      title, 
      link: s3Url, 
      transcript,
      embeddings,
      userId, 
      className,
      date 
    });

    // 6. Link video to user
    await User.findByIdAndUpdate(userId, { 
      $push: { videos: video._id } 
    });

    // 7. Link video to class
    await Class.findByIdAndUpdate(classRecord._id, {
      $push: { videos: video._id }
    });

    res.status(201).json(video);
  } catch (err) {
    console.error('Error in createVideo:', err);
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

// fetch all classes for a user
export const getAllClasses = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const classes = await fetchAllClasses(user.classes);
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// create a new class and link to user
export const createClass = async (req, res) => {
  try {
    const { name, professor, term, color } = req.body;
    const { id: userId } = req.params;
    if (!name) return res.status(400).json({ message: 'Missing fields' });
    const newClass = await createClassRecord({ name, professor, term, color });
    await User.findByIdAndUpdate(userId, { $push: { classes: newClass._id } });
    res.status(201).json(newClass);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// fetch a single class
export const getClassById = async (req, res) => {
  try {
    const { id: userId, classId } = req.params;
    const classObj = await fetchClassById(classId);
    if (!classObj) return res.status(404).json({ message: 'Class not found' });
    res.json(classObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// update class
export const updateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const updatedData = req.body;
    const classObj = await updateClassRecord(classId, updatedData);
    if (!classObj) return res.status(404).json({ message: 'Class not found' });
    res.json(classObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { id: userId, classId } = req.params;

    // First, get the class so we can access its name
    const classObj = await deleteClassRecord(classId);
    if (!classObj) return res.status(404).json({ message: 'Class not found' });

    // Find all videos by user for this class name
    const videos = await Video.find({
      className: classObj.name,
      user: userId
    });

    // Delete all matching videos
    for (const video of videos) {
      await Video.findByIdAndDelete(video._id);
      await User.findByIdAndUpdate(userId, {
        $pull: { videos: video._id }
      });
    }

    // Unlink the class from the user
    await User.findByIdAndUpdate(userId, {
      $pull: { classes: classObj._id }
    });

    res.json({ message: 'Class and related videos deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// fetch all class names for a user
export const getAllClassNames = async (req, res) => {
  try {
    const classNames = await fetchAllClassesNames();
    res.json(classNames);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// fetch all videos for a class
export const getAllVideosForClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const videos = await fetchAllVideosFromClass(classId);
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


