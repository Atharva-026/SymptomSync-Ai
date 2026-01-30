let io;
const connectedUsers = new Map(); // userId -> socketId

const initializeSocket = (socketIO) => {
  io = socketIO;

  io.on('connection', (socket) => {
    console.log('✅ New socket connection:', socket.id);

    // User connects and identifies themselves
    socket.on('user-connected', (userId) => {
      connectedUsers.set(userId, socket.id);
      console.log(`User ${userId} connected with socket ${socket.id}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Remove user from connected users
      for (let [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });

    // Handle typing indicators for chat
    socket.on('typing', (data) => {
      socket.broadcast.emit('user-typing', data);
    });
  });

  return io;
};

// Emit notification to specific user
const emitNotification = (userId, notification) => {
  if (!io) {
    console.error('Socket.io not initialized');
    return;
  }

  const socketId = connectedUsers.get(userId.toString());
  
  if (socketId) {
    io.to(socketId).emit('notification', notification);
    console.log(`📢 Notification sent to user ${userId}`);
  } else {
    console.log(`User ${userId} not connected`);
  }
};

// Emit to all doctors
const emitToDoctors = (notification) => {
  if (!io) return;
  io.emit('doctor-notification', notification);
};

module.exports = {
  initializeSocket,
  emitNotification,
  emitToDoctors
};