# Alert System Android App

A native Android application for demonstrating earthquake alert system behavior over local WiFi hotspot networks. This app replicates the exact user experience of production LoRa-based Worker Bands and Siren devices.

## Quick Start

### Prerequisites
- Android phones (min Android 8.0 / API 26)
- Laptop with Node.js server running on port 3000
- WiFi hotspot created from laptop

### Installation
1. Download `AlertSystemApp-debug.apk` to your phone
2. Enable "Install from Unknown Sources" in Settings
3. Install the APK

### Configuration
1. **Create hotspot** on your laptop (WiFi tethering)
2. **Find laptop IP address:**
   - macOS: Open Terminal → `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Windows: Open CMD → `ipconfig`
   - Look for WiFi/hotspot IP (usually 192.168.x.x or 10.x.x.x)
3. **Connect all phones** to the laptop's hotspot
4. **Launch app** on each phone and select role

## Roles

### Worker (Band)
- **Purpose:** Receives earthquake alerts, vibrates, allows ACK
- **Setup:**
  - Role: Worker (Band)
  - Server IP: `192.168.43.1:3000` (your laptop IP)
  - Zones: `Unit-1,Unit-2,Unit-3`
  - Worker ID: `worker1` (unique per device)
- **Behavior:**
  - Receives alert → vibrates 3 pulses → shows ACK button with 15s countdown
  - ACK pressed → stops vibration, sends ACK to server
  - No ACK → escalates to siren

### Siren
- **Purpose:** Plays alarm when worker doesn't ACK
- **Setup:**
  - Role: Siren
  - Server IP: Same as above
  - Zones: Same zones as workers
  - **IMPORTANT:** Press "Enable Audio" button after launch
- **Behavior:**
  - Receives siren event → plays looped alarm
  - Receives sirenCancel → stops alarm

### Dashboard (Optional)
- **Purpose:** Trigger alerts manually from phone  
- **Setup:**
  - Role: Dashboard
  - Server IP: Same as above
- **Features:**
  - Create Alert button (single zone)
  - Create Scenario button (earthquake simulation)

## Demo Flow (60 seconds)

```
Setup (before demo):
- 2 Worker phones connected (worker1, worker2)
- 1 Siren phone connected, audio enabled
- All on same hotspot as laptop server

Demo:
1. [0s]  "We have 2 workers monitoring Unit-3"
2. [5s]  Laptop: Create alert for Unit-3, severity 3
3. [10s] Both phones vibrate (3 pulses, 400ms each - LoRa 9600 baud)
4. [15s] Worker1: Press ACK → vibration stops
5. [20s] "Worker1 acknowledged via LoRa uplink at 9600 baud"
6. [25s] Worker2: Let countdown expire (no ACK)
7. [35s] Siren phone: Alarm plays automatically
8. [45s] "System escalated to siren after timeout"
9. [50s] Laptop: Press sirenCancel → alarm stops
10. [55s] "Production uses identical logic on LoRa hardware"
```

## Technical Details

### LoRa Transmission Simulation
- **Production:** Sensor data transmitted via LoRa at 9600 baud
- **Demo:** Same application logic, WiFi replaces LoRa radio layer
- **UI Indicator:** "Sensor data via LoRa @ 9600 baud" shown in Worker screen
- **Behavior:** Identical timeouts, ACK logic, escalation rules

### Vibration Patterns
- Severity 1: 3 pulses × 200ms
- Severity 2: 3 pulses × 300ms  
- Severity 3: 3 pulses × 400ms

### Foreground Service
- Keeps socket connection alive when app in background
- Shows persistent notification
- Stops when app exits

## Troubleshooting

### Connection Failed
1. **Check hotspot:** All devices on same network?
2. **Verify IP:** Run `ifconfig` / `ipconfig` on laptop again
3. **Firewall:** Allow port 3000 on laptop
4. **Server running:** Check `http://<laptop-ip>:3000` in browser

### No Vibration
- Some devices don't support vibration
- App shows warning and provides visual alerts
- Use visual flash as fallback

### No Audio on Siren
1. Press "Enable Audio" button (required for Android audio policy)
2. Set phone volume to HIGH
3. Use "Test Alarm" button to verify
4. Check if alarm_sound.mp3 is present in APK

### Phone Goes to Sleep
- Enable "Stay Awake" in Developer Options (demo only)
- Or: Disable battery saver mode
- Foreground service helps keep connection alive

## Building from Source

### Requirements
- Android Studio Arctic Fox or newer
- JDK 11+
- Android SDK 34

### Build Steps
```bash
cd AlertSystemApp

# Add alarm sound file first (see app/src/main/res/raw/README_ALARM_SOUND.md)

# Debug build
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk

# Release build (signed)
./gradlew assembleRelease
```

### Install via ADB
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Message to Judges

> "Our production earthquake alert system uses **LoRa radios** operating at **9600 baud** to transmit sensor data to wearable Worker Bands. For this SIH demonstration, we've substituted the LoRa radio layer with a **local WiFi hotspot** while maintaining **100% identical application-layer logic**: the same ACK timeouts (15s), escalation rules, severity-based vibration patterns, and alert flows.
>
> This Android app faithfully replicates the production Worker Band and Siren device behavior. What you're seeing is the actual user experience our field workers will have, just over WiFi instead of LoRa."

## Testing Checklist

Before demo:
- [ ] All phones connected to laptop hotspot
- [ ] Server running: `http://<laptop-ip>:3000` accessible
- [ ] Siren phone: Audio enabled + tested
- [ ] Worker phones: Vibration tested (or visual fallback ready)
- [ ] All phones: Battery >50%, screen brightness high
- [ ] Backup: Have script ready if live demo fails

## Architecture

- **Language:** Kotlin
- **Networking:** Socket.io-client (v2.1.0)
- **Min SDK:** 26 (Android 8.0)
- **Target SDK:** 34 (Android 14)
- **Dependencies:**
  - Material Design Components
  - Socket.io client
  - Gson (JSON parsing)

## License

Created for Smart India Hackathon 2024 - Earthquake Alert System Demo

## Support

For issues during setup, check:
1. Laptop server logs
2. Android Logcat: `adb logcat | grep AlertSystem`
3. README_ALARM_SOUND.md for audio setup
