// src/services/socket.js - Socket.io client
import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = () => {
  const token = localStorage.getItem('genesis_token');
  if (!token) return null;

  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  socket.on('connect', () => console.log('🔌 Socket connected'));
  socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
