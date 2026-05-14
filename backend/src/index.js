// src/index.js - Transportes Génesis Backend Entry Point
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');

const { initializeSocket } = require('./sockets/socketService');
const { startGPSSimulator } = require('./services/gpsSimulator');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const parentRoutes = require('./routes/parents');
const studentRoutes = require('./routes/students');
const driverRoutes = require('./routes/drivers');
const busRoutes = require('./routes/buses');
const routeRoutes = require('./routes/routes');
const paymentRoutes = require('./routes/payments');
const attendanceRoutes = require('./routes/attendance');
const gpsRoutes = require('./routes/gps');
const reportRoutes = require('./routes/reports');

const app = express();
const server = http.createServer(app);

// =====================
// MIDDLEWARE
// =====================
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// =====================
// ROUTES
// =====================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/gps', gpsRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Transportes Génesis API',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// =====================
// SOCKET.IO
// =====================
const io = initializeSocket(server);

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`✅ Transportes Génesis API running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start GPS simulation after server is ready
  setTimeout(() => {
    startGPSSimulator(io);
    console.log('🛰️  GPS Simulator started');
  }, 2000);
});

module.exports = { app, server, io };
