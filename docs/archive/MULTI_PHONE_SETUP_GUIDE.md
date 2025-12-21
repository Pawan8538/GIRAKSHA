# 🚀 Multi-Phone Setup Guide - Alert System Deployment

## 📱 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│ PHONE 1 (Connected via USB)                                 │
│ ├─ Main App (GeoGuard Site Admin)                           │
│ ├─ Risk Map Control                                          │
│ ├─ Connectivity Server (runs on port 3000)                  │
│ ├─ WiFi Hotspot enabled                                      │
│ └─ IP: 192.168.1.100 (or from Settings)                     │
└─────────────────────────────────────────────────────────────┘
            ↓ WiFi Hotspot
    ┌───────┴───────┐
    ↓               ↓
┌──────────────┐  ┌──────────────┐
│ PHONE 2      │  │ PHONE 3      │
│ Field Worker │  │ Siren Device │
│ Connects to: │  │ Connects to: │
│ 192.168.1.100│  │ 192.168.1.100│
│ :3000        │  │ :3000        │
└──────────────┘  └──────────────┘
```

---

## 🎯 Step-by-Step Setup

### STEP 1: Enable WiFi Hotspot on Phone 1

**On Phone 1 (Main App):**

1. Go to **Settings → Network & Internet**
2. Tap **Hotspot & Tethering**
3. Turn on **WiFi Hotspot**
4. Note the network name (SSID) and password
5. Tap **Hotspot settings** → Find your **IP Address**
   - Usually: `192.168.1.x` or similar
   - Write it down!

---

### STEP 2: Connect Phone 2 & 3 to Hotspot

**On Phone 2 (Field Worker) and Phone 3 (Siren):**

1. Go to **Settings → WiFi**
2. Select the hotspot network from Phone 1
3. Enter the password
4. Wait for "Connected" status
5. Test: Open browser → Try `http://192.168.1.100:3000`
   - Should see "Alert System Dashboard"

---

### STEP 3: Install GeoGuard App on All Phones

**On all three phones:**

```bash
adb install -r mobile-app/android/app/build/outputs/apk/release/app-release.apk
```

Or copy APK to each phone manually.

---

### STEP 4: Configure Device Roles

#### **PHONE 1 Configuration (Main App)**

1. **Open GeoGuard App**
2. Navigate to **Settings → Alert System Setup**
3. **Select Device Role:** "Main App (Server Host)"
4. **Tap "Save Settings"**

#### **PHONE 2 Configuration (Field Worker)**

1. **Open GeoGuard App**
2. Navigate to **Settings → Alert System Setup**
3. **Select Device Role:** "Field Worker"
4. **Server IP:** Enter Phone 1's IP (e.g., `192.168.1.100`)
5. **Server Port:** `3000`
6. **Worker ID:** Give this worker a unique name
   - Examples: `WORKER_01`, `ALI`, `WORKER_UNIT1`
7. **Monitored Zones:** Select which zones they monitor
   - Examples: `Unit-1, Unit-2` (for unit-specific workers)
   - Or: `Unit-1, Unit-2, Unit-3, Unit-4` (for all zones)
8. **Tap "Save Settings"**

#### **PHONE 3 Configuration (Siren)**

1. **Open GeoGuard App**
2. Navigate to **Settings → Alert System Setup**
3. **Select Device Role:** "Siren Device"
4. **Server IP:** Enter Phone 1's IP (e.g., `192.168.1.100`)
5. **Server Port:** `3000`
6. **Monitored Zones:** 
   - `Unit-1, Unit-2, Unit-3, Unit-4` (triggers for any zone)
7. **Tap "Save Settings"**

---

## ✅ Verification Checklist

### Before Testing:

- [ ] Phone 1 WiFi Hotspot enabled
- [ ] Phone 2 connected to hotspot
- [ ] Phone 3 connected to hotspot
- [ ] All three phones have IP connectivity
  - Test: `ping 192.168.1.100` from Phones 2 & 3
