# Mobile App Integration Guide

## Overview

This guide explains how to integrate the **GeoGuard Mobile App** (from https://github.com/waggishPlayer/geoguard) with the backend API and sync with the web application.

---

## Quick Start

### 1. Prerequisites

- ✅ Backend running on port 4000
- ✅ Node.js 18+ and npm installed
- ✅ Expo CLI installed: `npm install -g expo-cli`
- ✅ Expo Go app on your phone (or emulator)

### 2. Clone Repository

```bash
git clone https://github.com/waggishPlayer/geoguard
cd geoguard
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure API URL

**Find your computer's IP address:**

**Windows:**
```bash
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

**Mac/Linux:**
```bash
ifconfig
# Look for inet address
```

**Update configuration:**

Edit `src/utils/constants.js`:

```javascript
// For physical device (recommended)
export const API_URL = 'http://192.168.1.100:4000/api'

// For Android emulator
export const API_URL = 'http://10.0.2.2:4000/api'

// For iOS simulator
export const API_URL = 'http://localhost:4000/api'
```

> **Important**: Replace `192.168.1.100` with YOUR actual IP!

### 5. Start App

```bash
npm start
```

**Run on device:**
- Scan QR code with Expo Go app
- Or press `a` for Android emulator
- Or press `i` for iOS simulator

---

## Backend Integration

### API Client

**File**: `src/services/api.js`

Configured axios instance that:
- Sets base URL from constants
- Auto-attaches JWT tokens
- Handles 401 errors (token expiration)

```javascript
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../utils/constants'

const api = axios.create({
  baseURL: API_URL,  // http://YOUR_IP:4000/api
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auto-attach token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('sih_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
```

### Service Files

All API calls go through service files:

| File | Backend Endpoint | Purpose |
|------|-----------------|---------|
| `auth.js` | `/api/auth/*` | Login, register, profile |
| `sensors.js` | `/api/sensors/*` | Sensor data |
| `ml.js` | `/api/ml/*` | ML predictions |
| `tasks.js` | `/api/tasks/*` | Task management |
| `alerts.js` | `/api/alerts/*` | Alert management |
| `complaints.js` | `/api/complaints/*` | Complaints |
| `slopes.js` | `/api/slopes/*` | Slope management |
| `govt.js` | `/api/govt/*` | Government advisories |
| `admin.js` | `/api/admin/*` | Admin functions |

---

## Authentication

### Login Flow

1. User enters credentials in `LoginScreen`
2. Call `authService.login(email, password)`
3. Backend returns JWT token and user data
4. Store in AsyncStorage:
   ```javascript
   await AsyncStorage.setItem('sih_token', token)
   await AsyncStorage.setItem('sih_user', JSON.stringify(user))
   ```
5. Navigate to home/dashboard

### Token Management

**Storage**: `AsyncStorage` (React Native's localStorage equivalent)

**Keys:**
- `sih_token` - JWT token
- `sih_user` - User object (JSON string)

**Auto-refresh**: Token sent automatically via axios interceptor

---

## Screens and Features

### Home/Dashboard

**File**: `src/screens/HomeScreen.js`

**Features**:
- Alert summary
- ML risk snapshot
- Quick actions
- Network status indicator

**API Calls**:
- `alertService.getAlerts()` → `GET /api/alerts?limit=5`
- `mlService.getRiskForecast()` → `GET /api/ml/forecast/1`

---

### Sensors

**File**: `src/screens/SensorsScreen.js`

**Features**:
- View all sensors
- Real-time sensor values
- Sensor status (active/inactive)
- Filter by slope

**API Calls**:
- `sensorService.getSensors()` → `GET /api/sensors`
- `sensorService.getSensorReadings(id)` → `GET /api/sensors/:id/readings`

**Integration with Web**:
- Same sensor data as web app
- Updates in real-time (via polling)
- Both show current values

---

### ML Features

#### ML Predict Screen

**File**: `src/screens/MLPredictScreen.js`

**Features**:
- Select slope
- Get AI risk prediction
- View feature importance
- Risk level color-coding

**API Calls**:
- `mlService.predict(data)` → `POST /api/ml/predict`

#### ML Detect (Crack Detection)

**File**: `src/screens/MLDetectScreen.js`

**Features**:
- Take photo or select from gallery
- Upload for crack detection
- AI analysis results
- Risk assessment

**API Calls**:
- `mlService.detectCracks(imageFile)` → `POST /api/ml/detect`

**Unique to Mobile**:
- ✅ Camera integration
- ✅ Photo library access
- ✅ GPS location tagging

#### ML Forecast

**File**: `src/screens/MLForecastScreen.js`

**Features**:
- 72-hour risk trend
- Interactive charts
- Weather impact data
- Current risk assessment

**API Calls**:
- `mlService.getForecast(slopeId)` → `GET /api/ml/forecast/:slopeId`

---

### Map View

**File**: `src/screens/MapScreen.js`

**Features**:
- Interactive map
- Sensor markers
- Alert locations
- Heatmap overlay
- Real-time updates

**Libraries**:
- `react-native-maps` for map display

**API Calls**:
- `sensorService.getSensors()` → `GET /api/sensors`
- `alertService.getAlerts()` → `GET /api/alerts`

---

### Complaints/Reports

**File**: `src/screens/ComplaintScreen.js`

**Features**:
- Create new complaint
- Attach photo (camera/gallery)
- GPS location tagging
- Priority selection
- View complaint status

**API Calls**:
- `complaintService.createComplaint(data)` → `POST /api/complaints`
- `complaintService.getComplaints()` → `GET /api/complaints`

**Unique to Mobile**:
- ✅ Camera access
- ✅ GPS location
- ✅ Offline queue (syncs when online)

---

### SOS Emergency

**File**: `src/screens/SosScreen.js`

**Features**:
- One-tap emergency alert
- Auto-location sharing
- Quick call to emergency contacts
- Alert history

**API Calls**:
- `alertService.createEmergencyAlert()` → `POST /api/alerts`

**Mobile-specific**: Optimized for quick access

---

### Tasks

**File**: `src/screens/TasksScreen.js`

**Features**:
- View assigned tasks
- Update task status
- Upload task photos
- Mark complete

**API Calls**:
- `taskService.getTasks()` → `GET /api/tasks`
- `taskService.updateTask(id, data)` → `PATCH /api/tasks/:id`

**Integration with Web**:
- Tasks assigned on web
- Completed on mobile
- Status syncs to web dashboard

---

### Alerts

**File**: `src/screens/AlertsScreen.js`

**Features**:
- View all alerts
- Filter by severity
- Acknowledge alerts
- Alert details

**API Calls**:
- `alertService.getAlerts()` → `GET /api/alerts`
- `alertService.acknowledgeAlert(id)` → `PATCH /api/alerts/:id/acknowledge`

**Same as Web**: Both apps show same alerts

---

## Offline Support

### Offline Queue

**File**: `src/storage/offlineQueue.js`

**Features**:
- Queue requests when offline
- Auto-sync when connection restored
- Visual indicator of queue status
- Last sync timestamp

**Queued Actions**:
- Creating complaints
- Updating task status
- Submitting reports

**How It Works**:
```javascript
// Check if online
const isOnline = await NetInfo.fetch()

if (!isOnline) {
  // Save to queue
  await offlineQueue.add({
    endpoint: '/api/complaints',
    method: 'POST',
    data: complaintData
  })
} else {
  // Send immediately
  await api.post('/api/complaints', complaintData)
}
```

---

## Web-Mobile Data Sync

### How Sync Works

```
Mobile App                    Backend                    Web App
    │                            │                           │
    ├──POST /api/alerts─────────▶│                           │
    │                            │                           │
    │                            ├─Save to Database──────────┤
    │                            │                           │
    │                            │◀──GET /api/alerts─────────┤
    │                            │                           │
    │                            ├──Return alerts──────────▶ │
    │                            │                           │
    └────────────────────────────┴───────────────────────────┘
              Both apps see same data!
```

### Example: Creating Alert

**Mobile (Field Worker)**:
```javascript
// On mobile
await alertService.createAlert({
  title: "Rock fall detected",
  severity: "high",
  location: currentLocation
})
```

**Backend processes and saves to database**

**Web (Admin)**:
```javascript
// On web - auto-refresh after 10 seconds
const alerts = await alertService.getAlerts()
// New alert appears!
```

### Sync Verification

Test that data syncs:

1. Login on both web and mobile (same user)
2. Create complaint on mobile
3. Wait 30 seconds
4. Refresh web app
5. Verify complaint appears

---

## Role-Based Features

### Field Worker
- ✅ Dashboard overview
- ✅ Map view
- ✅ Create complaints
- ✅ SOS emergency
- ✅ View tasks
- ✅ Acknowledge alerts

### Site Admin
- ✅ All Field Worker features
- ✅ View all sensors
- ✅ ML predictions
- ✅ Manage tasks
- ✅ Admin panel

### Government Authority
- ✅ Dashboard
- ✅ View alerts
- ✅ Post advisories
- ✅ View reports

### Super Admin
- ✅ All features
- ✅ User management
- ✅ System settings

---

## Permissions

The app requires these permissions:

### Camera
```javascript
import * as Camera from 'expo-camera'

const { status } = await Camera.requestCameraPermissionsAsync()
```

**Used for**: Crack detection, complaints

### Photo Library
```javascript
import * as ImagePicker from 'expo-image-picker'

const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
```

**Used for**: Selecting images for upload

### Location
```javascript
import * as Location from 'expo-location'

const { status } = await Location.requestForegroundPermissionsAsync()
```

**Used for**: Map view, SOS, complaints location tagging

---

## Testing Integration

### 1. Test Backend Connection

```javascript
// In app, check network
import { API_URL } from '../utils/constants'

console.log('API URL:', API_URL)

// Try health check
const response = await fetch(`${API_URL.replace('/api', '')}/health`)
console.log('Backend health:', await response.json())
```

### 2. Test Authentication

```javascript
// Test login
const result = await authService.login('admin@test.com', 'admin123')
console.log('Login result:', result)
```

### 3. Compare with Web

| Feature | Test Steps |
|---------|-----------|
| Sensors | 1. Open on both<br>2. Compare sensor values<br>3. Should match ±5 sec |
| Alerts | 1. View alerts on both<br>2. Should show same list |
| Tasks | 1. Check task list<br>2. Update status on mobile<br>3. Verify on web |

---

## Troubleshooting

### Can't Connect to Backend

**Error**: "Network Error"

**Solutions**:
1. ✅ Use your computer's IP, not `localhost`
2. ✅ Verify backend is running: `curl http://YOUR_IP:4000/health`
3. ✅ Same WiFi network for phone and computer
4. ✅ Firewall allows port 4000
5. ✅ Correct IP in `src/utils/constants.js`

### Token Expired

**Error**: "401 Unauthorized"

**Solutions**:
1. ✅ Clear app data and re-login
2. ✅ Check token in AsyncStorage
3. ✅ Verify backend JWT_SECRET hasn't changed

### Different Data Than Web

**Solutions**:
1. ✅ Both use same backend URL
2. ✅ Logged in as same user
3. ✅ Clear AsyncStorage on mobile
4. ✅ Clear localStorage on web
5. ✅ Restart both apps

### Camera/Location Not Working

**Solutions**:
1. ✅ Grant permissions in device settings
2. ✅ Check permission request code
3. ✅ Restart app after granting

---

## Deployment

### Build Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build
eas build --platform android --profile production
```

### Build iOS IPA

```bash
eas build --platform ios --profile production
```

### Update API URL for Production

Before building:

```javascript
// src/utils/constants.js
export const API_URL = 'https://your-backend.com/api'
```

---

## File Structure

```
mobile-app/src/
├── screens/
│   ├── LoginScreen.js           # Login
│   ├── HomeScreen.js            # Dashboard
│   ├── MapScreen.js             # Map view
│   ├── SensorsScreen.js         # Sensors
│   ├── MLPredictScreen.js       # ML predict
│   ├── MLDetectScreen.js        # Crack detection
│   ├── MLForecastScreen.js      # ML forecast
│   ├── AlertsScreen.js          # Alerts
│   ├── TasksScreen.js           # Tasks
│   ├── ComplaintScreen.js       # Complaints
│   └── SosScreen.js             # SOS
├── services/
│   ├── api.js                   # Axios instance
│   ├── auth.js                  # Auth service
│   ├── sensors.js               # Sensors service
│   ├── ml.js                    # ML service
│   └── ...
├── components/
│   ├── AlertCard.js
│   ├── MapView.js
│   └── ...
├── navigation/
│   ├── AppNavigator.js
│   └── AuthNavigator.js
├── storage/
│   └── offlineQueue.js
└── utils/
    └── constants.js             # API_URL config
```

---

## Integration Checklist

- [ ] Backend running on port 4000
- [ ] Mobile app cloned and installed
- [ ] API_URL configured with correct IP
- [ ] Can login with test credentials
- [ ] Dashboard loads with data
- [ ] Sensors screen shows data
- [ ] ML features work (crack detection, predict, forecast)
- [ ] Can create complaint
- [ ] Tasks load and can be updated
- [ ] Alerts match web app
- [ ] Data syncs with web app

---

## Further Documentation

- [Main Integration Guide](../INTEGRATION.md) - Overall architecture
- [Backend Integration](../backend/INTEGRATION.md) - Backend setup
- [Web Integration](../web-app/INTEGRATION.md) - Web app details
- [API Endpoints](../API_ENDPOINTS.md) - API reference
- [Mobile-Web Sync Guide](../MOBILE_WEB_SYNC.md) - Step-by-step sync

---

**Last Updated**: December 2024
