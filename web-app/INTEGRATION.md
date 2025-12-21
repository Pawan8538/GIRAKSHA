# Web App Integration Guide

## Overview

This guide explains how the **GeoGuard Web Application** integrates with the backend API and how it can work alongside the mobile application.

---

## Quick Start

### 1. Prerequisites

- ✅ Backend running on port 4000
- ✅ PostgreSQL database configured
- ✅ Node.js 18+ installed

### 2. Installation

```bash
cd web-app
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

**Access**: http://localhost:3000

---

## Backend Integration

### API Configuration

The web app connects to the backend via service files in `services/` directory.

**Base URL**: `http://localhost:4000/api`

Each service file uses axios to call backend endpoints:

```javascript
// Example: services/authService.js
import axios from 'axios'

const API_URL = 'http://localhost:4000/api'

export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password
  })
  return response.data
}
```

### Service Files

| File | Backend Endpoint | Purpose |
|------|-----------------|---------|
| `authService.js` | `/api/auth/*` | Authentication, user profile |
| `sensorService.js` | `/api/sensors/*` | Sensor data, readings |
| `mlService.js` | `/api/ml/*` | ML predictions, forecasts |
| `taskService.js` | `/api/tasks/*` | Task management |
| `dashboardService.js` | `/api/dashboard/*` | Dashboard stats |
| `complaintService.js` | `/api/complaints/*` | Complaint management |
| `mineService.js` | `/api/mines/*` | Mine management |
| `messageService.js` | `/api/messages/*` | Messaging |

---

## Authentication

### Login Flow

1. User enters credentials on `/login` page
2. `authService.login()` calls `POST /api/auth/login`
3. Backend returns JWT token
4. Token stored in `localStorage`
5. User redirected to `/dashboard`

### AuthContext

**File**: `contexts/AuthContext.js`

Provides authentication state throughout the app:

```javascript
const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  
  // Login, logout, check auth
  // ...
}
```

### Protected Routes

All `/dashboard/*` routes are protected:

```javascript
// app/dashboard/layout.js
export default function DashboardLayout({ children }) {
  const { user } = useAuth()
  
  if (!user) {
    redirect('/login')
  }
  
  return <>{children}</>
}
```

---

## Pages and Features

### Dashboard (`/dashboard`)

**File**: `app/dashboard/page.js`

**Features**:
- Overview statistics
- Recent alerts
- Sensor status
- Quick actions

**API Calls**:
- `dashboardService.getStats()` → `GET /api/dashboard/stats`
- `sensorService.getSensors()` → `GET /api/sensors`
- `alertService.getAlerts()` → `GET /api/alerts?limit=5`

---

### Sensors (`/dashboard/sensors`)

**File**: `app/dashboard/sensors/page.js`

**Features**:
- Real-time sensor data
- Auto-refresh every 5 seconds
- Sensor status indicators
- Filter by slope

**API Calls**:
- `sensorService.getSensorsByMine(mineId)` → `GET /api/sensors?slope_id=X`

**Integration with Mobile**:
- Both apps show **same sensor data**
- Mobile can view sensors, web can view + manage
- Data syncs via shared backend

---

### ML Features (`/dashboard/ml/*`)

#### Risk Forecast (`/dashboard/ml/forecast`)

**File**: `app/dashboard/ml/forecast/page.js`

**Features**:
- 72-hour risk prediction
- Weather integration (Open-Meteo API)
- Risk trend charts
- Base vs Enhanced risk

**API Calls**:
- `mlService.getRiskForecast(slopeId)` → `GET /api/ml/forecast/:slopeId`

#### Crack Detection (`/dashboard/ml/detect`)

**File**: `app/dashboard/ml/detect/page.js`

**Features**:
- Image upload for crack detection
- AI-powered analysis
- Risk assessment

**API Calls**:
- `mlService.detectCracks(imageFile)` → `POST /api/ml/detect`

#### Manual Prediction (`/dashboard/ml/predict`)

**File**: `app/dashboard/ml/predict/page.js`

**Features**:
- Input sensor values manually
- Get instant risk prediction
- Feature importance visualization

**API Calls**:
- `mlService.predict(data)` → `POST /api/ml/predict`

---

### Alerts (`/dashboard/alerts`)

**File**: `app/dashboard/alerts/page.js`

**Features**:
- View all alerts
- Filter by severity
- Acknowledge alerts
- Role-based visibility

**API Calls**:
- `alertService.getAlerts()` → `GET /api/alerts`
- `alertService.acknowledgeAlert(id)` → `PATCH /api/alerts/:id/acknowledge`

**Integration with Mobile**:
- Same alerts shown on mobile
- Both can acknowledge alerts
- Changes sync immediately via backend

---

### Tasks (`/dashboard/tasks`)

**File**: `app/dashboard/tasks/page.js`

**Features**:
- View assigned tasks
- Update task status
- Admin can create tasks

**API Calls**:
- `taskService.getTasks()` → `GET /api/tasks`
- `taskService.updateTask(id, data)` → `PATCH /api/tasks/:id`

**Mobile Integration**:
- Field workers complete tasks on mobile
- Admins assign tasks on web
- Status updates sync across platforms

---

### Profile (`/dashboard/profile`)

**File**: `app/dashboard/profile/page.js`

**Features**:
- View user information
- Update name, phone
- Change password

**API Calls**:
- `authService.getMe()` → `GET /api/auth/me`
- `authService.updateProfile(data)` → `PATCH /api/auth/me`

