require('dotenv').config();
require('./config/env');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const routes = require('./routes/index');
const { errorHandler } = require('./middlewares/error.middleware');
const logger = require('./utils/logger');

const app = express();

// ── Security headers ──────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ─────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 100,
  message: { success: false, message: 'Too many requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth routes ko tight limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,                    // Sirf 20 login attempts / 15 min
  message: { success: false, message: 'Too many auth attempts.' },
});

app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);

// ── Body parsing ──────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Data sanitization ─────────────────────────────
app.use(mongoSanitize());   // NoSQL injection protection
app.use(xss());             // XSS protection
app.use(hpp());             // HTTP parameter pollution protection

// ── Logging ───────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Routes ────────────────────────────────────────
app.use('/api', routes);

// ── 404 ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.url} not found` });
});

// ── Global error handler ──────────────────────────
app.use(errorHandler);

module.exports = app;