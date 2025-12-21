# Building the APK

## Prerequisites

1. **Android Studio** (Arctic Fox or newer)
   - Download from: https://developer.android.com/studio
   
2. **JDK 11+**
   ```bash
   java -version  # Should show 11 or higher
   ```

3. **Android SDK**
   - Install via Android Studio SDK Manager
   - Required: SDK 34, Build Tools 34.0.0

4. **Alarm Sound File**
   - **CRITICAL:** Add `alarm_sound.mp3` to `app/src/main/res/raw/`
   - See `app/src/main/res/raw/README_ALARM_SOUND.md` for options

---

## Quick Build (Command Line)

### Option 1: Generate simple alarm sound (requires ffmpeg)
```bash
cd AlertSystemApp

# Install ffmpeg if needed (macOS)
brew install ffmpeg

# Generate 5-second alarm tone
ffmpeg -f lavfi -i "sine=frequency=1000:duration=5" \
       -f lavfi -i "sine=frequency=1500:duration=5" \
       -filter_complex amerge -ac 2 -c:a mp3 \
       app/src/main/res/raw/alarm_sound.mp3
```

### Option 2: Use existing sound file
```bash
cp /path/to/your/alarm.mp3 app/src/main/res/raw/alarm_sound.mp3
```

### Build Debug APK
```bash
# Make gradlew executable
chmod +x gradlew

# Build
./gradlew assembleDebug

# Output location:
# app/build/outputs/apk/debug/app-debug.apk
```

---

## Build with Android Studio

1. **Open Project**
   - Android Studio → File → Open
   - Select `AlertSystemApp` folder
   - Wait for Gradle sync

2. **Add Alarm Sound**
   - Right-click `app/src/main/res/raw/`
   - Show in Finder/Explorer
   - Copy `alarm_sound.mp3` here

3. **Build**
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Wait for build complete notification
   - Click "locate" to find APK

---

## Install APK on Phone

### Method 1: USB (via ADB)
```bash
# Enable USB debugging on phone first
# Settings → About Phone → tap Build Number 7 times
# Settings → Developer Options → USB Debugging → ON

# Connect phone via USB
adb devices  # Verify phone connected

# Install
adb install -r app/build/outputs/apk/debug/app-debug.apk

# View logs while testing
adb logcat | grep AlertSystem
```

### Method 2: Direct Copy
```bash
# Copy APK to phone (via USB or cloud)
cp app/build/outputs/apk/debug/app-debug.apk ~/Desktop/
# Then: Share to phone via email, Drive, AirDrop, etc.

# On phone:
# 1. Download APK file
# 2. Tap to install
# 3. Allow "Install from Unknown Sources" if prompted
```

---

## Release Build (for production)

### 1. Generate Signing Key (one-time)
```bash
keytool -genkey -v -keystore my-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias alert-system-key
  
# Enter password and details when prompted
# Keep this file SAFE and SECRET!
```

### 2. Add to app/build.gradle.kts
```kotlin
android {
    signingConfigs {
        create("release") {
            storeFile = file("../my-release-key.jks")
            storePassword = "YOUR_PASSWORD"
            keyAlias = "alert-system-key"
            keyPassword = "YOUR_PASSWORD"
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            proguardFiles(/* ... */)
        }
    }
}
```

### 3. Build Release APK
```bash
./gradlew assembleRelease

# Output:
# app/build/outputs/apk/release/app-release.apk
```

---

## Troubleshooting Build Issues

### Gradle sync failed
```bash
# Clear Gradle cache
./gradlew clean
rm -rf .gradle build app/build

# Re-sync
./gradlew build --refresh-dependencies
```

### SDK not found
```bash
# Update local.properties with your SDK path
echo "sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk" > local.properties
```

### Missing alarm_sound.mp3
```
Error: app/src/main/res/raw/alarm_sound.mp3 not found
```
**Fix:** Add the alarm sound file as described above

### Out of memory
```bash
# Increase Gradle memory in gradle.properties
org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8
```

---

## Build Outputs

After successful build:

```
app/build/outputs/apk/
├── debug/
│   └── app-debug.apk          # Debug version (for testing)
└── release/
    └── app-release.apk        # Signed release version
```

**File sizes:**
- Debug: ~8-12 MB
- Release (minified): ~4-6 MB

---

## Next Steps

1. ✅ Build APK successfully
2. Install on 3+ test phones
3. Follow `README.md` for network setup
4. Run through `DEMO_SCRIPT.md` with full setup
5. Test both ACK and NO-ACK flows
6. Verify LoRa transmission indicator visible
7. Ready for demo!

---

## Quick Commands Reference

```bash
# Build debug
./gradlew assembleDebug

# Install on connected phone
adb install -r app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat | grep AlertSystem

# Clean build
./gradlew clean build

# Check for errors
./gradlew check
```