---

## Components

### Navbar

**File**: `components/Navbar.js`

**Features**:
- Ministry of Mines branding
- SIH logo
- Notifications bell
- User menu

**API Calls**:
- `notificationService.getNotifications()` → `GET /api/notifications`

---

### Sidebar

**File**: `components/Sidebar.js`

**Features**:
- Role-based navigation
- Active route highlighting
- Collapsible on mobile

**Role-based Menu**:
- **Super Admin**: All options
- **Site Admin**: Dashboard, Sensors, ML, Alerts, Tasks, Profile
- **Gov Authority**: Dashboard, Alerts, Advisories, Profile

---

## Real-Time Updates

### Auto-Refresh

Pages auto-refresh data at intervals:

```javascript
useEffect(() => {
  const interval = setInterval(() => {
    loadSensors()
  }, 5000) // 5 seconds
  
  return () => clearInterval(interval)
}, [])
```

**Pages with auto-refresh**:
- Sensors: 5 seconds
- Alerts: 10 seconds
- Dashboard: 30 seconds

---

## Mobile-Web Data Sync

### How It Works

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│ Web App  │────────▶│ Backend  │◀────────│Mobile App│
└──────────┘         └──────────┘         └──────────┘
     │                     │                     │
     │                     │                     │
     └─────── Same Data ───┴───── Same Data ────┘
```

Both apps:
1. Call same backend API
2. Use same authentication (JWT)
3. See same data in real-time
4. Changes made in one appear in the other

### Example: Creating an Alert

**Mobile App**:
```javascript
// Mobile creates alert
await alertService.createAlert({
  title: "High Risk",
  severity: "high",
  slope_id: 1
})
```

**Backend**:
```javascript
// Saves to database
INSERT INTO alerts (title, severity, slope_id)
```

**Web App**:
```javascript
// Auto-refresh after 10 seconds
// Fetches alerts from backend
const alerts = await alertService.getAlerts()
// New alert appears!
```

---

## Environment Configuration

### Development

No configuration needed - API URL is hardcoded in service files:

```javascript
const API_URL = 'http://localhost:4000/api'
```

### Production

Update all service files to use production backend:

```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-backend.com/api'
```

Then set environment variable:

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

---

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
NEXT_PUBLIC_API_URL=https://your-backend.com/api
```

### Deploy to Netlify

```bash
# Build command
npm run build

# Publish directory
out/

# Environment variables
NEXT_PUBLIC_API_URL=https://your-backend.com/api
```

---

## Troubleshooting

### API Connection Failed

**Problem**: Network errors when loading data

**Solutions**:
1. ✅ Verify backend is running: `curl http://localhost:4000/health`
2. ✅ Check API_URL in service files
3. ✅ Check browser console for CORS errors
4. ✅ Verify JWT token is valid

### Data Not Loading

**Problem**: Pages show loading state forever

**Solutions**:
1. ✅ Open browser DevTools → Network tab
2. ✅ Check API request status codes
3. ✅ Verify backend endpoints are working
4. ✅ Check authentication token in localStorage

### Different Data Than Mobile

**Problem**: Web shows different data than mobile app

**Solutions**:
1. ✅ Both should use same backend URL
2. ✅ Verify logged in as same user
3. ✅ Clear browser cache and localStorage
4. ✅ Refresh both apps simultaneously

---

## Testing Integration

### Test with Mobile App

1. **Start backend**: `cd backend && npm run dev`
2. **Start web app**: `cd web-app && npm run dev`
3. **Start mobile app**: `cd mobile-app && npm start`
4. **Login on both** with same credentials
5. **Compare data**:
   - Sensors should match
   - Alerts should match
   - Tasks should match
6. **Test sync**:
   - Create alert on mobile
   - Wait 10 seconds
   - Verify appears on web

---

## File Structure

```
web-app/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.js          # Login page
│   ├── dashboard/
│   │   ├── page.js              # Dashboard
│   │   ├── sensors/
│   │   │   └── page.js          # Sensors page
│   │   ├── ml/
│   │   │   ├── forecast/
│   │   │   ├── detect/
│   │   │   └── predict/
│   │   ├── alerts/
│   │   ├── tasks/
│   │   └── profile/
│   └── layout.js                # Root layout
├── components/
│   ├── Navbar.js                # Top navigation
│   ├── Sidebar.js               # Side navigation
│   └── ...
├── services/
│   ├── authService.js           # Auth API calls
│   ├── sensorService.js         # Sensor API calls
│   ├── mlService.js             # ML API calls
│   └── ...
├── contexts/
│   └── AuthContext.js           # Auth state
└── package.json
```

---

## Integration Checklist

- [ ] Backend running on port 4000
- [ ] Database configured and seeded
- [ ] Web app installed (`npm install`)
- [ ] Can login at `/login`
- [ ] Dashboard loads with data
- [ ] Sensors page shows real-time data
- [ ] ML features work (requires ML service)
- [ ] Alerts can be viewed and acknowledged
- [ ] Profile page works
- [ ] Mobile app can connect to same backend
- [ ] Data syncs between web and mobile

---

## Further Documentation

- [Main Integration Guide](../INTEGRATION.md) - Overall architecture
- [Backend Integration](../backend/INTEGRATION.md) - Backend setup
- [API Endpoints](../API_ENDPOINTS.md) - API documentation
- [Mobile-Web Sync](../MOBILE_WEB_SYNC.md) - Step-by-step sync guide

---

**Last Updated**: December 2024
