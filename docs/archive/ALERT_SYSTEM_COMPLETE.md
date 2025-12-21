# GeoGuard Alert System Integration - Complete Guide

## ✅ System Overview

The GeoGuard alert system now integrates **real-time danger zone detection** from the risk map with a **multi-device alert network** using WebSocket communication.

### Architecture

```
Risk Map (Mobile App)
    ↓
Risk Engine detects danger zones (risk ≥ 0.7)
    ↓
AlertTriggerService.checkAndTriggerAlerts()
    ↓
Socket.IO sends alert to server
    ↓
Connectivity Server (port 3000)
    ↓
Broadcasts to:
  ├─ Field Worker Bands (vibration + alert)
  ├─ Siren Device (activates after 15s if no ACK)
  └─ Dashboard (monitoring)
```

---

## 🚀 Running the System

### 1. Start the Connectivity Server

```bash
cd /Users/waggishplayer/geoguard/connectivity
node server.js
```

Server output:
```
🚨 Alert System Server Running
Server: http://10.0.75.150:3000
📱 Share this IP with Android phones: 10.0.75.150:3000
```

### 2. Start the GeoGuard Backend

```bash
cd /Users/waggishplayer/geoguard/backend
node src/server.js
```

### 3. Install and Run Mobile App

The APK is pre-built at:
```
mobile-app/android/app/build/outputs/apk/release/app-release.apk
```

Install on emulator/device:
```bash
adb install -r mobile-app/android/app/build/outputs/apk/release/app-release.apk
adb shell am start -n com.sih.rockfall/.MainActivity
```

---

## 🎯 How It Works

### A. Normal Operation (Risk < 0.7)

1. **Risk Map Screen** shows cells with colors:
   - 🟢 Green (Low) - Risk < 0.35
   - 🟡 Yellow (Medium) - Risk 0.35-0.60
   - 🟠 Orange (High) - Risk 0.60-0.75
   - 🔴 Red (Critical) - Risk ≥ 0.75

2. **No alerts** are triggered
3. **Alert Status**: "Disconnected" or "Connected"

### B. Danger Detection (Risk ≥ 0.7 in any cell)

1. **User adjusts weather** in Map Screen (Manual Mode):
   - Increase Rain → cells get wet → risk increases
   - Increase Wind → destabilization → risk increases
   - Increase Temperature → more thermal stress

2. **Risk crosses 0.7 threshold** in a zone:
   - Example: Unit-3 cells go from 0.65 → 0.78
   - AlertTriggerService detects this

3. **Alert triggered automatically**:
   - Calculates severity based on risk:
     - Risk 0.7-0.8 → Severity 1 (Medium)
     - Risk 0.8-0.9 → Severity 2 (High)
     - Risk ≥ 0.9 → Severity 3 (Critical)
   - Sends to Connectivity Server
   - **Mobile app shows AlertModal**

### C. Alert Modal (15-second countdown)

```
╔════════════════════════════════════╗
║ 🔴 CRITICAL - EVACUATE NOW        ║  ← Severity 3
║ Zone: Unit-3                       ║
║ Acknowledge in: 12s                ║  ← Countdown
║                                    ║
║ ⚠️ Rockfall Danger Detected        ║
║ High seismic activity in Unit-3.   ║
║ All field workers must be alerted. ║
║                                    ║
║ 🔔 Waiting for acknowledgments...  ║  ← Status
╠════════════════════════════════════╣
║  [✓ Acknowledge]  [Dismiss]       ║
╚════════════════════════════════════╝
```

**What happens:**

- **If ACKNOWLEDGED in 15 seconds:**
  - Alert modal closes
  - Siren stays OFF
  - Field workers are safe

- **If NO ACK after 15 seconds:**
  - **🚨 SIREN ACTIVATES**
  - Siren device receives alert
  - Continuous alarm until manually stopped
  - Last-resort escalation

---

## 🧪 Testing the Alert System

### Test 1: Trigger Alert via Manual Weather Control

**Steps:**

1. **Open Map Screen** in GeoGuard app
2. **Toggle "🎮 Manual" mode** (top bar)
3. **Click "⚙️ Weather" button**
4. **Increase rain to maximum** (50 mm)
5. **Watch risk map:**
   - Cells in danger zones turn red
   - Risk scores increase
   - When any cell ≥ 0.7, alert triggers

6. **AlertModal appears:**
   - Shows zone name (Unit-3)
   - Shows severity (Critical/High/Medium)
   - 15-second countdown starts

7. **Click "Acknowledge Alert":**
   - Alert is acknowledged
   - Modal closes
   - Siren doesn't activate

---

### Test 2: Trigger Siren (No Acknowledgment)

**Steps:**

1. **Follow Test 1, steps 1-5**
2. **AlertModal appears**
3. **Wait 15 seconds** without clicking anything
4. **Siren activates automatically:**
   - Siren device receives alert
   - Alarm sound plays (high-pitched tone)
   - Visual indication on dashboard

---

### Test 3: Test Multiple Zones

**Steps:**

1. **Manual Mode ON**
2. **Set high rain (40mm), high wind (50 km/h)**
3. **Watch multiple zones:**
   - Unit-1, Unit-2, Unit-3, Unit-4 all show red
   - Separate alerts for each zone
   - Siren triggered for each

---

## 📱 Connected Device Types

