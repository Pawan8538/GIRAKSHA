# GeoGuard Alert System Integration

## Overview
The GeoGuard mobile app has been integrated with a real-time alert system that monitors the risk map and automatically triggers alerts when danger zones are detected. The system uses Socket.IO for real-time communication with an alert server that coordinates with field worker devices and siren systems.

## System Architecture

### Components
1. **AlertTriggerService** (`mobile-app/src/services/AlertTriggerService.js`)
   - Monitors risk map data
   - Detects danger zones (risk score >= 0.7)
   - Triggers alerts via Socket.IO
   - Handles acknowledgments from field workers
   - Manages siren activation/cancellation

2. **AlertModal** (`mobile-app/src/components/AlertModal.js`)
   - Visual alert display with severity levels
   - Haptic feedback (vibration) during alerts
   - Countdown timer for acknowledgment (15 seconds)
   - Three severity levels:
     - 🔴 Critical (risk >= 0.9)
     - 🟠 High (risk >= 0.8)
     - 🟡 Medium (risk < 0.8)

3. **MapScreen Integration** (`mobile-app/src/screens/MapScreen.js`)
   - Initializes alert system on screen load
   - Monitors risk grid changes
   - Displays alert modal when alerts are triggered
   - Shows active danger zones badge
   - Sends acknowledgments to alert system

4. **Connectivity Server** (`connectivity/server.js`)
   - WebSocket server running on port 3000
   - Manages connected clients (bands, sirens, dashboards)
   - Tracks active alerts with 15-second timeout
   - Auto-triggers siren if no acknowledgment received
   - Real-time device status dashboard

## How It Works

### Normal Flow (Risk Map Update → Alert)
1. Weather conditions change in MapScreen (manual or live)
2. RiskEngine recalculates risk grid
3. AlertTriggerService.checkAndTriggerAlerts() runs
4. If any cell in a zone reaches risk >= 0.7:
   - Alert is created and sent via Socket.IO
   - All field workers in that zone receive alert
   - AlertModal appears on their screens
   - 15-second countdown starts

### Acknowledgment Flow
1. Field worker clicks "Acknowledge Alert" button
2. AlertTriggerService.acknowledgeAlert() sends ACK to server
3. Server receives ACK from field worker
4. Siren devices receive cancel command
5. AlertModal shows "Alert acknowledged"

### Siren Activation Flow (If No Acknowledgment)
1. 15 seconds pass with no acknowledgment
2. Alert system server triggers siren devices
3. Phones with siren mode activated play loud alarm
4. 📢 SIREN message appears on all devices
5. Workers must acknowledge to stop siren

## Integration Details

### Danger Zones Configuration
The system divides the mine into 4 zones based on grid coordinates:

```
Unit-1: Rows 0-2, Cols 0-2     (Top-Left)
Unit-2: Rows 0-2, Cols 3-5     (Top-Right)
Unit-3: Rows 3-5, Cols 0-2     (Bottom-Left)
Unit-4: Rows 3-5, Cols 3-5     (Bottom-Right)
```

Each zone is monitored independently.

### Risk Threshold
- **Default Threshold**: 0.7 (70%)
- Configurable in AlertTriggerService constructor
- Based on combined static and dynamic risk scores

### Severity Calculation
```javascript
riskScore >= 0.9  → Severity 3 (Critical) - RED
riskScore >= 0.8  → Severity 2 (High)     - ORANGE
riskScore <  0.8  → Severity 1 (Medium)   - YELLOW
```

## Server Connection

### Connection URL
- **Development (Emulator)**: `http://10.0.2.2:3000`
- **Real Devices**: `http://DEVICE_IP:3000`

The AlertTriggerService defaults to emulator address. Update if using real devices:

```javascript
const serverUrl = 'YOUR_DEVICE_IP:3000';
```

### Socket.IO Events

**Client → Server:**
- `register`: Register as worker, siren, or dashboard
- `createAlert`: Create manual alert
- `ack`: Send acknowledgment for alert
- `createScenario`: Create earthquake scenario

