# GeoGuard Alert System Integration

## Complete Integration Package

This folder contains all files needed to integrate the alert system into your GeoGuard React Native app.

---

## 📁 What's Included

```
geoguard-alert-integration/
├── android/                       # Native Android code
│   └── app/src/main/java/com/geoguard/alertsystem/
│       ├── AlertSystemModule.kt   # React Native bridge
│       └── AlertSystemPackage.kt  # Package registration
├── src/
│   ├── bridges/
│   │   └── AlertSystemBridge.js   # JavaScript interface
│   ├── screens/
│   │   └── WorkerBandScreen.js    # Worker alert UI
│   └── services/
│       └── RockfallAlertService.js # Auto-trigger service
└── INTEGRATION_STEPS.md           # This file
```

---

## 🚀 Integration Steps

### Step 1: Copy Native Android Files

```bash
# From: connectivity/geoguard-alert-integration/
# To: your GeoGuard app

# 1. Copy alert system Kotlin code
cp -r ../AlertSystemApp/app/src/main/java/com/alertsystem \
   /Users/waggishplayer/geoguard/android/app/src/main/java/

# 2. Copy alert system integration modules
cp -r android/app/src/main/java/com/geoguard/alertsystem \
   /Users/waggishplayer/geoguard/android/app/src/main/java/com/geoguard/
```

### Step 2: Register Native Module

Edit `/Users/waggishplayer/geoguard/android/app/src/main/java/com/geoguard/MainApplication.kt` (or .java):

```kotlin
import com.geoguard.alertsystem.AlertSystemPackage  // ADD THIS

class MainApplication : Application(), ReactApplication {
    override fun getPackages(): List<ReactPackage> {
        return PackageList(this).packages.apply {
            add(AlertSystemPackage())  // ADD THIS LINE
        }
    }
}
```

### Step 3: Copy JavaScript Files

```bash
# Copy JavaScript bridge and screens
cp -r src/* /Users/waggishplayer/geoguard/src/
```

### Step 4: Update Android Manifest

Add to `/Users/waggishplayer/geoguard/android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Step 5: Integrate with Rockfall Prediction

In your rockfall prediction code, add:

```javascript
import RockfallAlertService from './services/RockfallAlertService';

// Initialize once when app starts
const alertService = new RockfallAlertService(
  '10.0.75.150:3000',  // Your server IP
  ['Unit-1', 'Unit-2', 'Unit-3'],  // Mine zones
  0.8  // 80% risk threshold
);

await alertService.initialize();

// When ML model makes prediction:
async function onRockfallPredicted(prediction) {
  // prediction = { risk: 0.85, zone: 'Unit-3', sensorData: {...} }
  
  const alert = await alertService.processPrediction(prediction);
  
  if (alert) {
    console.log('Alert auto-triggered:', alert);
    // Update UI to show alert was sent
  }
}
```

---

## 💡 Usage Examples

### Example 1: Auto-Trigger Alerts from ML

```javascript
// In your prediction screen/component
import { useEffect } from 'react';
import RockfallAlertService from '../services/RockfallAlertService';

const alertService = new RockfallAlertService('10.0.75.150:3000', zones);

useEffect(() => {
  alertService.initialize();
  return () => alertService.cleanup();
}, []);

// When you get ML prediction:
const handlePrediction = async (mlOutput) => {
  const prediction = {
    risk: mlOutput.riskScore,  // 0-1
    zone: mlOutput.detectedZone,
    sensorData: mlOutput.raw
  };

  // Automatically creates alert if risk >= 80%
  await alertService.processPrediction(prediction);
};
```

### Example 2: Worker Band Mode

Add to your GeoGuard navigation:

```javascript
import WorkerBandScreen from './screens/WorkerBandScreen';

// In your navigator
<Stack.Screen 
  name="WorkerBand" 
  component={WorkerBandScreen}
  initialParams={{
    workerId: 'worker1',
    zones: ['Unit-1', 'Unit-2', 'Unit-3'],
    serverUrl: '10.0.75.150:3000'
  }}
/>
```

### Example 3: Manual Alert Button

```javascript
import AlertSystemBridge from './bridges/AlertSystemBridge';

const DashboardScreen = () => {
  const createEmergencyAlert = async () => {
    await AlertSystemBridge.createAlert('Unit-3', 3, {
      source: 'MANUAL_EMERGENCY',
      triggeredBy: currentUser.id
    });
  };

  return (
    <TouchableOpacity onPress={createEmergencyAlert}>
      <Text>🚨 Emergency Alert</Text>
    </TouchableOpacity>
  );
};
```

---

## 🔧 Build & Test

### Rebuild Android App

```bash
cd /Users/waggishplayer/geoguard

# Clean build
cd android && ./gradlew clean

# Build debug APK
cd .. && npx react-native run-android
```

### Test Integration

1. **Test connection:**
   ```javascript
   const status = await AlertSystemBridge.getConnectionStatus();
   console.log('Connected:', status.connected);
   ```

2. **Test manual alert:**
   ```javascript
   await AlertSystemBridge.createAlert('Unit-3', 2);
   // Worker phones should vibrate
   ```

3. **Test auto-trigger:**
   ```javascript
   const prediction = { risk: 0.85, zone: 'Unit-3', sensorData: {} };
   await alertService.processPrediction(prediction);
   // Should create alert because 0.85 >= 0.8
   ```

---

## 📊 Data Flow

```
GeoGuard App
    ↓
Sensors → ML Model → Rockfall Prediction
                           ↓
                     { risk: 0.87, zone: 'Unit-3' }
                           ↓
              [RockfallAlertService]
                     if risk >= 0.8
                           ↓
             [AlertSystemBridge.createAlert]
                           ↓
           [Native AlertSystemModule]
                           ↓
        [SocketManager → Backend → Workers]
                           ↓
              Worker phones vibrate!
```

---

## 🎯 Key Features

✅ **Auto-trigger:** Rockfall risk ≥ 80% → automatic alert  
✅ **Vibration:** 3-pulse pattern based on severity  
✅ **ACK tracking:** 15-second countdown, escalates if no ACK  
✅ **Siren mode:** Audio alerts for supervisors  
✅ **Real-time:** Socket.IO for instant communication  
✅ **Worker history:** Track all alerts and ACKs  

---

## ⚠️ Important Notes

1. **Server IP:** Update `10.0.75.150:3000` to your actual server IP
2. **Risk Threshold:** Currently 80%, change in `RockfallAlertService` constructor
3. **Zones:** Match your mine zone names exactly
4. **Worker IDs:** Must be unique per device

---

## 🆘 Troubleshooting

**Build fails:**
- Make sure you copied all files from `AlertSystemApp/app/src/main/java/com/alertsystem`
- Check package names match (`com.geoguard`)
- Run `cd android && ./gradlew clean`

**Alerts not triggering:**
- Check risk threshold (must be ≥ 0.8)
- Verify server connection
- Check console logs for errors

**Vibration not working:**
- Some devices don't support vibration
- App will show visual alerts instead

---

## 📞 Next Steps

1. Copy all files to GeoGuard app
2. Register native module in MainApplication
3. Test with sample prediction: `{ risk: 0.9, zone: 'Unit-3' }`
4. Deploy to worker devices

**Ready to integrate!** 🚀
