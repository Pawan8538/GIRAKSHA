# GeoGuard Integration Guide

## Overview

This guide explains how to integrate the **GeoGuard Web Application** (Next.js) with the **GeoGuard Mobile Application** (React Native - [waggishPlayer/geoguard](https://github.com/waggishPlayer/geoguard)) using the shared backend API.

## Architecture

```
┌─────────────────┐
│   Web App       │
│   (Next.js)     │
│   Port: 3000    │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐      ┌─────────────────┐
│   Backend API   │◄─────┤   Mobile App    │
│   (Express)     │      │  (React Native) │
│   Port: 4000    │      │   (Expo)        │
└────────┬────────┘      └─────────────────┘
         │
         │
┌────────▼────────┐
│   PostgreSQL    │
│   Database      │
└─────────────────┘
```

## Quick Start

### 1. Backend Setup (Required First)

```bash
cd backend
npm install
npm run dev  # Runs on port 4000
```

### 2. Web App Setup

```bash
cd web-app
npm install
npm run dev  # Runs on port 3000
```

### 3. Mobile App Setup

```bash
# Clone mobile app repository
git clone https://github.com/waggishPlayer/geoguard
cd geoguard

# Install dependencies
npm install

# Update API URL in constants
# Edit: src/utils/constants.js
# Set: export const API_URL = 'http://YOUR_IP:4000/api'

# Start mobile app
npm start
```

## Shared Backend API

Both web and mobile apps use the **same backend API** at `http://localhost:4000/api`

### Configuration Files

| Component | Configuration File | API URL Variable |
|-----------|-------------------|------------------|
| Web App | `web-app/services/*.js` | `http://localhost:4000/api` |
| Mobile App | `mobile-app/src/utils/constants.js` | `API_URL` constant |
| Backend | `backend/.env` | `PORT=4000` |

## Key Integration Points

### 1. Authentication
- **Endpoint**: `POST /api/auth/login`
- **Used by**: Both web and mobile
- **Token Storage**:
  - Web: `localStorage` (via AuthContext)
  - Mobile: `AsyncStorage`
- **Implementation**:
  - Web: `web-app/services/authService.js`
  - Mobile: `mobile-app/src/services/auth.js`

### 2. Sensors
- **Endpoints**: 
  - `GET /api/sensors` - All sensors
  - `GET /api/sensors/:id` - Single sensor
  - `GET /api/sensors/:id/readings` - Sensor history
- **Used by**: Both web and mobile
- **Features**:
  - Real-time data (5-second simulation)
  - Historical readings
  - Sensor status monitoring

### 3. Alerts
- **Endpoints**:
  - `GET /api/alerts` - List alerts
  - `POST /api/alerts` - Create alert
  - `PATCH /api/alerts/:id/acknowledge` - Acknowledge alert
- **Used by**: Both web and mobile
- **Role-based access**: Different views per user role

### 4. ML Features
- **Endpoints**:
  - `POST /api/ml/predict` - Risk prediction
  - `POST /api/ml/detect` - Crack detection
  - `GET /api/ml/forecast/:slopeId` - 72-hour forecast
- **Used by**: Both web and mobile
- **Requirements**: ML service must be running

### 5. Tasks
- **Endpoints**:
  - `GET /api/tasks` - List tasks
  - `PATCH /api/tasks/:id` - Update task
- **Used by**: Both web and mobile
- **Role-based**: Admins assign, workers complete

## Role-Based Features

### Super Admin
- **Web**: Full dashboard, user management, system settings
- **Mobile**: All features + admin panel

### Site Admin
- **Web**: Sensors, ML analytics, task management
- **Mobile**: All Field Worker features + admin tools

### Government Authority
- **Web**: Advisories, alerts, reports
- **Mobile**: View-only dashboard + advisories

### Field Worker
- **Web**: Limited (redirected to mobile)
- **Mobile**: SOS, complaints, tasks, map view

## Data Synchronization

### Real-time Updates
Both apps receive real-time updates via:
- **Polling**: Web app polls every 5-30 seconds
- **WebSocket**: Available for real-time notifications (optional)

### Offline Support
- **Mobile**: Offline queue with auto-sync
- **Web**: Online-only (requires connection)

## File Structure References

### Backend Routes
```
backend/src/routes/
├── auth.routes.js       # Authentication
├── sensors.routes.js    # Sensor data
├── alerts.routes.js     # Alert management
├── ml.routes.js         # ML predictions
├── tasks.routes.js      # Task management
├── admin.routes.js      # Admin functions
├── govt.routes.js       # Government features
├── complaints.routes.js # Complaints
└── notifications.routes.js # Notifications
```

### Web App Services
```
web-app/services/
├── authService.js       # Authentication
├── sensorService.js     # Sensor data
├── mlService.js         # ML features
├── taskService.js       # Tasks
├── dashboardService.js  # Dashboard data
├── complaintService.js  # Complaints
└── messageService.js    # Messages
```

### Mobile App Services
```
mobile-app/src/services/
├── api.js               # Axios instance
├── auth.js              # Authentication
├── sensors.js           # Sensor data
├── ml.js                # ML features
├── tasks.js             # Tasks
├── alerts.js            # Alerts
├── complaints.js        # Complaints
└── govt.js              # Government features
```

## Environment Variables

### Backend (.env)
```env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=geoguard
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
ML_SERVICE_URL=http://localhost:5000
```

### Web App
No separate .env needed - API URL hardcoded in service files as `http://localhost:4000/api`

### Mobile App
```javascript
// src/utils/constants.js
export const API_URL = 'http://YOUR_COMPUTER_IP:4000/api'
// For physical devices, use your computer's IP
// For emulator, use 10.0.2.2 (Android) or localhost (iOS)
```

## Testing Integration

### 1. Test Backend
```bash
# Check health endpoint
curl http://localhost:4000/health

# Test login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password"}'
```

### 2. Test Web App
1. Open http://localhost:3000
2. Login with test credentials
3. Navigate to /dashboard/sensors
4. Verify sensor data loads

### 3. Test Mobile App
1. Update API_URL with your computer's IP
2. Run `npm start`
3. Open in Expo Go app
4. Login with same credentials
5. Verify data matches web app

## Common Issues

### Mobile App Can't Connect
- **Problem**: Network Error when fetching data
- **Solution**: 
  1. Use your computer's local IP, not `localhost`
  2. Find IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
  3. Update `API_URL` in `mobile-app/src/utils/constants.js`
  4. Ensure backend is running
  5. Check firewall allows port 4000

### CORS Errors
- **Problem**: Web app or mobile app gets CORS error
- **Solution**: Backend already has CORS enabled in `backend/src/app.js`

### Token Expiration
- **Problem**: 401 Unauthorized errors
- **Solution**: 
  - Web: Clear localStorage and re-login
  - Mobile: Clear app data and re-login
  - Check JWT_SECRET is same across restarts

### Data Not Syncing
- **Problem**: Web shows different data than mobile
- **Solution**:
  1. Both apps use same backend - check API_URL
  2. Clear cache on both apps
  3. Verify same user logged in
  4. Check database has latest data

## API Documentation

For detailed API endpoint documentation, see [API_ENDPOINTS.md](./API_ENDPOINTS.md)

## Mobile-Web Sync Guide

For step-by-step integration instructions, see [MOBILE_WEB_SYNC.md](./MOBILE_WEB_SYNC.md)

## Related Documentation

- [Backend README](./backend/README.md) - Backend setup and API details
- [Web App README](./web-app/README.md) - Web application setup
- [Mobile App README](./mobile-app/README.md) - Mobile app setup
- [Project Status Report](./PROJECT_STATUS_REPORT.txt) - Current implementation status

## Support

For issues or questions:
1. Check existing documentation
2. Review backend logs for errors
3. Test API endpoints directly with curl/Postman
4. Verify all services are running

---

**Last Updated**: December 2024  
**Version**: 1.0.0