**Server → Client:**
- `alert`: Incoming alert for zone
- `siren`: Siren activation command
- `sirenCancel`: Siren cancellation command
- `deviceUpdate`: Device count update
- `log`: Server log entry

## Starting the System

### 1. Start Connectivity Server
```bash
cd /Users/waggishplayer/geoguard/connectivity
npm start
```
Server will output:
```
🚨 Alert System Server Running
Server: http://10.0.75.150:3000
```

### 2. Build and Run Mobile App
```bash
cd /Users/waggishplayer/geoguard/mobile-app/android
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home ./gradlew assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
adb shell am start -n com.sih.rockfall/.MainActivity
```

### 3. Navigate to Map Screen
1. Login to app (uses dev bypass)
2. Navigate to Dashboard
3. Go to Map screen
4. Alert system will auto-connect

## Testing

### Manual Alert Trigger
In MapScreen, manually trigger an alert:
```javascript
triggerTestAlert('Unit-3', 3);  // Zone, Severity
```

### Weather Control Method
1. Enable Manual Mode (🎮 button)
2. Adjust weather parameters:
   - 💨 Wind Speed: Increase to 45+ km/h
   - 🌧️ Rain: Increase to 35+ mm/h
   - ☀️ Sun: Decrease to < 20%
3. This will increase risk scores
4. When risk >= 0.7 in a zone, alert triggers

### Test Workflow
1. Start connectivity server
2. Start mobile app on emulator
3. Navigate to Map
4. Enable Manual mode
5. Trigger "⛈️ Storm" preset
6. Watch risk scores increase
7. See alerts trigger automatically
8. Acknowledge alert in modal

## Files Modified

### Mobile App Changes
1. `src/services/AlertTriggerService.js` - NEW: Alert monitoring and triggering
2. `src/components/AlertModal.js` - NEW: Alert UI component
3. `src/screens/MapScreen.js` - UPDATED: Alert system integration

### Backend Changes
1. `src/controllers/auth.controller.js` - UPDATED: Handle RLS errors gracefully in `/auth/workers` endpoint
2. `.env` - UPDATED: Fixed database URL to current Supabase instance

## Features

### ✅ Implemented
- Real-time danger zone detection
- Automatic alert triggering
- Field worker acknowledgment system
- Siren activation after timeout
- Visual alert modal with severity indicators
- Haptic feedback (vibration)
- Countdown timer
- Active danger zones badge
- Connection status tracking
- Manual alert testing

### 🔜 Future Enhancements
- Persistent alert history
- Multi-language support
- Advanced siren control (volume, duration)
- Alert priority levels
- Worker location integration
- SMS/Email notifications
- API for external alert sources

## Troubleshooting

### Alert System Not Connecting
1. Check if connectivity server is running: `ps aux | grep "node server.js"`
2. Verify IP address is correct
3. Check firewall allows port 3000
4. Look at app console logs for connection errors

### Alerts Not Triggering
1. Verify risk threshold is being reached
2. Check MapScreen console for checkAndTriggerAlerts output
3. Enable Manual mode and use Storm preset to test
4. Verify dangerZones configuration matches your mine layout

### Siren Not Activating
1. Ensure 15 seconds pass without acknowledgment
2. Check if siren device is connected and registered
3. Verify siren device has microphone permissions
4. Check connectivity server logs for siren registration

## Production Deployment

For production use:

1. **Use HTTPS**: Update Socket.IO configuration for secure WebSocket
2. **Database Integration**: Store alerts in Supabase for persistence
3. **Redundancy**: Run multiple alert servers with failover
4. **Monitoring**: Add logging and metrics collection
5. **Testing**: Conduct full system tests with multiple devices
6. **Documentation**: Train all field workers on alert system
7. **Emergency Protocols**: Establish clear procedures for different alert severities

## Contact & Support

For issues or questions about the alert system integration, refer to:
- AlertTriggerService documentation
- Connectivity server README
- AlertModal component comments
