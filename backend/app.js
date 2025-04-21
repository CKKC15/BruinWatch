import express from 'express';
import connectDB from './db/mongo.js';
import userRoute from './routes/userRoute.js';
import videoRoute from './routes/videoRoute.js';

const app = express();
const port = 5000;

// middleware
app.use(express.json());

// basic root route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// routes
app.use('/users', userRoute);
app.use('/videos', videoRoute);

// start server and connect to db
app.listen(port, async () => {
  try {
    await connectDB();
    console.log(`Server is running on port ${port}`);
  } catch (err) {
    console.error('Database connection failed', err);
    process.exit(1);
  }
});