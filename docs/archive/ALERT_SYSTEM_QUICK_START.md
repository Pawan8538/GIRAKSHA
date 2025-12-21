# ⚡ Quick Start - Test Alert System NOW

## 🎯 What You Can Do Right Now

The alert system is **fully integrated** and ready to test! Follow these simple steps.

---

## ✅ System Status Check

### Step 1: Verify All Services Running

```bash
# Check Connectivity Server (port 3000)
curl http://localhost:3000/

# Check Backend (port 4000)
curl http://localhost:4000/api/auth/profile -H "x-dev-bypass: DEV_BYPASS"

# Check Mobile App
# Should be running on Android emulator (emulator-5554)
```

### Step 2: Open Mobile App Map Screen

1. App should auto-login as Site Admin
2. Navigate to **Map Screen**
3. You should see:
   - Risk heatmap (green/yellow/orange/red cells)
   - "🌐 Live" button at top
   - Alert status (should show "Connected" in logs)

---

## 🧪 Test Scenario 1: Basic Alert (60 seconds)

### Goal: Trigger an alert by increasing rain

**Actions:**

1. **Click "🌐 Live" button** → Changes to "🎮 Manual"
2. **Click "⚙️ Weather"** button (appears after Manual mode)
3. **Increase Rain to 50mm:**
   - Tap "+" button next to Rain value 10 times
   - Watch cells in Unit-3 turn from yellow → orange → red
4. **When cells reach red (risk ≥ 0.75):**
   - **AlertModal pops up** 🚨
   - Shows "CRITICAL - EVACUATE NOW"
   - Zone: Unit-3
   - Countdown from 15 seconds

5. **Click "Acknowledge Alert"** ✓
   - Modal closes
   - Siren does NOT activate
   - Risk map stays red (danger still present)

**Result:** ✅ Alert triggered and acknowledged successfully

---

## 🧪 Test Scenario 2: Trigger Siren (80 seconds)

### Goal: Let alert timeout and activate siren

**Actions:**

1. **Toggle Manual Mode ON**
2. **Open Weather Controls**
3. **Increase Rain to 50mm**
4. **Wait for AlertModal**
5. **DO NOT CLICK ANYTHING**
6. **Wait 15 seconds...**
7. **After 15 seconds:**
   - Alert timeout occurs
   - Siren would activate on connected device
   - Modal shows "Alert timeout - Siren activated"

**Result:** ✅ Siren triggered after timeout

---

## 🧪 Test Scenario 3: Multiple Zones (100 seconds)

### Goal: Trigger alerts in multiple zones simultaneously

**Actions:**

1. **Manual Mode ON**
2. **Set extreme weather:**
   - Rain: 50mm
   - Wind: 60 km/h  
   - Temperature: 35°C
3. **All zones turn red:**
   - Unit-1: Risk 0.82 → Alert
   - Unit-2: Risk 0.79 → Alert
   - Unit-3: Risk 0.88 → Alert
   - Unit-4: Risk 0.75 → Alert
4. **Multiple alerts appear in sequence**
5. **Acknowledge each one**

**Result:** ✅ Multiple zone alerts working

---

## 📱 Alert Modal Deep Dive

When alert appears, you'll see:

```
Header (Color-coded by severity):
  🔴 CRITICAL - EVACUATE NOW      (Severity 3, Risk ≥ 0.9)
  🟠 HIGH RISK - STAY ALERT        (Severity 2, Risk 0.8-0.9)
  🟡 MEDIUM RISK - BE CAREFUL      (Severity 1, Risk 0.7-0.8)

Content:
  Zone: Unit-3
  Acknowledge in: 12s              ← Countdown timer
  
  ⚠️ Rockfall Danger Detected
  High seismic activity and unstable rock formations 
  detected in Unit-3. All field workers must be alerted 
  immediately.
  
  If no acknowledgment is received in Xs, alarm sirens 
  will activate.

Status:
  🔔 Waiting for acknowledgments from field workers...

Actions:
  [✓ Acknowledge Alert]  [Dismiss]
```

---

## 🔍 What's Happening Behind the Scenes

### When You Increase Rain:

```
Rain slider: 20 → 50mm
    ↓
RiskEngine calculates new grid
    ↓
Cells recalculate risk scores
    ↓
Example: Unit-3 cell (5,2)
  Old risk: 0.65 (yellow)
  New risk: 0.78 (red) ← DANGER!
    ↓
MapScreen updates heatmap
    ↓
AlertTriggerService.checkAndTriggerAlerts() runs
    ↓
Zone Unit-3 crosses 0.7 threshold
    ↓
Zone marked as danger zone
    ↓
Severity calculated: 0.78 → Severity 2 (High)
    ↓
Socket.IO sends alert to server
    ↓
Connectivity Server broadcasts to:
  - Field worker bands
  - Siren devices
  - Dashboard monitors
    ↓
Mobile app receives alert event
    ↓
AlertModal shows up on screen
```

---

## 🎛️ Weather Control Presets

### Safe Conditions
```
Wind: 10 km/h
Sun: 50%
Rain: 0 mm
Humidity: 60%
Temperature: 28°C
Result: All green (safe)
```

### Warning Conditions
```
Wind: 25 km/h
Sun: 20%
Rain: 15 mm
Humidity: 80%
Temperature: 32°C
Result: Mostly yellow (medium risk)
```

### Dangerous Conditions
```
Wind: 45 km/h
Sun: 10%
Rain: 35 mm
Humidity: 90%
Temperature: 24°C
Result: Mostly red (danger!) ← Use for testing
```

### Storm Preset (One-click)
- Quickly set all values to dangerous
- Click "⛈️ Storm" button in Weather Controls

---

## 🔧 Advanced: Manual Alert Trigger

You can also trigger alerts from code. In MapScreen:

```javascript
// Trigger test alert for Unit-3, Severity 3
triggerTestAlert('Unit-3', 3);

// This immediately sends to server without risk calculation
// Useful for testing without waiting for weather simulation
```

---

## 📊 Expected Behavior

### Alert Modal Timeline:

```
T+0s   AlertModal appears
         ├─ Zone name displayed
         ├─ Countdown: 15 seconds
         └─ Vibration starts
         
T+5s   Countdown: 10 seconds
       (User has time to acknowledge)

T+10s  Countdown: 5 seconds
       (Urgency increases)

T+14s  Countdown: 1 second
       (Last chance!)

T+15s  ❌ NO ACKNOWLEDGMENT
       ├─ Siren activates
       ├─ Continuous alarm
       └─ Last-resort escalation
```

### If User Acknowledges:

```
T+0s   AlertModal appears
       User sees "Acknowledge Alert" button

T+3s   User clicks "Acknowledge Alert" ✓
       ├─ Server receives ACK
       ├─ Siren cancellation sent
       ├─ Modal closes
       └─ Risk map still shows danger
```

---

## 🐛 What to Check If Something's Wrong

| Issue | Check |
|-------|-------|
| No AlertModal appears | Is connectivity server running? Check logs |
| Modal shows but doesn't count down | Check phone time sync |
| Siren doesn't activate | Ensure no device is registered as siren |
| Weather controls don't update map | Try toggling Manual mode off/on |
| Risk map doesn't change | Check RiskEngine is calculating |

---

## 💡 Tips for Testing

1. **Use Weather "Storm" preset**
   - Instantly creates dangerous conditions
   - Faster testing than manual sliders

2. **Test on Multiple Phones**
   - Install APK on 2+ devices
   - One as field worker, one as siren
   - See real multi-device alerts

3. **Monitor Dashboard**
   - Open http://localhost:3000 in browser
   - See all connected devices
   - Create alerts from dashboard
   - Watch device updates in real-time

4. **Check Server Logs**
   - Connectivity Server shows all events:
     ```
     Creating alert: S... for zone Unit-3
     Sending alert to band WORKER_001
     ACK received from WORKER_001
     Siren activated for zone Unit-3
     ```

---

## 🎉 Success Criteria

✅ **You've successfully tested the alert system when:**

- [ ] AlertModal appears when risk crosses 0.7
- [ ] Modal shows correct zone name
- [ ] Countdown timer counts down from 15s
- [ ] Acknowledging alert closes modal
- [ ] Not acknowledging (waiting 15s) triggers siren
- [ ] Multiple zones can have simultaneous alerts
- [ ] Weather changes immediately update risk map
- [ ] Connection status shows "Connected"

---

**Now go test it! The system is live and ready.** 🚀

Start with **Test Scenario 1**, then progress to 2 and 3.
