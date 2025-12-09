# Building Standalone APK for GeoGuard Mobile App

## Overview
This guide explains how to build a standalone APK that can be shared with friends for direct installation without requiring Expo Go or any dependencies.

## Prerequisites
- Expo account (free): https://expo.dev/signup
- EAS CLI installed globally

## Build Steps

### 1. Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### 2. Login to Expo Account
```bash
cd mobile-app
eas login
```
Enter your Expo credentials when prompted.

### 3. Configure EAS Build (Already Done)
The `eas.json` file has been created with the following configuration:
- **Preview build**: Generates APK for testing
- **Production build**: Generates APK for distribution

### 4. Build the APK

**For testing/preview (recommended first):**
```bash
eas build --platform android --profile preview
```

**For production:**
```bash
eas build --platform android --profile production
```

### 5. Download the APK
After the build completes (takes 10-20 minutes):
1. EAS will provide a download link
2. Download the APK file (e.g., `geoguard-mobile.apk`)
3. Share this file with your friends

## Sharing the APK

### Option 1: Direct File Sharing
1. Download the APK from the EAS build link
2. Share via:
   - Email attachment
   - Google Drive / Dropbox
   - WhatsApp / Telegram
   - USB transfer

### Option 2: QR Code (Easiest)
1. EAS provides a QR code after build
2. Friends scan the QR code with their phone
3. Download and install directly

## Installation on Friend's Phone

### For Android:
1. **Enable Unknown Sources**:
   - Go to Settings → Security
   - Enable "Install unknown apps" or "Unknown sources"
   - Allow installation from the browser/file manager

2. **Install APK**:
   - Open the downloaded APK file
   - Tap "Install"
   - Wait for installation to complete
   - Tap "Open" to launch GeoGuard

### Important Notes:
- ✅ **No Expo Go needed** - This is a standalone app
- ✅ **No dependencies needed** - Everything is bundled
- ✅ **Works offline** - Once installed, no internet needed for core features
- ⚠️ **Android only** - iOS requires Apple Developer account ($99/year)

## Build Configuration Details

### App Information:
- **Package Name**: `com.geoguard.mobile`
- **App Name**: GeoGuard
- **Version**: 1.0.0
- **Version Code**: 1

### Build Profiles:
- **Preview**: For testing, generates APK
- **Production**: For distribution, generates APK

## Troubleshooting

### Build Fails:
```bash
# Clear cache and retry
eas build:cancel
eas build --platform android --profile preview --clear-cache
```

### Friends Can't Install:
- Ensure "Unknown sources" is enabled
- Check Android version (requires Android 5.0+)
- Verify APK file is not corrupted

## Alternative: Local Build (Advanced)

If you prefer to build locally without EAS:

```bash
# Install expo-dev-client
npx expo install expo-dev-client

# Build locally (requires Android Studio)
npx expo run:android --variant release
```

The APK will be generated in:
`android/app/build/outputs/apk/release/app-release.apk`

## File Size
Expected APK size: ~50-80 MB (includes all dependencies and assets)

## Next Steps
1. Run `eas login` to authenticate
2. Run `eas build --platform android --profile preview`
3. Wait for build to complete
4. Download and share the APK!
