# Backend Integration Guide

## Overview

The GeoGuard backend serves **both** the Next.js web application and React Native mobile application through a unified REST API.

---

## Architecture

```
┌──────────────┐         ┌──────────────┐
│   Web App    │         │  Mobile App  │
│  (Next.js)   │         │(React Native)│
└──────┬───────┘         └──────┬───────┘
       │                        │
       │  HTTP/REST             │  HTTP/REST
       │                        │
       └────────┬───────────────┘
                │
         ┌──────▼──────┐
         │   Backend   │
         │  (Express)  │
         │  Port 4000  │
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │ PostgreSQL  │
         │  Database   │
         └─────────────┘
```

---

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
# Server
PORT=4000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=geoguard
DB_USER=postgres
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# ML Service
ML_SERVICE_URL=http://localhost:5000

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# CORS (for development)
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000
```

### 3. Initialize Database

```bash
# Run database schema
psql -U postgres -d geoguard -f ../database/schema.sql

# Or via backend script
npm run db:setup
```

### 4. Start Server

```bash
npm run dev  # Development mode with nodemon
# or
npm start    # Production mode
```

**Server starts on:** http://localhost:4000

---

## API Routes

### Authentication (`/api/auth`)

**File**: `src/routes/auth.routes.js`

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/me` - Update profile
- `PATCH /api/auth/password` - Change password

**Used by**: Web App (Login, Profile), Mobile App (All Auth)

---

### Sensors (`/api/sensors`)

**File**: `src/routes/sensors.routes.js`

- `GET /api/sensors` - List all sensors (with optional slope filter)
- `GET /api/sensors/:id` - Get single sensor
- `POST /api/sensors` - Create sensor (admin only)
- `POST /api/sensors/:id/readings` - Add sensor reading
- `GET /api/sensors/:id/readings` - Get sensor history

**Used by**: Web App (Sensors Page), Mobile App (Sensors Screen)

**Real-time**: Sensor simulator runs every 5 seconds via `sensorSimulator.js`

---

### Alerts (`/api/alerts`)

**File**: `src/routes/alerts.routes.js`

- `GET /api/alerts` - List alerts (filtered by role)
- `GET /api/alerts/:id` - Get single alert
- `POST /api/alerts` - Create alert (admin/ML service)
- `PATCH /api/alerts/:id/acknowledge` - Acknowledge alert
- `DELETE /api/alerts/:id` - Delete alert (admin only)

**Used by**: Web App (Alerts Page), Mobile App (Alerts Screen)

---

### ML Features (`/api/ml`)

**File**: `src/routes/ml.routes.js`

- `POST /api/ml/predict` - Risk prediction
- `POST /api/ml/detect` - Crack detection (image upload)
- `GET /api/ml/forecast/:slopeId` - 72-hour forecast
- `GET /api/ml/heatmap/:mineId` - Heatmap data

**Used by**: Web App (ML Pages), Mobile App (ML Features)

**Requires**: Python ML service running on port 5000

---

### Tasks (`/api/tasks`)

**File**: `src/routes/tasks.routes.js`

- `GET /api/tasks` - List tasks (filtered by user role)
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create task (admin only)
- `PATCH /api/tasks/:id` - Update task status
- `DELETE /api/tasks/:id` - Delete task (admin only)

**Used by**: Web App (Tasks Page), Mobile App (Tasks Screen)

---

### Complaints (`/api/complaints`)

**File**: `src/routes/complaints.routes.js`

- `GET /api/complaints` - List complaints
- `POST /api/complaints` - Create complaint (with image upload)
- `PATCH /api/complaints/:id` - Update complaint status

**Used by**: Web App (Admin View), Mobile App (Field Workers)

---

### Admin (`/api/admin`)

**File**: `src/routes/admin.routes.js`

- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PATCH /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/stats` - System statistics

**Used by**: Web App (Admin Panel), Mobile App (Admin Screen)

**Access**: super_admin, site_admin only

---

### Government (`/api/govt`)

**File**: `src/routes/govt.routes.js`

- `GET /api/govt/advisories` - List advisories
- `POST /api/govt/advisories` - Create advisory (with PDF upload)

**Used by**: Web App (Gov Dashboard), Mobile App (Gov Screen)

**Access**: gov_authority role

---

### Notifications (`/api/notifications`)

**File**: `src/routes/notifications.routes.js`

- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `POST /api/notifications` - Create notification (system)

**Used by**: Web App (Navbar), Mobile App (Notifications)

---

## Database Schema

### Key Tables

**users** - User accounts and roles
```sql
id, name, email, password_hash, role, department, phone, is_active
```

**sensors** - Sensor devices
```sql
id, slope_id, name, sensor_type, unit, location, is_active, last_seen
```

**sensor_readings** - Time-series sensor data
```sql
id, sensor_id, time, value, status
```

**alerts** - Safety alerts
```sql
id, title, message, severity, alert_type, slope_id, acknowledged, created_at
```

**tasks** - Work assignments
```sql
id, title, description, assigned_to, assigned_by, status, priority, due_date
```

**Full schema**: See `database/schema.sql`

---

## Authentication

### JWT Token Flow

1. User logs in via `/api/auth/login`
2. Backend validates credentials
3. Backend generates JWT token
4. Client stores token:
   - **Web**: `localStorage.setItem('token', token)`
   - **Mobile**: `AsyncStorage.setItem('sih_token', token)`
5. Client sends token in subsequent requests:
   ```
   Authorization: Bearer <token>
   ```
6. Backend validates token via middleware

### Middleware

**File**: `src/middleware/auth.js`

```javascript
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
```

---

## Role-Based Access

### Roles

- **super_admin** - Full system access
- **site_admin** - Mine management, sensors, tasks
- **gov_authority** - View reports, post advisories
- **field_worker** - Submit complaints, complete tasks

### Middleware

**File**: `src/middleware/roles.js`

```javascript
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}
```

---

## File Uploads

### Configuration

- **Directory**: `./uploads/`
- **Max Size**: 10MB
- **Allowed Types**: Images (JPEG, PNG), PDFs
- **Library**: `multer`

### Upload Endpoints

- `/api/ml/detect` - Image for crack detection
- `/api/complaints` - Complaint images
- `/api/govt/advisories` - Advisory PDFs

**File**: `src/middleware/upload.js`

---

## Real-Time Features

### Sensor Simulation

**File**: `src/services/sensorSimulator.js`

- Runs every 5 seconds
- Generates realistic sensor values
- Inserts into `sensor_readings` table
- Sensor types: displacement, pore_pressure, tilt, vibration, seismic, rain_gauge

### WebSocket (Optional)

**File**: `src/server.js`

```javascript
io.on('connection', (socket) => {
  console.log('Client connected')
  
  // Emit sensor updates
  socket.on('subscribe:sensors', (slopeId) => {
    socket.join(`slope:${slopeId}`)
  })
})
```

---

## Development

### Running Server

```bash
# Install dependencies
npm install

# Development with auto-reload
npm run dev

# Production
npm start
```

### Testing API

**Using cURL:**
```bash
# Health check
curl http://localhost:4000/health

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'

# Get sensors (with token)
curl http://localhost:4000/api/sensors \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Using Postman:**
1. Import collection from `backend/postman/`
2. Set environment variable `BASE_URL=http://localhost:4000/api`
3. Run tests

---

## Integration Points

### Web App Integration

**Service Files**: `web-app/services/*.js`

Each service file imports axios and calls backend:

```javascript
// web-app/services/sensorService.js
import axios from 'axios'

const API_URL = 'http://localhost:4000/api'

export const getSensors = async () => {
  const response = await axios.get(`${API_URL}/sensors`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  })
  return response.data
}
```

### Mobile App Integration

**API Client**: `mobile-app/src/services/api.js`

Axios instance with interceptors:

```javascript
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../utils/constants'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000
})

// Auto-attach token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('sih_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

---

## Deployment

### Environment Variables

**Production .env:**
```env
NODE_ENV=production
PORT=4000
DB_HOST=your-db-host.com
DB_SSL=true
JWT_SECRET=strong_random_secret
ALLOWED_ORIGINS=https://your-web-app.com
```

### Deployment Platforms

**Render.com:**
```yaml
# render.yaml
services:
  - type: web
    name: geoguard-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

**Railway.app:**
- Connect GitHub repository
- Auto-detects Node.js
- Add environment variables in dashboard

---

## Monitoring

### Health Check

`GET /health`

```json
{
  "status": "healthy",
  "timestamp": "2024-12-09T10:00:00Z",
  "database": "connected",
  "services": {
    "ml": "available",
    "sensors": "active"
  }
}
```

### Logging

**File**: `src/utils/logger.js`

Uses Winston for structured logging:
- Logs to console in development
- Logs to files in production
- Includes request/response logging

---

## Troubleshooting

### Port Already in Use
```bash
# Find process on port 4000
lsof -i :4000  # Mac/Linux
netstat -ano | findstr :4000  # Windows

# Kill process
kill -9 <PID>
```

### Database Connection Failed
- Verify PostgreSQL is running
- Check credentials in .env
- Test connection: `psql -U postgres -d geoguard`

### CORS Errors
- Add client URL to `ALLOWED_ORIGINS` in .env
- Restart backend server

---

## Further Documentation

- [INTEGRATION.md](../INTEGRATION.md) - Overall integration guide
- [API_ENDPOINTS.md](../API_ENDPOINTS.md) - Detailed API documentation
- [MOBILE_WEB_SYNC.md](../MOBILE_WEB_SYNC.md) - Step-by-step sync guide

---

**Last Updated**: December 2024
