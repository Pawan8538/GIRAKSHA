require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { query } = require("./models/db");
const { requestLogger } = require('./utils/logger');
const { notFoundHandler, errorHandler } = require('./middleware/validate');

// Route modules
const authRoutes = require('./routes/auth.routes');
const sensorsRoutes = require('./routes/sensors.routes');
const alertsRoutes = require('./routes/alerts.routes');
const complaintsRoutes = require('./routes/complaints.routes');
const govtRoutes = require('./routes/govt.routes');
const adminRoutes = require('./routes/admin.routes');
const mlRoutes = require('./routes/ml.routes');
const rolesRoutes = require('./routes/roles.routes');
const messagesRoutes = require('./routes/messages.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const tasksRoutes = require('./routes/tasks.routes');

const app = express();

// Basic security & parsing middleware
app.use(helmet());
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(requestLogger);

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend-api', timestamp: new Date().toISOString() });
});

//TEST
app.get("/supabase", async (req, res) => {
  try {
    const result = await query("SELECT NOW()");
    res.json({ connected: true, time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// API routes (wire up when implemented)
app.use('/api/auth', authRoutes);
app.use('/api/sensors', sensorsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/govt', govtRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/tasks', tasksRoutes);

// 404 + error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;


