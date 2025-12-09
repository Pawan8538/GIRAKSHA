const { query } = require('./db');

/* ============================================================
   ROLES
============================================================ */
const getAllRoles = () => query(`SELECT * FROM roles`);
const getRoleById = (id) => query(`SELECT * FROM roles WHERE id = $1`, [id]);

/* ============================================================
   USERS
============================================================ */
const createUser = (role_id, name, email, phone, password_hash, slope_id = null) =>
  query(
    `INSERT INTO users (role_id, name, email, phone, password_hash, slope_id, approval_status, is_approved)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending', FALSE) RETURNING *`,
    [role_id, name, email, phone, password_hash, slope_id]
  );

const getUserByEmail = (email) =>
  query(`SELECT * FROM users WHERE email = $1`, [email]);

const getUserByPhone = (phone) =>
  query(`SELECT * FROM users WHERE phone = $1`, [phone]);

const getUserById = (id) =>
  query(`SELECT * FROM users WHERE id = $1`, [id]);

const getUsersCount = () =>
  query(`SELECT COUNT(*)::int AS count FROM users`);

const getUsersByRole = (roleName) =>
  query(
    `SELECT u.*, r.name as role_name, ga.department
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     LEFT JOIN govt_authorities ga ON ga.user_id = u.id
     WHERE r.name = $1`,
    [roleName]
  );

const getRoleByName = (name) =>
  query(`SELECT * FROM roles WHERE name = $1`, [name]);

const updateUserProfile = (user_id, name, phone) =>
  query(
    `UPDATE users
     SET name = COALESCE($2, name),
         phone = COALESCE($3, phone),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [user_id, name, phone]
  );

const updateUserPassword = (user_id, password_hash) =>
  query(
    `UPDATE users
     SET password_hash = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [user_id, password_hash]
  );

/* ============================================================
   GOVT AUTHORITIES
============================================================ */
const createGovAuthority = (user_id, department, region) =>
  query(
    `INSERT INTO govt_authorities (user_id, department, region)
     VALUES ($1, $2, $3) RETURNING *`,
    [user_id, department, region]
  );

const getGovAuthorityByUser = (user_id) =>
  query(`SELECT * FROM govt_authorities WHERE user_id = $1`, [user_id]);

/* ============================================================
   SLOPES
============================================================ */
const createSlope = (name, description, lat, lng, risk_level = 'low') =>
  query(
    `INSERT INTO slopes (name, description, location, risk_level)
     VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5)
     RETURNING 
       id,
       name,
       description,
       risk_level,
       ST_Y(location::geometry) AS lat,
       ST_X(location::geometry) AS lng,
       created_at`,
    [name, description, lng, lat, risk_level]
  );

const getAllSlopes = () =>
  query(`
    SELECT 
      id, 
      name, 
      description, 
      risk_level,
      ST_Y(location::geometry) AS lat,
      ST_X(location::geometry) AS lng,
      created_at
    FROM slopes
    ORDER BY created_at DESC
  `);

const getSlopeById = (id) =>
  query(
    `
    SELECT 
      id,
      name,
      description,
      risk_level,
      ST_Y(location::geometry) AS lat,
      ST_X(location::geometry) AS lng,
      created_at
    FROM slopes
    WHERE id = $1
  `,
    [id]
  );

const updateSlopeDetails = (id, name, description, lat, lng) =>
  query(
    `
    UPDATE slopes
    SET
      name = COALESCE($2, name),
      description = COALESCE($3, description),
      location = CASE
        WHEN $4::numeric IS NOT NULL AND $5::numeric IS NOT NULL
          THEN ST_SetSRID(ST_MakePoint($5, $4), 4326)
        ELSE location
      END
    WHERE id = $1
    RETURNING 
      id,
      name,
      description,
      risk_level,
      ST_Y(location::geometry) AS lat,
      ST_X(location::geometry) AS lng,
      created_at
  `,
    [id, name, description, lat, lng]
  );

