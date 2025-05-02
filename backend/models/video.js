// video model
// add more later if theres more stuff

import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: { type: String},
  link: { type: String},
  transcript: { type: String },
}, { timestamps: true });

export default mongoose.model('Video', videoSchema);