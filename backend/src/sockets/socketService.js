// src/sockets/socketService.js - Socket.io initialization and event handling
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware for sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`📡 Client connected: ${socket.id} (user: ${socket.userId})`);

    // Join room based on role
    if (socket.userRole === 'ADMIN') {
      socket.join('admin');
    }
    socket.join('tracking');

    socket.on('subscribe:bus', (busId) => {
      socket.join(`bus:${busId}`);
    });

    socket.on('unsubscribe:bus', (busId) => {
      socket.leave(`bus:${busId}`);
    });

    socket.on('disconnect', () => {
      console.log(`📡 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initializeSocket, getIO };