The system supports three types of devices:

### 1. **Field Worker Bands** (vibration alerts)
- Model: Android wearable or phone
- Alert Type: Vibration + audio notification
- Role: `band`
- Action: Can acknowledge to prevent siren

### 2. **Siren Device** (emergency alarm)
- Model: Dedicated siren box or phone
- Alert Type: Loud continuous alarm
- Role: `siren`
- Activation: After 15s with no ACK
- Control: Only manually stopped

### 3. **Dashboard** (monitoring)
- Model: Web/mobile dashboard
- Alert Type: Visual status updates
- Role: `dashboard`
- Usage: Real-time monitoring of all alerts

---

## 🔧 Configuration

### AlertTriggerService (mobile-app/src/services/AlertTriggerService.js)

```javascript
// Server URL (change for production)
serverUrl: '10.0.2.2:3000'  // Android emulator localhost
// For physical devices: use actual IP

// Risk threshold (when to trigger alert)
riskThreshold: 0.7  // (0-1)

// ACK timeout (before siren activates)
const ACK_TIMEOUT = 15000;  // milliseconds

// Monitored zones
zones: ['Unit-1', 'Unit-2', 'Unit-3', 'Unit-4']
```

### Connectivity Server (connectivity/server.js)

```javascript
const PORT = 3000;
const ACK_TIMEOUT = 15000;  // 15 seconds
```

---

## 📊 Alert Severity Levels

| Severity | Risk Score | Level | Action |
|----------|-----------|-------|--------|
| 1 | 0.70-0.79 | 🟡 Medium | Alert issued, monitoring |
| 2 | 0.80-0.89 | 🟠 High | Urgent alert, prepare evacuation |
| 3 | ≥ 0.90 | 🔴 Critical | Emergency evacuation NOW |

**Siren Activation Timeline:**
```
T+0s    → Alert sent to field workers
T+0s    → AlertModal appears in app
T+15s   → No acknowledgment received
T+15s   → Siren automatically activated
T+∞     → Continuous until manual stop
```

---

## 🔌 Device Connection Flow

### Registering a Field Worker Device

```javascript
// In worker device app
socket.emit('register', {
  role: 'band',
  zones: ['Unit-1', 'Unit-3'],
  workerId: 'WORKER_001'
});
```

### Registering a Siren Device

```javascript
// In siren device app
socket.emit('register', {
  role: 'siren',
  zones: ['Unit-1', 'Unit-2', 'Unit-3', 'Unit-4']
});
```

### Acknowledging an Alert

```javascript
// In worker device when alert received
socket.emit('ack', {
  alertId: 'S1702190512000-Unit-3',
  workerId: 'WORKER_001'
});
```

---

## 🐛 Troubleshooting

### Problem: Connectivity Server not accessible from mobile app

**Solution:**
1. Check server is running: `curl http://localhost:3000`
2. For physical devices, use local network IP:
   - Get IP: `ifconfig | grep inet`
   - Update AlertTriggerService serverUrl to actual IP

### Problem: Alerts not triggering

**Solution:**
1. Ensure risk map is calculating (check Map Screen)
2. Ensure AlertStatus shows "connected"
3. Check browser console for connection errors
4. Restart connectivity server and app

### Problem: Siren not activating

**Solution:**
1. Wait full 15 seconds without acknowledging
2. Ensure siren device is registered
3. Check server logs for siren registration

---

## 📈 Real-World Deployment

### Multiple Field Worker Devices

Install the same APK on multiple phones:
```bash
# Phone 1: Worker at Unit-1
# Phone 2: Worker at Unit-2
# Tablet: Siren device (alarm box)

# Each connects to server and registers
# Alerts broadcast to all relevant workers
```

### Production Network Setup

```
Internet
    ↓
Local Network (192.168.1.x)
    ├─ Connectivity Server (on supervisor's laptop)
    ├─ Backend Server
    └─ Field Worker Phones (WiFi connected)
```

---

## 📝 Code Files Modified

1. **mobile-app/src/services/AlertTriggerService.js** - NEW
   - Core alert trigger logic
   - Socket.IO communication
   - Danger zone detection

2. **mobile-app/src/components/AlertModal.js** - NEW
   - Alert UI component
   - 15-second countdown
   - Acknowledgment handling

3. **mobile-app/src/screens/MapScreen.js** - MODIFIED
   - Integrated AlertTriggerService
   - Added alert state management
   - Added AlertModal to render
   - Added alert status badge

---

## ✨ Features Implemented

✅ Automatic danger zone detection from risk map
✅ Real-time alerts to multiple devices via WebSocket
✅ 15-second acknowledgment countdown
✅ Automatic siren activation if no ACK
✅ Risk-based severity calculation
✅ Multiple zone support (Unit-1 to Unit-4)
✅ Alert status indicator in UI
✅ Manual alert trigger for testing
✅ Visual and haptic feedback

---

## 🎓 Next Steps

1. **Test with multiple phones:**
   - Install on 3+ Android devices
   - One as field worker, one as siren

2. **Integrate actual alarm sound:**
   - Connectivity Server can trigger native audio

3. **Add persistent storage:**
   - Save alert history
   - Generate incident reports

4. **Mobile app enhancements:**
   - Show acknowledged workers list
   - Alert history timeline
   - Zone-specific notes

---

**System Ready for Field Testing! 🚀**