- [ ] GeoGuard app installed on all phones
- [ ] Device roles configured on all phones
- [ ] Connection status shows "Connected" in each app

### Network Connectivity Test:

**From Phone 2 (Field Worker):**
1. Open browser
2. Navigate to: `http://192.168.1.100:3000`
3. Should see: "Alert System Dashboard"

**From Phone 3 (Siren):**
1. Open browser
2. Navigate to: `http://192.168.1.100:3000`
3. Should see: "Alert System Dashboard"

---

## 🧪 Testing Workflow

### Test Sequence:

**1. Open Map Screen on Phone 1**
   - View the risk heatmap
   - Verify "Alert Status" shows "Connected"

**2. Watch Field Worker (Phone 2)**
   - Should show "Waiting for alerts..."
   - Status should be "Connected"

**3. Watch Siren Device (Phone 3)**
   - Should show "Waiting for alerts..."
   - Status should be "Connected"

**4. Trigger Alert on Phone 1**
   - Toggle to "🎮 Manual" mode
   - Click "⚙️ Weather"
   - Increase rain to 50mm
   - Watch risk map turn red

**5. Alert Modal Appears on Phone 1**
   - Shows zone name
   - Shows 15-second countdown

**6. Phone 2 (Field Worker) Receives Alert**
   - Alert notification appears
   - Can tap "Acknowledge Alert"

**7. Phone 3 (Siren) Waiting**
   - Countdown on dashboard
   - If no ACK in 15 seconds → Alarm sound activates

---

## 🎛️ Device Roles Detailed

### Role 1: Main App (Phone 1)

**Responsibilities:**
- Runs connectivity server on port 3000
- Controls risk map via weather simulation
- Displays all connected devices on dashboard
- Broadcasts alerts to field workers and siren

**What it does:**
- Monitor risk changes
- Detect danger zones automatically
- Create alerts with severity levels
- Track acknowledgments

**UI Features:**
- Risk map heatmap
- Manual weather controls
- Alert status badge
- Danger zones indicator

---

### Role 2: Field Worker (Phone 2)

**Responsibilities:**
- Receives alerts from server
- Can acknowledge alerts
- Prevents siren activation by acknowledging

**What it does:**
- Listens for incoming alerts
- Shows alert notification
- Allows worker to acknowledge
- Confirms acknowledgment sent to server

**UI Features:**
- Alert modal
- Acknowledgment button
- Connection status
- Worker ID display

---

### Role 3: Siren Device (Phone 3)

**Responsibilities:**
- Receives alert escalation after timeout
- Activates alarm sound continuously
- Only stops when manually disabled

**What it does:**
- Waits for 15-second timeout
- Activates alarm sound when timeout occurs
- Displays alert info on screen
- Can be manually silenced

**UI Features:**
- Siren status indicator
- Alarm control button
- Alert info display
- Connection status

---

## 📊 Alert Flow Timing

```
T+0s    Risk map shows red cell (risk ≥ 0.7)
        ├─ Alert created with severity
        ├─ Socket.IO broadcasts to all devices
        └─ All connected phones receive alert

T+0s    Phone 1 (Main): AlertModal appears
T+0s    Phone 2 (Field Worker): Alert notification
T+0s    Phone 3 (Siren): Alert received, countdown starts

T+5s    Phone 2 Worker sees: "Acknowledge in 10s"
T+5s    Phone 3 Siren: "Siren in 10s..."

T+10s   Phone 2: "Acknowledge in 5s"
T+10s   Phone 3: "Siren in 5s!"

T+13s   Worker taps "Acknowledge Alert" ✓
        ├─ Acknowledgment sent to server
        ├─ Server cancels siren
        └─ Phone 3 stops countdown

T+13s   Phone 1: Alert marked as acknowledged
T+13s   Phone 3: "Alert acknowledged by WORKER_02"
T+13s   Siren: DOES NOT activate (crisis averted!)

---OR---

T+15s   NO acknowledgment received
T+15s   Timeout triggers escalation
T+15s   Server sends "siren" command to Phone 3

T+15s   Phone 3: 🚨 ALARM SOUND STARTS
        ├─ Continuous high-pitched tone
        ├─ Red screen indicator
        └─ Requires manual stop

T+∞     Siren continues until manually stopped
```

