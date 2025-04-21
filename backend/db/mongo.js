import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config(); 

const uri = process.env.MONGODB_URI;


if (!uri) {
  throw new Error('Missing API Key: "MONGODB_URI"');
}

const db = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection.asPromise();
    }
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

export default db;