const fs = require('fs');
const path = require('path');

// Agar uploads folder nahi hai, to khud hi bana do
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/sockets/socket.manager');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

async function startServer() {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Create HTTP server (needed for Socket.io)
  const httpServer = http.createServer(app);

  // 3. Initialize Socket.io on same server
  initSocket(httpServer);

  // 4. Start listening
  httpServer.listen(PORT, () => {
    logger.info(` RideX server running on port ${PORT}`);
    logger.info(` Environment: ${process.env.NODE_ENV}`);
    logger.info(`API: http://localhost:${PORT}/api`);
    logger.info(`Health: http://localhost:${PORT}/api/health`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    httpServer.close(() => process.exit(1));
  });
}

startServer();