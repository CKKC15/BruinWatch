import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema({
  name: { type: String },
  professor: { type: String },
  term: { type: String },
  color: { type: String },
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }]
}, { timestamps: true });

export default mongoose.model('Class', ClassSchema);