const deleteSlope = (id) =>
  query(
    `
    DELETE FROM slopes
    WHERE id = $1
    RETURNING 
      id,
      name,
      description,
      risk_level,
      ST_Y(location::geometry) AS lat,
      ST_X(location::geometry) AS lng,
      created_at
  `,
    [id]
  );

/* ============================================================
   SENSORS
============================================================ */
const createSensor = (slope_id, name, sensor_type, unit) =>
  query(
    `INSERT INTO sensors (slope_id, name, sensor_type, unit)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [slope_id, name, sensor_type, unit]
  );

const getSensorsBySlope = (slope_id) =>
  query(
    `SELECT DISTINCT ON (s.id) s.*, r.value as current_value, r.status as reading_status, r.time as last_reading_time
     FROM sensors s
     LEFT JOIN sensor_readings r ON s.id = r.sensor_id
     WHERE s.slope_id = $1
     ORDER BY s.id, r.time DESC`,
    [slope_id]
  );

const toggleSensorActive = (sensor_id) =>
  query(
    `UPDATE sensors
     SET is_active = NOT is_active
     WHERE id = $1
     RETURNING *`,
    [sensor_id]
  );

const getAllSensors = () =>
  query(
    `SELECT DISTINCT ON (s.id) s.*, r.value as current_value, r.status as reading_status, r.time as last_reading_time
     FROM sensors s
     LEFT JOIN sensor_readings r ON s.id = r.sensor_id
     ORDER BY s.id, r.time DESC`
  );

const getSensorById = (sensor_id) =>
  query(`SELECT * FROM sensors WHERE id = $1`, [sensor_id]);

/* ============================================================
   SENSOR READINGS (Timescale hypertables to be added later)
============================================================ */
const insertSensorReading = (sensor_id, value, status = 'ok') =>
  query(
    `INSERT INTO sensor_readings (sensor_id, value, status, time)
     VALUES ($1, $2, $3, NOW()) RETURNING *`,
    [sensor_id, value, status]
  );

const getSensorHistory = (sensor_id, limit = 100) =>
  query(
    `SELECT * FROM sensor_readings
     WHERE sensor_id = $1
     ORDER BY time DESC
     LIMIT $2`,
    [sensor_id, limit]
  );

const getSensorReadingStats = (sensor_id, hours = 24) =>
  query(
    `SELECT 
       MIN(value) as min_value,
       MAX(value) as max_value,
       AVG(value)::numeric(10,2) as avg_value,
       COUNT(*) as reading_count
     FROM sensor_readings
     WHERE sensor_id = $1 
       AND time > NOW() - ($2 || ' hours')::interval`,
    [sensor_id, hours]
  );

/* ============================================================
   COMPLAINTS
============================================================ */
const createComplaint = (user_id, slope_id, description, media_url) =>
  query(
    `INSERT INTO complaints (user_id, slope_id, description, media_url)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [user_id, slope_id, description, media_url]
  );

const getComplaintsByUser = (user_id) =>
  query(`SELECT * FROM complaints WHERE user_id = $1 ORDER BY created_at DESC`, [user_id]);

const getAllComplaints = () =>
  query(`SELECT * FROM complaints ORDER BY created_at DESC`);

const getComplaintById = (id) =>
  query(`SELECT * FROM complaints WHERE id = $1`, [id]);

const updateComplaintStatus = (id, status) =>
  query(
    `UPDATE complaints
     SET status = $1
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );

/* ============================================================
   ALERTS
============================================================ */
const createAlert = (slope_id, alert_type, message, severity) =>
  query(
    `INSERT INTO alerts (slope_id, alert_type, message, severity)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [slope_id, alert_type, message, severity]
  );

const acknowledgeAlert = (alert_id, user_id) =>
  query(
    `UPDATE alerts
     SET acknowledged = TRUE, acknowledged_by = $1
     WHERE id = $2
     RETURNING *`,
    [user_id, alert_id]
  );

