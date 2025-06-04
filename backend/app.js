import express from 'express';
import connectDB from './db/mongo.js';
import userRoute from './routes/userRoute.js';
import chatbotRoute from './routes/chatbotRoute.js';
import webscrapingRoute from './routes/webscraping.js';
import passport from 'passport';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const port = 3000; // single port for both HTTP + WebSocket

// middleware
app.use(express.json());
app.use(passport.initialize());
app.use(cors({ origin: true, credentials: true }));

// routes
app.get('/', (req, res) => res.send('Hello World!'));
app.use('/users', userRoute);
app.use('/chat', chatbotRoute);
app.use('/webscraping', webscrapingRoute);

// Create server with HTTP + WebSocket support
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// WebSocket logic
const activeRooms = new Map(); // Store room codes and info

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create a new room
  socket.on('create-room', (callback) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomId = `room_${roomCode}`;

    activeRooms.set(roomCode, {
      id: roomId,
      creator: socket.id,
      created: new Date(),
      members: []
    });

    socket.join(roomId);
    activeRooms.get(roomCode).members.push(socket.id);

    console.log(`Room created: ${roomCode} by ${socket.id}`);
    callback({ success: true, roomCode, roomId });
  });

  // Join existing room
  socket.on('join-room', (roomCode, userData, callback) => {
    if (activeRooms.has(roomCode)) {
      const room = activeRooms.get(roomCode);
      socket.join(room.id);
      room.members.push(socket.id);

      socket.to(room.id).emit('user-joined', {
        message: `${userData.username} joined the room`,
        sender: userData.username,
        profilePictureIndex: userData.profilePictureIndex,
        timestamp: Date.now(),
        isSystem: true
      });
      console.log(`Socket ${socket.id} joined room ${roomCode}`);
      callback({ success: true, roomId: room.id });
    } else {
      callback({ success: false, error: 'Room not found' });
    }
  });

  socket.on('send-message', ({ room, message, sender, profilePictureIndex }) => {
    console.log(`Message from ${sender} in room ${room}: ${message}`);
    socket.to(room).emit('receive-message', {
      message,
      sender,
      timestamp: Date.now(),
      profilePictureIndex
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove user from all rooms
    activeRooms.forEach((room, code) => {
      const index = room.members.indexOf(socket.id);
      if (index > -1) {
        room.members.splice(index, 1);
        if (room.members.length === 0) {
          activeRooms.delete(code);
        }
      }
    });
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
