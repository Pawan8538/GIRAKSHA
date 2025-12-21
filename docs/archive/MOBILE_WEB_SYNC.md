# Mobile-Web Integration Guide

## Step-by-Step Integration

This guide helps you integrate the **GeoGuard Mobile App** (https://github.com/waggishPlayer/geoguard) with your **updated Web App**.

---

## Prerequisites

✅ Backend server running on port 4000  
✅ PostgreSQL database configured  
✅ Web app updated and functional  
✅ Node.js and npm installed  
✅ Expo CLI installed (for mobile)

---

## Part 1: Backend Configuration

### 1.1 Verify Backend is Running

```bash
cd backend
npm run dev
```

**Check**: Visit http://localhost:4000/health

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-09T10:00:00Z"
}
```

### 1.2 Test API Endpoints

Verify key endpoints work:

```bash
# Test login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'

# Test sensors (requires token)
curl http://localhost:4000/api/sensors \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Part 2: Mobile App Setup

### 2.1 Clone Mobile App Repository

```bash
# Navigate to your projects directory
cd d:/SIH-8DEC

# Clone the mobile app
git clone https://github.com/waggishPlayer/geoguard mobile-app-geoguard

cd mobile-app-geoguard
```

### 2.2 Install Dependencies

```bash
npm install
```

**Installing**:
- React Native core
- Expo SDK
- Navigation libraries
- UI components
- API client (axios)

### 2.3 Configure API URL

**Find your computer's IP address:**

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" address

**Update API URL:**

Edit `src/utils/constants.js`:

```javascript
// For physical device (recommended)
export const API_URL = 'http://192.168.1.100:4000/api'

// For Android emulator
export const API_URL = 'http://10.0.2.2:4000/api'

// For iOS simulator
export const API_URL = 'http://localhost:4000/api'
```

> ⚠️ **Important**: Replace `192.168.1.100` with YOUR actual IP address!

### 2.4 Start Mobile App

```bash
npm start
```

This opens Expo DevTools in your browser.

**Options:**
- Press `a` - Run on Android emulator
- Press `i` - Run on iOS simulator (Mac only)
- Scan QR code with Expo Go app on your phone

---

## Part 3: Testing Integration

### 3.1 Test Login (Mobile)

1. Open mobile app
2. Enter credentials from web app
3. Tap "Login"
4. Should redirect to dashboard

**Sample credentials:**
```
Email: admin@test.com
Password: admin123
```

### 3.2 Verify Data Sync

**Compare data between web and mobile:**

| Feature | Web URL | Mobile Screen | Should Match |
|---------|---------|---------------|--------------|
| Sensors | `/dashboard/sensors` | "Sensors" tab | ✅ Sensor list |
| Alerts | `/dashboard/alerts` | "Alerts" tab | ✅ Alert list |
| Tasks | `/dashboard/tasks` | "Tasks" tab | ✅ Task list |
| Profile | `/dashboard/profile` | "Profile" tab | ✅ User info |

### 3.3 Test Real-time Updates

1. **Open web app** → Navigate to Sensors
2. **Open mobile app** → Go to Sensors screen
3. **Wait 30 seconds** (auto-refresh interval)
4. **Verify**: Both show same sensor values (±5 seconds)

### 3.4 Test Create Operations

**Create a complaint (Mobile → Web):**

1. **Mobile**: Go to "Reports" → Create complaint
2. **Web**: Go to `/dashboard/complaints`
3. **Verify**: New complaint appears in web dashboard

---

## Part 4: File Integration

### 4.1 Shared Backend Files

These files serve both apps:

```
backend/src/
├── routes/
│   ├── auth.routes.js       ✅ Shared
│   ├── sensors.routes.js    ✅ Shared
│   ├── alerts.routes.js     ✅ Shared
│   ├── ml.routes.js         ✅ Shared
│   ├── tasks.routes.js      ✅ Shared
│   └── complaints.routes.js ✅ Shared
```

### 4.2 Web App Integration Files

```
web-app/
├── services/
│   ├── authService.js       → Calls /api/auth/*
│   ├── sensorService.js     → Calls /api/sensors/*
│   ├── mlService.js         → Calls /api/ml/*
│   └── taskService.js       → Calls /api/tasks/*
```

### 4.3 Mobile App Integration Files

```
mobile-app/src/
├── services/
│   ├── api.js               → Axios instance (API_URL)
│   ├── auth.js              → Calls /api/auth/*
│   ├── sensors.js           → Calls /api/sensors/*
│   ├── ml.js                → Calls /api/ml/*
│   └── tasks.js             → Calls /api/tasks/*
```

---

## Part 5: Common Integration Scenarios

### 5.1 Add New Feature to Both Apps

**Example: Add "Mine List" feature**

**Step 1: Backend** (Add route)
```javascript
// backend/src/routes/mines.routes.js
router.get('/', minesController.getAllMines)
```

**Step 2: Web App** (Add service)
```javascript
// web-app/services/mineService.js
export const getMines = async () => {
  const response = await axios.get('/mines')
  return response.data
}
```