const getAlertsBySlope = (slope_id) =>
  query(`SELECT * FROM alerts WHERE slope_id = $1 ORDER BY created_at DESC`, [slope_id]);

const getAllAlerts = () =>
  query(`SELECT * FROM alerts ORDER BY created_at DESC`);

const getAlertsByType = (alert_type, slope_id) => {
  if (slope_id) {
    return query(
      `SELECT * FROM alerts
       WHERE alert_type = $1 AND slope_id = $2
       ORDER BY created_at DESC`,
      [alert_type, slope_id]
    );
  }
  return query(
    `SELECT * FROM alerts
     WHERE alert_type = $1
     ORDER BY created_at DESC`,
    [alert_type]
  );
};

const createAdvisoryMessage = (slope_id, message, severity = 'info') =>
  query(
    `INSERT INTO alerts (slope_id, alert_type, message, severity)
     VALUES ($1, 'gov_advisory', $2, $3)
     RETURNING *`,
    [slope_id, message, severity]
  );

/* ============================================================
   OFFLINE MESSAGES
============================================================ */
const addOfflineMessage = (user_id, payload) =>
  query(
    `INSERT INTO offline_messages (user_id, payload)
     VALUES ($1, $2) RETURNING *`,
    [user_id, payload]
  );

const getOfflineMessages = (user_id) =>
  query(
    `SELECT * FROM offline_messages
     WHERE user_id = $1 AND delivered = FALSE`,
    [user_id]
  );

const markOfflineDelivered = (id) =>
  query(`UPDATE offline_messages SET delivered = TRUE WHERE id = $1`, [id]);

/* ============================================================
   ML PREDICTIONS
============================================================ */
const savePrediction = (slope_id, risk_score, prediction, explainability) =>
  query(
    `INSERT INTO ml_predictions (slope_id, risk_score, prediction, explainability)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [slope_id, risk_score, prediction, explainability]
  );

/* ============================================================
   TASKS
============================================================ */
const createTask = (assigned_by, assigned_to, slope_id, title, description) =>
  query(
    `INSERT INTO tasks (assigned_by, assigned_to, slope_id, title, description)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [assigned_by, assigned_to, slope_id, title, description]
  );

const getTasksForUser = (user_id) =>
  query(`SELECT * FROM tasks WHERE assigned_to = $1 ORDER BY created_at DESC`, [user_id]);

const getAllTasks = () =>
  query(`SELECT * FROM tasks ORDER BY created_at DESC`);

const getTaskById = (task_id) =>
  query(`SELECT * FROM tasks WHERE id = $1`, [task_id]);

const updateTaskStatus = (task_id, status) =>
  query(
    `UPDATE tasks
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, task_id]
  );

const getAllUsers = () =>
  query(
    `SELECT u.*, r.name AS role_name
     FROM users u
     LEFT JOIN roles r ON r.id = u.role_id
     ORDER BY u.created_at DESC`
  );

const updateUserRole = (user_id, role_id) =>
  query(
    `UPDATE users
     SET role_id = $1
     WHERE id = $2
     RETURNING *`,
    [role_id, user_id]
  );

const updateSlopeRisk = (slope_id, risk_level) =>
  query(
    `UPDATE slopes
     SET risk_level = $1
     WHERE id = $2
     RETURNING *`,
    [risk_level, slope_id]
  );

/* ============================================================
   TASK ATTACHMENTS & UPDATES
============================================================ */
const addTaskAttachment = (task_id, uploaded_by, file_url, file_type) =>
  query(
    `INSERT INTO task_attachments (task_id, uploaded_by, file_url, file_type)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [task_id, uploaded_by, file_url, file_type]
  );

const getTaskAttachments = (task_id) =>
  query(
    `SELECT * FROM task_attachments
     WHERE task_id = $1
     ORDER BY created_at DESC`,
    [task_id]
  );

