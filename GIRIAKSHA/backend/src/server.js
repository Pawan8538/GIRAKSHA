const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const {
  getQueuedNotifications,
  markNotificationQueued,
  getStaleNotifications,
  touchNotificationQueue
} = require('./models/queries');
const { startSimulation } = require('./services/sensorSimulator');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

// Socket.io setup for real-time alerts & messaging
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('Client connected to Socket.io');

  socket.on('join', async (userId) => {
    if (!userId) return;
    const room = `user:${userId}`;
    socket.join(room);
    onlineUsers.set(String(userId), socket.id);
    app.set('onlineUsers', onlineUsers);

    try {
      const queued = await getQueuedNotifications(userId);
      for (const entry of queued.rows) {
        socket.emit('notification', {
          id: entry.notification_id,
          type: entry.type,
          title: entry.title,
          body: entry.body,
          metadata: entry.metadata,
          created_at: entry.created_at
        });
        await markNotificationQueued(entry.id);
      }
    } catch (error) {
      console.error('Failed to flush queued notifications', error.message);
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    app.set('onlineUsers', onlineUsers);
    console.log('Client disconnected from Socket.io');
  });
});

// Initialize alert socket service
const socketService = require('../services/socket.service');
socketService.initialize(server);

// Attach io to app so routes/controllers can use it later
app.set('io', io);
app.set('onlineUsers', onlineUsers);
app.set('socketService', socketService);

setInterval(async () => {
  try {
    const stale = await getStaleNotifications(10);
    for (const entry of stale.rows) {
      console.warn(
        `[notification:fallback] User ${entry.user_id} still offline. Placeholder email/SMS for "${entry.title}".`
      );
      await touchNotificationQueue(entry.id);
    }
  } catch (error) {
    console.error('Failed to process fallback notifications', error.message);
  }
}, 60 * 1000);

server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  // Start sensor data simulation
  startSimulation();
});
