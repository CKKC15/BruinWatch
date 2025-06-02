import mongoose from 'mongoose';
import Class from '../models/class.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test class data
const testClasses = [
  {
    name: 'COM SCI 31 - Introduction to Computer Science',
    professor: 'David Smallberg',
    term: 'Spring 2025',
    color: '#3498db',
    videos: []
  },
  {
    name: 'COM SCI 32 - Data Structures',
    professor: 'Carey Nachenberg',
    term: 'Spring 2025',
    color: '#e74c3c',
    videos: []
  },
  {
    name: 'COM SCI 33 - Software Organization',
    professor: 'Sandra Batista',
    term: 'Spring 2025',
    color: '#2ecc71',
    videos: []
  },
  {
    name: 'COM SCI 35L - Software Construction',
    professor: 'Paul Eggert',
    term: 'Spring 2025',
    color: '#f39c12',
    videos: []
  },
  {
    name: 'COM SCI 180 - Algorithms',
    professor: 'Sandra Batista',
    term: 'Spring 2025',
    color: '#9b59b6',
    videos: []
  },
  {
    name: 'COM SCI 111 - Operating Systems',
    professor: 'Peter Reiher',
    term: 'Spring 2025',
    color: '#1abc9c',
    videos: []
  }
];

// Create test classes
const createTestClasses = async () => {
  try {
    console.log('Creating test classes...');
    
    // Clear existing test classes (optional)
    await Class.deleteMany({ 
      name: { 
        $in: testClasses.map(cls => cls.name) 
      } 
    });
    console.log('Cleared existing test classes');

    // Insert new test classes
    const createdClasses = await Class.insertMany(testClasses);
    
    console.log(`Successfully created ${createdClasses.length} test classes:`);
    createdClasses.forEach((cls, index) => {
      console.log(`${index + 1}. ${cls.name} - ${cls.professor} (${cls.term})`);
    });
    
    return createdClasses;
  } catch (error) {
    console.error('Error creating test classes:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await createTestClasses();
    console.log('\nTest classes created successfully!');
  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run the script
main();
