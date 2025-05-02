// video controller

import Video from '../models/video.js';

// create a new video
export const createVideo = async (req, res) => {
  try {
    const { title, link, transcript } = req.body;
    if (!title || !link) return res.status(400).json({ message: 'Missing fields' });
    const video = await Video.create({ title, link, transcript });
    res.status(201).json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// fetch single video by ID
export const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// update video by ID
export const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = req.body;
    const video = await Video.findByIdAndUpdate(id, updated, { new: true });
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// delete video by ID
export const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findByIdAndDelete(id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};