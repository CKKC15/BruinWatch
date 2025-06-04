// video model

import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: { type: String },
  link: { type: String },
  transcript: { type: JSON },
  embeddings: [{ start: { type: Number }, end: { type: Number }, text: { type: String }, embedding: { type: [Number] } }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  className: { type: String },
  date: { type: Date, default: Date.now },
  isYoutubeVideo: { type: Boolean, default: false },
  originalYoutubeUrl: { type: String }
}, { timestamps: true });

export default mongoose.model('Video', videoSchema);