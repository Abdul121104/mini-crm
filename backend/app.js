const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// Import passport config
require('./src/config/passport');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const segmentRoutes = require('./src/routes/segmentRoutes');
const campaignRoutes = require('./src/routes/campaignRoutes');
const vendorRoutes = require('./src/routes/vendorRoutes');
const communicationLogRoutes = require('./src/routes/communicationLogRoutes');

// Import middleware
const { errorHandler } = require('./src/middleware/errorHandler');
const { authenticate } = require('./src/middleware/auth');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Database connection
mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', authenticate, customerRoutes);
app.use('/api/segments', authenticate, segmentRoutes);
app.use('/api/campaigns', authenticate, campaignRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/communication-logs', authenticate, communicationLogRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});
