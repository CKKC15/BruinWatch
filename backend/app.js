import express from 'express';
import connectDB from './db/mongo.js';

const app = express();
const port = 5000;

// middleware
app.use(express.json());

// connect to MongoDB
// connect via imported connectDB

// basic root route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// start server
app.listen(port, async () => {
  try {
    await connectDB();
    console.log(`Server is running on port ${port}`);
  } catch (err) {
    console.error('Database connection failed', err);
    process.exit(1);
  }
});