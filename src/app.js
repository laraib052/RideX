require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const routes = require('./routes/index');
const { errorHandler } = require('./middlewares/error.middleware');

// 1. Pehle app ko initialize kiya (Yeh line hum upar le aaye hain)
const app = express();

// 2. Ab app ki baaki settings aur middlewares chalenge
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;