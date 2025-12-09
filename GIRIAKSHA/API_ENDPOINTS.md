# GeoGuard API Endpoints

## Base URL
```
http://localhost:4000/api
```

## Authentication

All endpoints (except `/auth/login` and `/auth/register`) require JWT token in header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "site_admin",
    "department": "Operations"
  }
}
```

**Used by**: Web App, Mobile App

---

### Get Current User
```http
GET /auth/me
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "user@example.com",
  "phone": "+1234567890",
  "role": "site_admin",
  "department": "Operations"
}
```

**Used by**: Web App (Profile Page), Mobile App

---

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "field_worker",
  "department": "Field Operations"
}
```

**Used by**: Web App (Admin), Mobile App

---

## Sensor Endpoints

### Get All Sensors
```http
GET /sensors
```

**Query Parameters:**
- `slope_id` (optional): Filter by slope

**Response:**
```json
[
  {
    "id": 1,
    "slope_id": 1,
    "name": "Displacement Sensor 1",
    "sensor_type": "displacement",
    "unit": "mm",
    "is_active": true,
    "current_value": 2.45,
    "reading_status": "ok",
    "last_reading_time": "2024-12-09T10:30:00Z"
  }
]
```

**Used by**: Web App (Sensors Page), Mobile App (Sensors Screen)

---

### Get Single Sensor
```http
GET /sensors/:id
```

**Response:**
```json
{
  "id": 1,
  "slope_id": 1,
  "name": "Displacement Sensor 1",
  "sensor_type": "displacement",
  "unit": "mm",
  "is_active": true,
  "location": "POINT(79.156389 11.102222)",
  "last_seen": "2024-12-09T10:30:00Z"
}
```

**Used by**: Web App, Mobile App

---

### Get Sensor Readings
```http
GET /sensors/:id/readings
```

**Query Parameters:**
- `limit` (default: 100): Number of readings
- `offset` (default: 0): Pagination offset
- `start_time` (optional): Start timestamp
- `end_time` (optional): End timestamp

**Response:**
```json
{
  "readings": [
    {
      "id": 1001,
      "time": "2024-12-09T10:30:00Z",
      "value": 2.45,
      "status": "ok"
    }
  ],
  "total": 1000,
  "limit": 100,
  "offset": 0
}
```

**Used by**: Web App (Sensor Detail), Mobile App (Sensor History)

---

### Create Sensor Reading
```http
POST /sensors/:id/readings
```

**Request Body:**
```json
{
  "value": 2.45,
  "status": "ok"
}
```

**Used by**: IoT Devices, Backend Simulator

---

## Alert Endpoints

### Get All Alerts
```http
GET /alerts
```

**Query Parameters:**
- `severity` (optional): low, medium, high, critical
- `acknowledged` (optional): true, false
- `limit` (default: 50)

**Response:**
```json
[
  {
    "id": 1,
    "title": "High Risk Detected",
    "message": "Slope 1 showing high displacement",
    "severity": "high",
    "alert_type": "ml_prediction",
    "slope_id": 1,
    "acknowledged": false,
    "created_at": "2024-12-09T10:00:00Z"
  }
]
```

**Used by**: Web App (Alerts Page), Mobile App (Alerts Screen)

---

### Create Alert
```http
POST /alerts
```

**Request Body:**
```json
{
  "title": "High Risk Detected",
  "message": "Slope 1 showing high displacement",
  "severity": "high",
  "alert_type": "ml_prediction",
  "slope_id": 1
}
```

**Roles**: site_admin, super_admin

**Used by**: Web App (Admin), ML Service (Auto-alerts)

---

### Acknowledge Alert
```http
PATCH /alerts/:id/acknowledge
```

**Response:**
```json
{
  "id": 1,
  "acknowledged": true,
  "acknowledged_by": 5,
  "acknowledged_at": "2024-12-09T10:35:00Z"
}
```

**Used by**: Web App, Mobile App

---

## ML Endpoints

### Risk Prediction
```http
POST /ml/predict
```

**Request Body:**
```json
{
  "slope_id": 1,
  "displacement": 2.5,
  "pore_pressure": 35.2,
  "tilt": 1.8,
  "vibration": 0.15,
  "seismic": 1.2,
  "rainfall": 15.3
}
```

**Response:**
```json
{
  "risk_score": 0.72,
  "risk_level": "high",
  "confidence": 0.89,
  "recommendations": [
    "Increase monitoring frequency",
    "Alert field workers"
  ],
  "feature_importance": {
    "displacement": 0.35,
    "rainfall": 0.28,
    "pore_pressure": 0.22
  }
}
```

**Used by**: Web App (ML Predict Page), Mobile App (ML Screen)

---

### Crack Detection
```http
POST /ml/detect
```

**Request Body** (multipart/form-data):
- `image`: Image file (JPEG/PNG)
- `slope_id`: Slope ID (optional)

