const bcrypt = require('bcrypt');
const { query } = require('../models/db');

const {
  getAllUsers,
  updateUserRole,
  getAllSlopes,
  updateSlopeRisk,
  createSlope,
  createTask,
  getAllTasks,
  updateTaskStatus,
  getSlopeById,
  updateSlopeDetails,
  deleteSlope,
  getRoleByName,
  getUserByEmail,
  createUser,
  addTaskUpdate
} = require('../models/queries');
const { notifyUser } = require('../services/notification.service');

const sanitizeUser = (user) => {
  const { password_hash, ...rest } = user;
  return rest;
};

const listUsers = async (req, res, next) => {
  try {
    const users = await getAllUsers();
    return res.json({
      success: true,
      data: users.rows
    });
  } catch (error) {
    next(error);
  }
};

const changeUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    const updated = await updateUserRole(userId, roleId);
    if (updated.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: updated.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const listSlopes = async (req, res, next) => {
  try {
    const slopes = await getAllSlopes();
    return res.json({
      success: true,
      data: slopes.rows
    });
  } catch (error) {
    next(error);
  }
};

const createSlopeController = async (req, res, next) => {
  try {
    const { name, description, lat, lng, riskLevel = 'low', latDirection = 'N', lngDirection = 'E' } = req.body;

    const parseCoord = (value, direction, negativeDir) => {
      if (value === undefined || value === null || value === '') return null;
      const num = Number(value);
      if (Number.isNaN(num)) return null;
      return direction === negativeDir ? -Math.abs(num) : Math.abs(num);
    };

    const normalizedLat = parseCoord(lat, latDirection?.toUpperCase(), 'S');
    const normalizedLng = parseCoord(lng, lngDirection?.toUpperCase(), 'W');

    const created = await createSlope(name, description, normalizedLat, normalizedLng, riskLevel);
    return res.status(201).json({
      success: true,
      data: created.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const getSlopeController = async (req, res, next) => {
  try {
    const { slopeId } = req.params;
    const slope = await getSlopeById(slopeId);

    if (slope.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Slope not found'
      });
    }

    return res.json({
      success: true,
      data: slope.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const updateSlopeController = async (req, res, next) => {
  try {
    const { slopeId } = req.params;
    const { name = null, description = null, lat = null, lng = null } = req.body;
    const latValueRaw =
      lat === undefined || lat === null || lat === ''
        ? null
        : Number(lat);
    const lngValueRaw =
      lng === undefined || lng === null || lng === ''
        ? null
        : Number(lng);

    const latValue = Number.isNaN(latValueRaw) ? null : latValueRaw;
    const lngValue = Number.isNaN(lngValueRaw) ? null : lngValueRaw;

    const updated = await updateSlopeDetails(
      slopeId,
      name ?? null,
      description ?? null,
      latValue,
      lngValue
    );

    if (updated.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Slope not found'
      });
    }

    return res.json({
      success: true,
      data: updated.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const updateSlopeRiskController = async (req, res, next) => {
  try {
    const { slopeId } = req.params;
    const { riskLevel } = req.body;

    const updated = await updateSlopeRisk(slopeId, riskLevel);
    if (updated.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Slope not found'
      });
    }

    return res.json({
      success: true,
      data: updated.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const deleteSlopeController = async (req, res, next) => {
  try {
    const { slopeId } = req.params;
    const deleted = await deleteSlope(slopeId);

    if (deleted.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Slope not found'
      });
    }

    return res.json({
      success: true,
      data: deleted.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const listTasks = async (req, res, next) => {
  try {
    const { status } = req.query;
    const tasks = await getAllTasks();
    let data = tasks.rows;
    if (status) {
      data = data.filter((task) => task.status === status);
    }
    return res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

const createTaskController = async (req, res, next) => {
  try {
    const { assignedTo, slopeId, title, description } = req.body;
    const assignedBy = req.user?.id || req.body.assignedBy;

    const created = await createTask(assignedBy, assignedTo, slopeId, title, description);
    await addTaskUpdate(created.rows[0].id, assignedBy, 'pending', 'Task assigned', null);

    if (assignedTo) {
      await notifyUser(req.app, {
        userId: assignedTo,
        type: 'task',
        title: 'New task assigned',
        body: title,
        metadata: {
          taskId: created.rows[0].id,
          status: 'pending'
        }
      });
    }

    return res.status(201).json({
      success: true,
      data: created.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const updateTaskStatusController = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const updated = await updateTaskStatus(taskId, status);
    if (updated.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await addTaskUpdate(taskId, req.user.id, status, `Status updated to ${status}`, null);

    if (updated.rows[0].assigned_to) {
      await notifyUser(req.app, {
        userId: updated.rows[0].assigned_to,
        type: 'task',
        title: 'Task status updated',
        body: `Task "${updated.rows[0].title}" is now ${status}`,
        metadata: {
          taskId
        }
      });
    }

    return res.json({
      success: true,
      data: updated.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const createSuperAdmin = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    const existing = await getUserByEmail(email);
    if (existing.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const roleResult = await getRoleByName('super_admin');
    if (roleResult.rowCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Super Admin role not configured'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await createUser(roleResult.rows[0].id, name, email, phone, passwordHash);

    return res.status(201).json({
      success: true,
      message: 'Super Admin created successfully',
      data: sanitizeUser(created.rows[0])
    });
  } catch (error) {
    next(error);
  }
};

const generateDemoData = async (req, res, next) => {
  try {
    // 1. Ensure we have a slope
    let slopeId;
    const slopeRes = await query("SELECT id FROM slopes LIMIT 1");
    if (slopeRes.rows.length === 0) {
      const newSlope = await query(
        "INSERT INTO slopes (name, description, risk_level, lat, lng) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        ['Demo Slope', 'Slope for testing', 'low', 11.1022, 79.1564]
      );
      slopeId = newSlope.rows[0].id;
    } else {
      slopeId = slopeRes.rows[0].id;
    }

    // 2. Ensure we have sensors
    const sensorTypes = ['displacement', 'pore_pressure', 'vibration', 'rain_gauge'];
    const sensorIds = [];

    for (const type of sensorTypes) {
      const sensorRes = await query(
        "SELECT id FROM sensors WHERE slope_id = $1 AND sensor_type = $2 LIMIT 1",
        [slopeId, type]
      );

      if (sensorRes.rows.length === 0) {
        const newSensor = await query(
          "INSERT INTO sensors (slope_id, name, sensor_type, is_active) VALUES ($1, $2, $3, $4) RETURNING id",
          [slopeId, `${type}_01`, type, true]
        );
        sensorIds.push({ id: newSensor.rows[0].id, type });
      } else {
        sensorIds.push({ id: sensorRes.rows[0].id, type });
      }
    }

    // 3. Generate readings
    const readings = [];
    for (const sensor of sensorIds) {
      let value = 0;
      if (sensor.type === 'displacement') value = Math.random() * 10;
      if (sensor.type === 'pore_pressure') value = Math.random() * 50;
      if (sensor.type === 'vibration') value = Math.random() * 0.5;
      if (sensor.type === 'rain_gauge') value = Math.random() * 20;

      readings.push({
        sensor_id: sensor.id,
        value: parseFloat(value.toFixed(2)),
        status: 'ok'
      });
    }

    // 4. Insert readings
    for (const reading of readings) {
      await query(
        "INSERT INTO sensor_readings (sensor_id, value, status) VALUES ($1, $2, $3)",
        [reading.sensor_id, reading.value, reading.status]
      );
    }

    return res.json({
      success: true,
      message: 'Demo data generated successfully',
      data: readings
    });

  } catch (error) {
    next(error);
  }
};

const getAllMines = async (req, res, next) => {
  // Alias for listSlopes, but semantically for "Mines"
  return listSlopes(req, res, next);
};

module.exports = {
  listUsers,
  changeUserRole,
  listSlopes,
  createSlope: createSlopeController,
  getSlope: getSlopeController,
  updateSlope: updateSlopeController,
  updateSlopeRisk: updateSlopeRiskController,
  deleteSlope: deleteSlopeController,
  listTasks,
  createTask: createTaskController,
  updateTaskStatus: updateTaskStatusController,
  createSuperAdmin,
  generateDemoData,
  getAllMines
};


