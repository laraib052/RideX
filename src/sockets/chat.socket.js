// src/sockets/chat.socket.js
// Real-time in-ride chat between rider and driver

const ChatMessage = require('../models/chat-message.model');
const logger      = require('../utils/logger');

module.exports = (socket, io) => {

  // ─────────────────────────────────────────────
  // EVENT: join_chat
  // Both rider and driver call this when active ride starts
  // ─────────────────────────────────────────────
  socket.on('join_chat', async ({ rideId }) => {
    socket.join(`chat_${rideId}`);
    socket.emit('joined_chat', { rideId });
    logger.info(`${socket.user.name} joined chat: ${rideId}`);

    // Send last 30 messages so both sides see history
    try {
      const history = await ChatMessage
        .find({ ride: rideId })
        .sort({ createdAt: 1 })
        .limit(30)
        .lean();

      socket.emit('chat_history', { rideId, messages: history });
    } catch (err) {
      logger.error(`chat history error: ${err.message}`);
    }
  });

  socket.on('leave_chat', ({ rideId }) => {
    socket.leave(`chat_${rideId}`);
  });

  // ─────────────────────────────────────────────
  // EVENT: send_message
  // Emitted by rider or driver
  // ─────────────────────────────────────────────
  socket.on('send_message', async ({ rideId, text }) => {
    if (!rideId || !text?.trim()) return;

    logger.info(`💬 ${socket.user.name} → ride ${rideId}: "${text}"`);

    try {
      // Save to MongoDB
      const msg = await ChatMessage.create({
        ride:       rideId,
        sender:     socket.user._id,
        senderRole: socket.user.role,
        text:       text.trim(),
      });

      const payload = {
        _id:        msg._id.toString(),
        rideId,
        senderId:   socket.user._id.toString(),
        senderName: socket.user.name,
        senderRole: socket.user.role,
        text:       msg.text,
        createdAt:  msg.createdAt,
      };

      // Broadcast to both rider and driver in chat room
      io.to(`chat_${rideId}`).emit('new_message', payload);

    } catch (err) {
      logger.error(`send_message error: ${err.message}`);
      socket.emit('chat_error', { message: 'Message not delivered. Try again.' });
    }
  });

  // ─────────────────────────────────────────────
  // EVENT: message_read
  // Marks messages as read when opened
  // ─────────────────────────────────────────────
  socket.on('message_read', async ({ rideId }) => {
    try {
      await ChatMessage.updateMany(
        {
          ride:       rideId,
          senderRole: socket.user.role === 'rider' ? 'driver' : 'rider',
          readAt:     null,
        },
        { $set: { readAt: new Date() } }
      );

      // Notify sender their messages were read
      socket.to(`chat_${rideId}`).emit('messages_read', {
        rideId,
        readBy: socket.user.role,
      });
    } catch (err) {
      logger.error(`message_read error: ${err.message}`);
    }
  });
};