**Response:**
```json
{
  "has_crack": true,
  "confidence": 0.94,
  "crack_severity": "moderate",
  "risk_assessment": "medium",
  "recommendations": [
    "Schedule visual inspection",
    "Monitor closely for 48 hours"
  ]
}
```

**Used by**: Web App (ML Detect Page), Mobile App (Crack Detection Screen)

---

### 72-Hour Forecast
```http
GET /ml/forecast/:slopeId
```

**Response:**
```json
{
  "slope_id": 1,
  "current_risk": {
    "score": 0.42,
    "level": "medium",
    "last_updated": "2024-12-09T10:00:00Z"
  },
  "forecast": [
    {
      "timestamp": "2024-12-09T12:00:00Z",
      "risk_score": 0.45,
      "risk_level": "medium",
      "weather": {
        "temperature": 28.5,
        "precipitation": 5.2,
        "wind_speed": 12.3,
        "humidity": 75
      }
    }
  ],
  "weather_impact": {
    "rainfall": "moderate_increase",
    "temperature": "stable"
  }
}
```

**Used by**: Web App (Forecast Page), Mobile App (Forecast Screen)

---

## Task Endpoints

### Get Tasks
```http
GET /tasks
```

**Query Parameters:**
- `assigned_to` (optional): User ID
- `status` (optional): pending, in_progress, completed
- `mine_id` (optional): Filter by mine

**Response:**
```json
[
  {
    "id": 1,
    "title": "Inspect Sensor 5",
    "description": "Check displacement sensor calibration",
    "status": "in_progress",
    "priority": "high",
    "assigned_to": 10,
    "assigned_by": 5,
    "due_date": "2024-12-10T18:00:00Z",
    "created_at": "2024-12-09T08:00:00Z"
  }
]
```

**Used by**: Web App (Tasks Page), Mobile App (Tasks Screen)

---

### Update Task
```http
PATCH /tasks/:id
```

**Request Body:**
```json
{
  "status": "completed",
  "notes": "Sensor calibrated successfully"
}
```

**Used by**: Web App, Mobile App (Field Workers)

---

## Complaint Endpoints

### Get Complaints
```http
GET /complaints
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Damaged Equipment",
    "description": "Sensor cable damaged",
    "priority": "high",
    "status": "open",
    "reported_by": 10,
    "location": "POINT(79.156389 11.102222)",
    "image_url": "/uploads/complaint-1.jpg",
    "created_at": "2024-12-09T09:00:00Z"
  }
]
```

**Used by**: Web App (Admin), Mobile App (All Users)

---

### Create Complaint
```http
POST /complaints
```

**Request Body** (multipart/form-data):
- `title`: Complaint title
- `description`: Description
- `priority`: low, medium, high
- `location`: Coordinates (optional)
- `image`: Image file (optional)

**Used by**: Mobile App (Field Workers), Web App

---

## Notification Endpoints

### Get Notifications
```http
GET /notifications
```

**Query Parameters:**
- `read` (optional): true, false
- `limit` (default: 50)

**Response:**
```json
[
  {
    "id": 1,
    "title": "New Alert",
    "message": "High risk detected on Slope 1",
    "type": "alert",
    "is_read": false,
    "created_at": "2024-12-09T10:00:00Z"
  }
]
```

**Used by**: Web App (Navbar), Mobile App (Notifications)

---

### Mark Notification as Read
```http
PATCH /notifications/:id/read
```

**Used by**: Web App, Mobile App

---

## Admin Endpoints

### Get All Users
```http
GET /admin/users
```

**Roles**: super_admin, site_admin

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "field_worker",
    "department": "Operations",
    "is_active": true,
    "created_at": "2024-11-01T00:00:00Z"
  }
]
```

**Used by**: Web App (Admin Panel)

---

### Update User
```http
PATCH /admin/users/:id
```

**Request Body:**
```json
{
  "role": "site_admin",
  "is_active": true
}
```

**Roles**: super_admin

**Used by**: Web App (Admin Panel)

---

### Delete User
```http
DELETE /admin/users/:id
```

**Roles**: super_admin

**Used by**: Web App (Admin Panel)

---

## Government Endpoints

### Get Advisories
```http
GET /govt/advisories
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Safety Advisory",
    "content": "Heavy rainfall expected",
    "severity": "high",
    "issued_by": 3,
    "document_url": "/uploads/advisory-1.pdf",
    "created_at": "2024-12-09T08:00:00Z"
  }
]
```

**Used by**: Web App, Mobile App

---

### Post Advisory
```http
POST /govt/advisories
```

**Request Body** (multipart/form-data):
- `title`: Advisory title
- `content`: Content
- `severity`: low, medium, high
- `document`: PDF file (optional)

**Roles**: gov_authority

**Used by**: Web App (Gov Dashboard)

---

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

## Error Response Format

```json
{
  "error": "Error message",
  "details": "Additional details (if available)"
}
```

---

**Note**: All timestamps are in ISO 8601 format (UTC)

**Last Updated**: December 2024
