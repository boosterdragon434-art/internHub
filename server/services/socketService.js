const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io = null;

/**
 * Socket.IO Real-time service. Handles direct messaging updates, dynamic typing indicators,
 * online status presence, and instant in-app alerts notification counts.
 */
const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: '*', // Handled securely via custom origin logic or general wildcard locally
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication failed. Connection token is missing.'));
      }

      // Extract credentials
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // Contains id and role
      next();
    } catch (err) {
      logger.error('Socket Auth Error:', err.message);
      next(new Error('Authentication failed. Invalid connection token.'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    logger.info(`Socket connected: User ${userId} [socketID: ${socket.id}]`);

    // 1. Join user's personal alert notification room
    socket.join(`user_${userId}`);

    // 2. Join conversations subscription
    socket.on('join_conversation', (conversationId) => {
      socket.join(`chat_${conversationId}`);
      logger.info(`Socket: User ${userId} subscribed to thread chat_${conversationId}`);
    });

    // 3. Typing Indicators
    socket.on('typing', (conversationId) => {
      socket.to(`chat_${conversationId}`).emit('typing', {
        conversationId,
        userId,
      });
    });

    socket.on('stop_typing', (conversationId) => {
      socket.to(`chat_${conversationId}`).emit('stop_typing', {
        conversationId,
        userId,
      });
    });

    // 4. Disconnect Handler
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: User ${userId} [socketID: ${socket.id}]`);
    });
  });

  return io;
};

/**
 * Route direct messaging chat events in real-time to active listeners.
 */
const sendRealTimeMessage = (conversationId, message) => {
  if (!io) return;
  io.to(`chat_${conversationId}`).emit('message', message);
};

/**
 * Dispatch real-time in-app alerts and badge counts directly to the user's room.
 */
const sendRealTimeNotification = (userId, notification) => {
  if (!io) return;
  io.to(`user_${userId}`).emit('notification', notification);
};

/**
 * Dispatch real-time workspace task updates.
 */
const sendRealTimeTaskUpdate = (userId, task) => {
  if (!io) return;
  io.to(`user_${userId}`).emit('task_update', task);
};

module.exports = {
  initSocket,
  sendRealTimeMessage,
  sendRealTimeNotification,
  sendRealTimeTaskUpdate,
};