const addTaskUpdate = (task_id, user_id, status, comment, attachment_url) =>
  query(
    `INSERT INTO task_updates (task_id, user_id, status, comment, attachment_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [task_id, user_id, status, comment, attachment_url]
  );

const getTaskUpdates = (task_id) =>
  query(
    `SELECT tu.*, u.name as user_name
     FROM task_updates tu
     LEFT JOIN users u ON u.id = tu.user_id
     WHERE tu.task_id = $1
     ORDER BY tu.created_at DESC`,
    [task_id]
  );

/* ============================================================
   COMPLAINT MEDIA & FEEDBACK
============================================================ */
const addComplaintMedia = (complaint_id, url, media_type = 'image') =>
  query(
    `INSERT INTO complaint_media (complaint_id, url, media_type)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [complaint_id, url, media_type]
  );

const getComplaintMedia = (complaint_id) =>
  query(
    `SELECT * FROM complaint_media
     WHERE complaint_id = $1
     ORDER BY created_at ASC`,
    [complaint_id]
  );

const addComplaintFeedback = (complaint_id, admin_id, worker_id, message, event_type = 'feedback') =>
  query(
    `INSERT INTO complaint_feedback (complaint_id, admin_id, worker_id, message, event_type)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [complaint_id, admin_id, worker_id, message, event_type]
  );

const getComplaintFeedback = (complaint_id) =>
  query(
    `SELECT cf.*, au.name as admin_name, wu.name as worker_name
     FROM complaint_feedback cf
     LEFT JOIN users au ON au.id = cf.admin_id
     LEFT JOIN users wu ON wu.id = cf.worker_id
     WHERE cf.complaint_id = $1
     ORDER BY cf.created_at ASC`,
    [complaint_id]
  );

/* ============================================================
   MESSAGING
============================================================ */
const findConversation = (gov_user_id, site_admin_id) =>
  query(
    `SELECT * FROM conversations
     WHERE gov_user_id = $1 AND site_admin_id = $2`,
    [gov_user_id, site_admin_id]
  );

const createConversation = (gov_user_id, site_admin_id, created_by) =>
  query(
    `INSERT INTO conversations (gov_user_id, site_admin_id, created_by)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [gov_user_id, site_admin_id, created_by]
  );

const getConversationById = (conversation_id) =>
  query(`SELECT * FROM conversations WHERE id = $1`, [conversation_id]);

const getConversationsForUser = (user_id) =>
  query(
    `SELECT c.*,
            gu.name as gov_name,
            sa.name as site_admin_name,
            gau.department as gov_department
     FROM conversations c
     LEFT JOIN users gu ON gu.id = c.gov_user_id
     LEFT JOIN govt_authorities gau ON gau.user_id = c.gov_user_id
     LEFT JOIN users sa ON sa.id = c.site_admin_id
     WHERE c.gov_user_id = $1 OR c.site_admin_id = $1
     ORDER BY c.last_message_at DESC`,
    [user_id]
  );

const createConversationMessage = (conversation_id, sender_id, body, attachments) =>
  query(
    `INSERT INTO conversation_messages (conversation_id, sender_id, body, attachments)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [conversation_id, sender_id, body, attachments]
  );

const getConversationMessages = (conversation_id, limit = 50) =>
  query(
    `SELECT cm.*, u.name as sender_name, r.name as sender_role
     FROM conversation_messages cm
     LEFT JOIN users u ON u.id = cm.sender_id
     LEFT JOIN roles r ON r.id = u.role_id
     WHERE cm.conversation_id = $1
     ORDER BY cm.created_at DESC
     LIMIT $2`,
    [conversation_id, limit]
  );

const markConversationMessagesRead = (conversation_id, reader_id) =>
  query(
    `UPDATE conversation_messages
     SET read_at = NOW()
     WHERE conversation_id = $1 AND sender_id <> $2 AND read_at IS NULL`,
    [conversation_id, reader_id]
  );

const touchConversation = (conversation_id) =>
  query(
    `UPDATE conversations
     SET last_message_at = NOW()
     WHERE id = $1`,
    [conversation_id]
  );

/* ============================================================
   NOTIFICATIONS
============================================================ */
const createNotification = (user_id, type, title, body, metadata = {}) =>
  query(
    `INSERT INTO notifications (user_id, type, title, body, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [user_id, type, title, body, metadata]
  );

const getNotificationsForUser = (user_id, limit = 50) =>
  query(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [user_id, limit]
  );

const markNotificationRead = (notification_id, user_id) =>
  query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [notification_id, user_id]
  );