**Step 3: Mobile App** (Add service)
```javascript
// mobile-app/src/services/mines.js
import api from './api'

export const getMines = async () => {
  const response = await api.get('/mines')
  return response.data
}
```

### 5.2 Sync User Sessions

Both apps use JWT tokens:

**Web Storage:**
```javascript
localStorage.setItem('token', token)
```

**Mobile Storage:**
```javascript
AsyncStorage.setItem('sih_token', token)
```

**To test same user:**
1. Login on web → Copy token from localStorage
2. Login on mobile with same credentials
3. Both tokens should have same user data

---

## Part 6: Deployment

### 6.1 Backend Deployment

**Option 1: Render.com** (Recommended)
```yaml
# render.yaml
services:
  - type: web
    name: geoguard-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
```

**Option 2: Railway.app**
- Connect GitHub repo
- Select backend directory
- Auto-deploys on push

### 6.2 Update API URLs After Deployment

**After deploying backend, update:**

**Web App:**
```javascript
// web-app/services/authService.js (and all service files)
const API_URL = 'https://your-backend.render.com/api'
```

**Mobile App:**
```javascript
// mobile-app/src/utils/constants.js
export const API_URL = 'https://your-backend.render.com/api'
```

### 6.3 Mobile App Deployment

**Build Android APK:**
```bash
eas build --platform android
```

**Build iOS IPA:**
```bash
eas build --platform ios
```

---

## Part 7: Troubleshooting

### Issue 1: Mobile Can't Connect to Backend

**Symptoms:**
- "Network Error" on mobile
- Requests timeout

**Solutions:**
1. ✅ Verify backend is running: `curl http://localhost:4000/health`
2. ✅ Use IP address, not `localhost` in API_URL
3. ✅ Check firewall allows port 4000
4. ✅ Ensure mobile and computer on same WiFi

**Test connection:**
```bash
# On mobile browser, visit:
http://YOUR_IP:4000/health
```

### Issue 2: Different Data on Web vs Mobile

**Symptoms:**
- Web shows 10 sensors, mobile shows 5
- Alerts don't match

**Solutions:**
1. ✅ Verify both use same backend URL
2. ✅ Check logged in as same user
3. ✅ Clear cache on both apps
4. ✅ Refresh both apps simultaneously

### Issue 3: Token Expired Errors

**Symptoms:**
- 401 Unauthorized after some time

**Solutions:**
1. ✅ Re-login on affected app
2. ✅ Check JWT_SECRET in backend .env
3. ✅ Verify token expiration time is configured

### Issue 4: CORS Errors

**Symptoms:**
- "CORS policy" errors in browser console

**Solutions:**
Backend already has CORS enabled. If issue persists:

```javascript
// backend/src/app.js
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.1.100:3000'],
  credentials: true
}))
```

---

## Part 8: Development Workflow

### Daily Development

**Morning Setup:**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Web App
cd web-app
npm run dev

# Terminal 3: Mobile App
cd mobile-app
npm start
```

**Verify all running:**
- Backend: http://localhost:4000/health
- Web App: http://localhost:3000
- Mobile: Expo DevTools at http://localhost:19002

### Making Changes

**When updating an API endpoint:**
1. ✅ Update backend route first
2. ✅ Test with curl/Postman
3. ✅ Update web service
4. ✅ Update mobile service
5. ✅ Test both apps

---

## Part 9: Key Differences

### Web App Features
- Full admin dashboard
- Detailed charts and analytics
- Multi-column layouts
- Keyboard shortcuts

### Mobile App Features
- Camera integration (crack detection)
- GPS location (complaints, SOS)
- Offline queue
- Push notifications
- Touch-optimized UI

### Shared Features
- Authentication
- Sensor monitoring
- Alert management
- Task management
- ML predictions
- Profile management

---

## Quick Reference

### Port Numbers
| Service | Port |
|---------|------|
| Backend API | 4000 |
| Web App | 3000 |
| ML Service | 5000 |
| PostgreSQL | 5432 |
| Expo DevTools | 19002 |

### Important Files
| Purpose | Web App | Mobile App |
|---------|---------|------------|
| API Config | Service files | `src/utils/constants.js` |
| Auth | `services/authService.js` | `src/services/auth.js` |
| API Client | axios directly | `src/services/api.js` |
| Token Storage | localStorage | AsyncStorage |

---

## Next Steps

After successful integration:

1. ✅ Test all features on both platforms
2. ✅ Set up production backend
3. ✅ Update API URLs for production
4. ✅ Build mobile app for distribution
5. ✅ Deploy web app to hosting
6. ✅ Configure environment variables
7. ✅ Set up monitoring and logging

---

**For more details:**
- Main Integration Guide: [INTEGRATION.md](./INTEGRATION.md)
- API Documentation: [API_ENDPOINTS.md](./API_ENDPOINTS.md)
- Backend Setup: [backend/README.md](./backend/README.md)
- Web App Setup: [web-app/README.md](./web-app/README.md)
- Mobile App Setup: [mobile-app/README.md](./mobile-app/README.md)

---

**Last Updated**: December 2024  
**Version**: 1.0.0
