# GeoGuard API Routes Documentation

**Base URL**: `http://localhost:4000/api`
**Authentication**: Bearer Token in Authorization header

## AUTHENTICATION ROUTES

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `PUT /api/auth/me` - Update current user profile

## SENSOR ROUTES

- `GET /api/sensors` - List all sensors (Roles: FIELD_WORKER, SITE_ADMIN, SUPER_ADMIN)
- `GET /api/sensors/:sensorId` - Get sensor details
- `POST /api/sensors` - Add new sensor
- `POST /api/sensors/:sensorId/readings` - Add sensor reading
- `GET /api/sensors/:sensorId/readings` - Get sensor readings

## ALERT ROUTES

- `POST /api/alerts` - Create alert (Roles: SITE_ADMIN, SUPER_ADMIN, GOV_AUTHORITY)
- `POST /api/alerts/sos` - Send SOS emergency alert (Roles: FIELD_WORKER)
- `POST /api/alerts/:alertId/acknowledge` - Acknowledge an alert
- `GET /api/alerts/slope/:slopeId` - Get alerts for a specific slope

## COMPLAINT ROUTES

- `POST /api/complaints/upload` - Upload evidence file
- `POST /api/complaints` - Create complaint
- `GET /api/complaints` - List complaints
- `GET /api/complaints/:complaintId` - Get complaint details
- `PATCH /api/complaints/:complaintId/status` - Update complaint status
- `POST /api/complaints/:complaintId/feedback` - Add feedback to complaint

## ML (MACHINE LEARNING) ROUTES

- `POST /api/ml/predict` - Predict risk score
- `POST /api/ml/detect` - Detect cracks in uploaded image
- `POST /api/ml/forecast` - Generate 72-hour risk forecast
- `GET /api/ml/explain/:predictionId` - Explain prediction using SHAP values

## TASK ROUTES

- `GET /api/tasks/mine` - Get current user's tasks
- `GET /api/tasks/:taskId` - Get task details
- `POST /api/tasks/:taskId/status` - Update task status
- `POST /api/tasks/:taskId/attachments` - Upload task attachment

## ADMIN ROUTES

- `POST /api/admin/create-super-admin` - Create super admin user
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/:userId/role` - Change user role
- `GET /api/admin/slopes` - List all slopes
- `POST /api/admin/slopes` - Create slope
- `PATCH /api/admin/slopes/:slopeId` - Update slope
- `PATCH /api/admin/slopes/:slopeId/risk` - Update slope risk level
- `DELETE /api/admin/slopes/:slopeId` - Delete slope
- `GET /api/admin/tasks` - List all tasks (admin view)
- `POST /api/admin/tasks` - Create task
- `PATCH /api/admin/tasks/:taskId/status` - Update task status (admin)

## GOVERNMENT ROUTES

- `POST /api/govt/advisories` - Post government advisory
- `GET /api/govt/advisories` - Get advisories

## NOTIFICATIONS ROUTES

- `GET /api/notifications` - List notifications
- `POST /api/notifications/mark-all` - Mark all read
- `POST /api/notifications/:notificationId/read` - Mark one read

## SYSTEM ROUTES

- `GET /health` - Health check
- `GET /supabase` - Database connection test

## ERROR RESPONSES

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

## ROLE HIERARCHY
1. **FIELD_WORKER**: View sensors, submit complaints, send SOS
2. **SITE_ADMIN**: Manage sensors, ML features, tasks
3. **GOV_AUTHORITY**: View alerts, post advisories
4. **SUPER_ADMIN**: Full access
