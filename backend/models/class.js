import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema({
  // Basic class information
  name: { type: String, required: true },
  courseCode: { type: String }, // e.g., "CS 31"
  units: { type: Number },
  term: { type: String },
  color: { type: String },

  // Course details
  description: { type: String },
  prerequisites: [{ type: String }], // Array of prerequisite course codes
  corequisites: [{ type: String }], // Array of corequisite course codes

  // Professor information
  professor: { type: String },
  professorEmail: { type: String },
  professorRating: { type: Number }, // Overall rating from RMP or similar
  professorDifficulty: { type: Number },
  professorWouldTakeAgain: { type: Number }, // Percentage

  // Schedule information
  schedule: [{
    days: [{ type: String }], // ['M', 'W', 'F']
    startTime: { type: String }, // "10:00 AM"
    endTime: { type: String },   // "11:50 AM"
    location: { type: String },  // "BOELTER 5419"
    type: { type: String }       // "Lecture", "Discussion", "Lab"
  }],

  // Enrollment data
  totalSeats: { type: Number },
  availableSeats: { type: Number },
  waitlistTotal: { type: Number },

  // UCLA specific
  classNumber: { type: String }, // UCLA's unique class identifier
  department: { type: String },  // "Computer Science"

  // Scraped data metadata
  lastScraped: { type: Date },
  scrapedFrom: [{ type: String }], // Sources: "registrar", "ratemyprofessor", etc.

  // Existing field
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }]
}, { timestamps: true });

// Index for efficient searching
ClassSchema.index({ courseCode: 1, term: 1 });
ClassSchema.index({ professor: 1 });
ClassSchema.index({ department: 1 });

export default mongoose.model('Class', ClassSchema);