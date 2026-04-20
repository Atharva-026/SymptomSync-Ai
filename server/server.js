require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { initializeSocket } = require('./socket/socketHandler');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const assessmentRoutes = require('./routes/assessments');
const medicalRecordRoutes = require('./routes/medicalRecords');
const familyAccessRoutes = require('./routes/familyAccess'); // Family Access Routes
const providerRoutes = require('./routes/providers');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/providers', providerRoutes);

// Serve static files (uploaded files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Medical records routes
app.use('/api/medical-records', medicalRecordRoutes);

// Family access routes
app.use('/api/family-access', familyAccessRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running 🚀',
    timestamp: new Date(),
    routes: [
      '/api/auth',
      '/api/doctors',
      '/api/appointments',
      '/api/assessments',
      '/api/medical-records',
      '/api/family-access'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🏥 SymptomSync AI Server Running    ║
║                                        ║
║   Port: ${PORT}                       ║
║   Environment: ${process.env.NODE_ENV || 'development'}         
║                                        ║
║   API: http://localhost:${PORT}/api   ║
╚════════════════════════════════════════╝

📋 Available API Routes:
   ✅ Auth:            /api/auth
   ✅ Doctors:         /api/doctors
   ✅ Appointments:    /api/appointments
   ✅ Assessments:     /api/assessments
   ✅ Medical Records: /api/medical-records
   ✅ Family Access:   /api/family-access 🆕

🔗 Health Check: http://localhost:${PORT}/api/health
`);
});

// Socket.io
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

initializeSocket(io);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});