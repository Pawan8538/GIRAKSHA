# ✅ READY TO BUILD - Step-by-Step Guide

## Current Status
✅ All code complete and ready  
✅ Alarm sound generated (`app/src/main/res/raw/alarm_sound.mp3`)  
✅ Gradle wrapper configured  
⚠️ Need Android Studio to build APK (Android SDK required)

---

## 🎯 Your Next Steps (Choose One Option)

### **OPTION 1: Build with Android Studio (Recommended - 10 minutes)**

#### Step 1: Install Android Studio
1. Download from: https://developer.android.com/studio
2. Install and open Android Studio
3. Follow initial setup (download SDK, etc.)

#### Step 2: Open Project
1. Android Studio → **Open** (or **File → Open**)
2. Navigate to: `/Users/waggishplayer/connectivity/AlertSystemApp`
3. Click **Open**
4. Wait for Gradle sync (may take 2-5 minutes first time)
5. If prompted to update Gradle or SDK, click **OK**

#### Step 3: Build APK
1. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait for "BUILD SUCCESSFUL" (bottom right)
3. Click "**locate**" in the notification
4. APK is at: `app/build/outputs/apk/debug/app-debug.apk`

#### Step 4: Copy APK to Desktop
```bash
cp app/build/outputs/apk/debug/app-debug.apk ~/Desktop/
```

---

### **OPTION 2: I Have Android SDK Already**

If you have Android SDK installed:

```bash
cd /Users/waggishplayer/connectivity/AlertSystemApp

# Build
./gradlew assembleDebug

# APK will be at:
# app/build/outputs/apk/debug/app-debug.apk
```

---

## 📱 After You Have the APK (app-debug.apk)

### Part 1: Setup Hotspot Phone

1. **Take one spare phone** (won't run the app)
2. Create hotspot:
   - Android: Settings → Network → Hotspot & tethering → Wi-Fi hotspot → ON
   - iOS: Settings → Personal Hotspot → ON
3. **Note the hotspot name and password**
4. **Keep this phone on and charging**

### Part 2: Connect Laptop to Hotspot

1. On your Mac: Click Wi-Fi icon → Select the hotspot
2. Enter password
3. Find laptop IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
4. **Write down the IP** (e.g., `172.20.10.2` or `192.168.43.x`)

### Part 3: Start Your Server

```bash
cd /Users/waggishplayer/connectivity
node server.js
# Should show: "Server running on port 3000"
```

### Part 4: Send APK to Phones

**From your Mac:**

```bash
# Copy APK to Desktop for easy sharing
cp app/build/outputs/apk/debug/app-debug.apk ~/Desktop/

# Then share via:
# - AirDrop to each phone
# - Email to yourself, open on each phone
# - Upload to Google Drive, download on phones
```

### Part 5: Install on Each Phone

On **each phone** (need 2-3 phones):

1. Download/receive `app-debug.apk`
2. Tap the APK file
3. If prompted: Allow installation from this source
4. Tap **Install**
5. Open the app

### Part 6: Connect Phones to Hotspot

On **all app phones**:
1. Settings → Wi-Fi
2. Connect to the **hotspot** (from Part 1)
3. Enter password
4. Wait until connected

### Part 7: Configure Each Phone

**Use the laptop IP from Part 2** (e.g., `172.20.10.2:3000`)

#### Phone 1 - Worker 1:
```
Role: ⚪ Worker (Band)
Server IP: 172.20.10.2:3000  ← YOUR laptop IP
Zones: Unit-1,Unit-2,Unit-3
Worker ID: worker1
[Connect]
→ Should see: 🟢 Connected
```

#### Phone 2 - Worker 2:
```
Role: ⚪ Worker (Band)
Server IP: 172.20.10.2:3000  ← SAME laptop IP
Zones: Unit-1,Unit-2,Unit-3
Worker ID: worker2  ← Different ID
[Connect]
```

#### Phone 3 - Siren:
```
Role: ⚪ Siren
Server IP: 172.20.10.2:3000  ← SAME laptop IP
Zones: Unit-1,Unit-2,Unit-3
[Connect]
→ Press "Enable Audio"
→ Press "Test Alarm" to verify
→ Set phone volume to MAX
```

### Part 8: Test the Demo

1. **On your laptop browser**, go to: `http://172.20.10.2:3000`
2. **Create an alert** for `Unit-3`
3. **Expected results:**
   - ✅ Both Worker phones vibrate (3 pulses)
   - ✅ Alert cards appear with countdown
   - ✅ Press ACK on Worker 1 → vibration stops
   - ✅ Let Worker 2 timeout → Siren phone plays alarm
   - ✅ Stop siren from dashboard → alarm stops

---

## 📋 Quick Checklist

```
Hardware:
□ 1 phone for hotspot (or use laptop hotspot)
□ 2-3 phones for app (Workers + Siren)
□ Laptop with Node.js server

Files:
□ app-debug.apk built (via Android Studio)
□ Server code ready

Network:
□ Hotspot created
□ Laptop connected to hotspot
□ Laptop IP noted: _______________
□ Server running on :3000

App Setup:
□ APK installed on all phones
□ All phones connected to same hotspot
□ Each phone configured with laptop IP
□ Siren: Audio enabled + tested

Demo:
□ Test alert flow works
□ Vibration working (or visual fallback)
□ Siren audio playing
□ Ready to present!
```

---

## 🆘 Troubleshooting

**"Can't build in Android Studio"**
- Update Android Studio to latest version
- Accept SDK license in Tools → SDK Manager
- Update Gradle if prompted

**"Connection Failed" in app**
- Check laptop IP (run `ifconfig` again)
- Make sure `:3000` port is included
- Test in phone browser: `http://172.20.10.2:3000`

**"No vibration"**
- Some phones don't support it
- App will show visual alerts instead
- This is expected and okay for demo

**"No alarm sound"**
- Press "Enable Audio" on Siren phone
- Check phone volume is HIGH
- Use "Test Alarm" button

---

## 📞 Ready to Go!

Once you've built the APK and followed these steps, you'll have a fully working demo showing:
- ✅ LoRa 9600 baud transmission indicators
- ✅ Worker Band vibration + ACK flow  
- ✅ Siren escalation on NO-ACK
- ✅ Real-time socket communication

**The app is complete and ready to build!**
