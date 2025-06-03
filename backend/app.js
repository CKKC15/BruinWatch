import express from 'express';
import connectDB from './db/mongo.js';
import userRoute from './routes/userRoute.js';
import chatbotRoute from './routes/chatbotRoute.js';
import passport from 'passport';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const port = 5000; // single port for both HTTP + WebSocket

// middleware
app.use(express.json());
app.use(passport.initialize());
app.use(cors({
  origin: true,
  credentials: true
}));

// routes
app.get('/', (req, res) => res.send('Hello World!'));
app.use('/users', userRoute);
app.use('/chat', chatbotRoute);

// Create server with HTTP + WebSocket support
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// WebSocket logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  socket.on('send-message', ({ room, message, sender }) => {
    console.log(`Message from ${sender} in room ${room}: ${message}`);
    io.to(room).emit('receive-message', { message, sender });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start both HTTP and WebSocket servers
server.listen(port, async () => {
  try {
    await connectDB();
    console.log(`Server with WebSocket is running on port ${port}`);
  } catch (err) {
    console.error('Database connection failed', err);
    process.exit(1);
  }
});
