import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import connectDB from './db/mongo.js';
import userRoute from './routes/userRoute.js';
import videoRoute from './routes/videoRoute.js';

const app = express();
const port = 5001;

// Middleware
app.use(cors({
  origin: "http://localhost:5001",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Basic root route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Routes
app.use('/users', userRoute);
app.use('/videos', videoRoute);

// Create HTTP server using Express app
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });

  socket.on("send-message", (data) => {
    socket.broadcast.emit("receive_message", data)
  });
});

// Connect to DB and start the server
const startServer = async () => {
  try {
    await connectDB();
    console.log('Database connected successfully');

    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
    
  } catch (err) {
    console.error('Database connection failed', err);
    process.exit(1);
  }
};

startServer();