const markAllNotificationsRead = (user_id) =>
  query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE user_id = $1 AND is_read = FALSE`,
    [user_id]
  );

const enqueueNotification = (notification_id, user_id) =>
  query(
    `INSERT INTO notification_queue (notification_id, user_id)
     VALUES ($1, $2)
     RETURNING *`,
    [notification_id, user_id]
  );

const getQueuedNotifications = (user_id) =>
  query(
    `SELECT q.*, n.type, n.title, n.body, n.metadata
     FROM notification_queue q
     INNER JOIN notifications n ON n.id = q.notification_id
     WHERE q.user_id = $1 AND q.sent = FALSE
     ORDER BY q.created_at ASC`,
    [user_id]
  );

const markNotificationQueued = (queue_id) =>
  query(
    `UPDATE notification_queue
     SET sent = TRUE, last_attempt_at = NOW()
     WHERE id = $1`,
    [queue_id]
  );

const getStaleNotifications = (minutes = 10) =>
  query(
    `SELECT q.*, n.type, n.title, n.body, n.metadata
     FROM notification_queue q
     INNER JOIN notifications n ON n.id = q.notification_id
     WHERE q.sent = FALSE
       AND (q.last_attempt_at IS NULL OR NOW() - q.last_attempt_at > ($1 || ' minutes')::interval)`,
    [minutes]
  );

const touchNotificationQueue = (queue_id) =>
  query(
    `UPDATE notification_queue
     SET last_attempt_at = NOW()
     WHERE id = $1`,
    [queue_id]
  );

/* ============================================================
   ADVISORIES
============================================================ */
const createAdvisory = (author_id, target_site_admin_id, slope_id, title, message, severity, attachment_url) =>
  query(
    `INSERT INTO advisories (author_id, target_site_admin_id, slope_id, title, message, severity, attachment_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [author_id, target_site_admin_id, slope_id, title, message, severity, attachment_url]
  );

const addAdvisoryAttachment = (advisory_id, file_url, file_type) =>
  query(
    `INSERT INTO advisory_attachments (advisory_id, file_url, file_type)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [advisory_id, file_url, file_type]
  );

const getAdvisories = (filter = {}) => {
  const conditions = [];
  const values = [];

  if (filter.siteAdminId) {
    values.push(filter.siteAdminId);
    conditions.push(`(target_site_admin_id = $${values.length} OR target_site_admin_id IS NULL)`);
  }
  if (filter.authorId) {
    values.push(filter.authorId);
    conditions.push(`author_id = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  return query(
    `SELECT a.*, u.name as author_name, sa.name as target_site_admin_name
     FROM advisories a
     LEFT JOIN users u ON u.id = a.author_id
     LEFT JOIN users sa ON sa.id = a.target_site_admin_id
     ${whereClause}
     ORDER BY a.created_at DESC`
    , values);
};

const getAdvisoryAttachments = (advisory_id) =>
  query(
    `SELECT * FROM advisory_attachments
     WHERE advisory_id = $1`,
    [advisory_id]
  );

