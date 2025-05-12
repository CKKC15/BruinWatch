// video model
// add more later if theres more stuff

import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: { type: String },
  link: { type: String },
  transcript: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  className: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Video', videoSchema);