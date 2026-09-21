const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Import routes
const contactRoutes = require('./routes/contact');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: JSON.stringify({
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    });
  }
});
app.use('/api/', limiter);

// Stricter rate limit for contact form
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 contact submissions per hour (increased for testing)
  message: JSON.stringify({
    success: false,
    message: 'Too many contact form submissions, please try again later.'
  }),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many contact form submissions. Please try again in an hour.'
    });
  }
});

// URL-encode the password inside MONGODB_URI so special characters
// (@ : / ? # etc.) in the database password don't break parsing.
// Already-encoded passwords are left untouched.
function sanitizeMongoUri(uri) {
  if (!uri) return uri;
  const m = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:/?#@]+):([^@/?#]*)@(.+)$/);
  if (!m) return uri;
  const [, scheme, user, pass, rest] = m;
  let encoded = pass;
  try {
    // If decoding changes it, it was already encoded — keep as-is.
    if (decodeURIComponent(pass) === pass) encoded = encodeURIComponent(pass);
  } catch {
    encoded = encodeURIComponent(pass);
  }
  return `${scheme}${encodeURIComponent(user)}:${encoded}@${rest}`;
}

// MongoDB connection. Keep the API process available while the database is
// temporarily unreachable, and retry so it recovers without a manual restart.
const DB_RETRY_DELAY_MS = 30_000;

async function connectToDatabase() {
  try {
    await mongoose.connect(sanitizeMongoUri(process.env.MONGODB_URI), {
      serverSelectionTimeoutMS: 10_000,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('💡 Check: 1) username/password in .env  2) Atlas Network Access whitelists your IP  3) cluster is running (not paused/deleted)');
    console.log(`Retrying MongoDB connection in ${DB_RETRY_DELAY_MS / 1000} seconds (or run "node diagnose.js" for a full check)`);
    setTimeout(connectToDatabase, DB_RETRY_DELAY_MS).unref();
  }
}

connectToDatabase();

// Routes
app.use('/api/contact', contactLimiter, contactRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? 'OK' : 'DEGRADED',
    message: databaseConnected
      ? 'Portfolio API is running'
      : 'Portfolio API is running, but the database is unavailable',
    database: databaseConnected ? 'connected' : 'unavailable',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Shitalendra\'s Portfolio API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      contact: '/api/contact',
      analytics: '/api/analytics',
      admin: '/api/admin'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
});

module.exports = app;