---

## 🐛 Troubleshooting

### Problem: Phones Can't Connect to Each Other

**Symptoms:**
- "Connection Failed" in app
- Can't access `http://192.168.1.100:3000` from other phones

**Solutions:**
1. **Check hotspot is on:**
   - Phone 1: Settings → Hotspot is "ON"
2. **Verify IP address:**
   - Get correct IP from Phone 1's Settings
   - Update Phone 2 & 3 settings
3. **Check firewall:**
   - Some phones have built-in firewall
   - May need to disable or allow port 3000
4. **Restart devices:**
   - Turn hotspot off/on
   - Restart all apps

---

### Problem: Alert Doesn't Appear on Field Worker

**Symptoms:**
- Risk map shows red on Phone 1
- Phone 2 doesn't receive alert

**Solutions:**
1. **Check connection:**
   - Phone 2 should show "Connected" status
   - Test: Can you browse to server IP?
2. **Verify device role:**
   - Ensure Phone 2 is set to "Field Worker"
   - Check zones are selected
3. **Check zones match:**
   - Alert created for Unit-3
   - Phone 2 monitors Unit-3
   - If Phone 2 only monitors Unit-1, won't receive Unit-3 alert
4. **Restart app:**
   - Close and reopen GeoGuard on Phone 2

---

### Problem: Siren Doesn't Activate

**Symptoms:**
- Alert times out
- No alarm sound on Phone 3

**Solutions:**
1. **Wait full 15 seconds:**
   - Alarm only activates after 15 seconds
   - Make sure you're not clicking anything
2. **Check volume:**
   - Phone 3 volume not muted
   - System sounds enabled in Settings
3. **Verify siren role:**
   - Ensure Phone 3 is set to "Siren Device"
   - Check zones include the danger zone
4. **Check server logs:**
   - Server should show "Siren activation" in logs

---

## 📋 Field Deployment Checklist

Before deploying to actual mine:

- [ ] All three phones on same hotspot
- [ ] IP addresses configured in apps
- [ ] Device roles assigned correctly
- [ ] Each role tested individually
- [ ] Multi-device alert tested
- [ ] Acknowledgment tested
- [ ] Siren activation tested
- [ ] Siren deactivation tested
- [ ] Multiple alerts tested
- [ ] Worker IDs clearly marked on devices
- [ ] Hotspot password secure
- [ ] Backup phones available
- [ ] Charging cables available
- [ ] Team trained on procedures

---

## 🎯 Quick Test Commands

### From Phone 2 Terminal:
```bash
# Test server connectivity
ping 192.168.1.100

# Check if server is running
curl http://192.168.1.100:3000/
```

### From Phone 1 Terminal:
```bash
# View connected devices
curl http://localhost:3000/

# Check server status
adb logcat | grep "Alert System"
```

---

## 🔒 Security Notes

**For Field Deployment:**

1. **Hotspot Password:**
   - Use strong password
   - Change after deployment
   - Don't share unnecessarily

2. **Device Security:**
   - Lock devices when not in use
   - Don't leave phones unattended
   - Report lost/stolen devices immediately

3. **Alert Tampering:**
   - Only authorized workers should have access
   - Verify worker IDs in system
   - Log all alert acknowledgments

---

## 📞 Support

If something doesn't work:

1. **Check connection:**
   - `ping 192.168.1.100` from other phones
   - Open browser to `http://192.168.1.100:3000`

2. **Check logs:**
   - Terminal on each device
   - Look for error messages

3. **Restart sequence:**
   - Restart Phone 1 (server)
   - Restart Phone 2 & 3
   - Relaunch apps

4. **Reset settings:**
   - Go to Alert Settings
   - Reconfigure all values
   - Save and restart

---

**You're ready for field deployment! 🚀**

Test locally first, then deploy to the mine with confidence.