module.exports = {
  getAllRoles,
  getRoleById,
  getRoleByName,
  createUser,
  getUserByEmail,
  getUserByPhone,
  getUserById,
  getUsersCount,
  getUsersByRole,
  updateUserProfile,
  updateUserPassword,
  createGovAuthority,
  getGovAuthorityByUser,
  createSlope,
  getAllSlopes,
  getSlopeById,
  updateSlopeDetails,
  deleteSlope,
  createSensor,
  getSensorsBySlope,
  getAllSensors,
  getSensorById,
  toggleSensorActive,
  insertSensorReading,
  getSensorHistory,
  getSensorReadingStats,
  createComplaint,
  getComplaintsByUser,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  createAlert,
  acknowledgeAlert,
  getAlertsBySlope,
  getAllAlerts,
  getAlertsByType,
  createAdvisoryMessage,
  addOfflineMessage,
  getOfflineMessages,
  markOfflineDelivered,
  savePrediction,
  createTask,
  getTasksForUser,
  getAllTasks,
  getTaskById,
  updateTaskStatus,
  getAllUsers,
  updateUserRole,
  updateSlopeRisk,
  addTaskAttachment,
  getTaskAttachments,
  addTaskUpdate,
  getTaskUpdates,
  addComplaintMedia,
  getComplaintMedia,
  addComplaintFeedback,
  getComplaintFeedback,
  findConversation,
  createConversation,
  getConversationById,
  getConversationsForUser,
  createConversationMessage,
  getConversationMessages,
  markConversationMessagesRead,
  touchConversation,
  createNotification,
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  enqueueNotification,
  getQueuedNotifications,
  markNotificationQueued,
  getStaleNotifications,
  touchNotificationQueue,
  createAdvisory,
  addAdvisoryAttachment,
  getAdvisories,
  getAdvisoryAttachments,
  createDefaultSensors: async (slope_id) => {
    const sensors = [
      { name: 'Displacement Sensor 1', type: 'displacement', unit: 'mm' },
      { name: 'Rain Gauge', type: 'rain_gauge', unit: 'mm' },
      { name: 'Seismic Sensor', type: 'seismic', unit: 'Hz' },
      { name: 'Tiltmeter', type: 'tilt', unit: 'deg' }
    ];
    for (const s of sensors) {
      await createSensor(slope_id, s.name, s.type, s.unit);
    }
  },

  /* ============================================================
     AUTH V2 QUERIES
  ============================================================ */
  createWorkerInvite: (phone, slope_id, invited_by) =>
    query(
      `INSERT INTO worker_invites (phone, slope_id, invited_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (phone) DO UPDATE SET slope_id = $2, invited_by = $3, is_registered = FALSE
       RETURNING *`,
      [phone, slope_id, invited_by]
    ),

  getWorkerInviteByPhone: (phone) =>
    query(`SELECT * FROM worker_invites WHERE phone = $1`, [phone]),

  markWorkerInviteRegistered: (id) =>
    query(`UPDATE worker_invites SET is_registered = TRUE WHERE id = $1`, [id]),

  approveUser: (user_id) =>
    query(
      `UPDATE users SET is_approved = TRUE, approval_status = 'approved' WHERE id = $1 RETURNING *`,
      [user_id]
    ),

  rejectUser: (user_id) =>
    query(
      `UPDATE users SET is_approved = FALSE, approval_status = 'rejected' WHERE id = $1 RETURNING *`,
      [user_id]
    ),

  getPendingUsers: () =>
    query(
      `SELECT u.*, r.name as role_name, ga.department 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       LEFT JOIN govt_authorities ga ON ga.user_id = u.id
       WHERE u.approval_status = 'pending' 
       ORDER BY u.created_at DESC`
    ),

  updateUserDocs: (user_id, govt_id_url, company_id_url) =>
    query(
      `UPDATE users 
       SET govt_id_url = COALESCE($2, govt_id_url), 
           company_id_url = COALESCE($3, company_id_url) 
       WHERE id = $1 RETURNING *`,
      [user_id, govt_id_url, company_id_url]
    ),

  updateUserDepartment: (user_id, department) =>
    query(
      `UPDATE users SET department = $2 WHERE id = $1 RETURNING *`,
      [user_id, department]
    ),

  getWorkersBySlope: (slope_id) =>
    query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.slope_id = $1 AND r.name = 'field_worker'
       ORDER BY u.created_at DESC`,
      [slope_id]
    ),
  deleteUser: (id) =>
    query(`DELETE FROM users WHERE id = $1 RETURNING *`, [id])
};
