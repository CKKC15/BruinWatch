import Video from '../models/video.js';

// Pure video CRUD operations (service layer)
export const createVideoRecord = async ({ title, link, transcript, embeddings, userId, className, date }) => {
  return await Video.create({ title, link, transcript, embeddings, user: userId, className, date });
};

export const fetchAllVideos = async (userId) => {
  return await Video.find({ user: userId });
};

export const fetchVideoById = async (userId, videoId) => {
  return await Video.findOne({ _id: videoId, user: userId });
};

export const updateVideoRecord = async (userId, videoId, updatedData) => {
  return await Video.findOneAndUpdate(
    { _id: videoId, user: userId },
    updatedData,
    { new: true }
  );
};

export const deleteVideoRecord = async (userId, videoId) => {
  return await Video.findOneAndDelete({ _id: videoId, user: userId });
};