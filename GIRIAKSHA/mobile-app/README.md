# GeoGuard Mobile App

A comprehensive React Native mobile application for the GeoGuard mine safety and monitoring system. This app provides all features from the web dashboard, including ML integration, real-time alerts, sensor monitoring, and more.

## 📋 Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the App](#running-the-app)
- [Features](#features)
- [Project Structure](#project-structure)
- [API Integration](#api-integration)
- [ML Features](#ml-features)
- [Troubleshooting](#troubleshooting)

## 🔧 Requirements

### System Requirements

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 (or yarn >= 1.22.0)
- **Python**: >= 3.9.0 (for ML service)
- **Expo CLI**: Latest version

### Platform Requirements

#### For Android Development:
- Android Studio with Android SDK
- Java Development Kit (JDK) 17 or higher
- Android device or emulator (API level 21+)

#### For iOS Development (macOS only):
- Xcode 14.0 or higher
- CocoaPods
- iOS Simulator or physical device (iOS 13.0+)

## 📦 Installation

### 1. Install Node.js and npm

Download and install Node.js from [nodejs.org](https://nodejs.org/). Verify installation:

```bash
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 9.0.0
```

### 2. Install Expo CLI

```bash
npm install -g expo-cli
```

Or use npx (recommended):
```bash
npx expo-cli --version
```

### 3. Install Project Dependencies

Navigate to the mobile-app directory:

```bash
cd mobile-app
npm install
```

This will install all required packages including:
- React Native core libraries
- Expo SDK (~51.0.17)
- Navigation libraries (@react-navigation)
- UI components (@expo/vector-icons, react-native-paper)
- Chart library (react-native-chart-kit)
- Image picker and camera (expo-image-picker, expo-camera)
- Maps (react-native-maps)
- And more...

### 4. Install iOS Dependencies (macOS only)

If developing for iOS:

```bash
cd ios
pod install
cd ..
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `mobile-app` directory (optional):

```env
API_URL=http://localhost:4000/api
SOCKET_URL=ws://localhost:4000
```

Or configure in `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:4000/api",
      "socketUrl": "ws://localhost:4000"
    }
  }
}
```

### Update API URL

Edit `src/utils/constants.js` to set your backend API URL:

```javascript
export const API_URL = 'http://your-backend-url:4000/api'
```

**Note**: For physical devices, use your computer's local IP address instead of `localhost`.

## 🚀 Running the App

### Development Mode

1. Start the Expo development server:

```bash
npm start
```

Or:

```bash
expo start
```

2. Choose your platform:
   - Press `a` for Android
   - Press `i` for iOS
   - Press `w` for web
   - Scan QR code with Expo Go app on your phone

### Running on Android

```bash
npm run android
```

Or:

```bash
expo run:android
```

### Running on iOS (macOS only)

```bash
npm run ios
```

Or:

```bash
expo run:ios
```

### Building for Production

#### Android APK

```bash
eas build --platform android --profile production
```

Or build locally:

```bash
expo build:android
```

#### iOS (macOS only)

```bash
eas build --platform ios --profile production
```

## ✨ Features

### Core Features

1. **Authentication**
   - Login with email/password
   - Role-based access control
   - Secure token storage

2. **Dashboard**
   - Real-time alerts overview
   - ML risk snapshot
   - Network status indicator
   - Offline queue status

3. **Map View**
   - Interactive map with risk visualization
   - Sensor locations
   - Alert markers
   - Real-time updates

4. **Complaints/Reports**
   - Submit complaints with photos
   - Location tagging
   - Priority selection
   - Track complaint status

5. **SOS Emergency**
   - One-tap SOS button
   - Location sharing
   - Emergency contacts
   - Quick alerts

6. **Sensors (Admin)**
   - View all sensors
   - Sensor details and readings
   - Real-time data
   - Historical charts

7. **ML Features (Admin)**
   - **Risk Prediction**: Get AI-powered risk scores
   - **Crack Detection**: Upload images for crack detection
   - **72-Hour Forecast**: Risk trend predictions
   - Feature importance visualization

8. **Tasks**
   - View assigned tasks
   - Update task status
   - Upload task attachments
   - Task details

9. **Alerts**
   - View all alerts
   - Alert details
   - Acknowledge alerts
   - Filter by severity

10. **Government Advisories** (Gov Authority)
    - View advisories
    - Post new advisories
    - Attach documents

11. **Admin Panel** (Super Admin)
    - User management
    - Role management
    - System settings

### Role-Based Access

- **Field Worker**: Dashboard, Map, Reports, SOS, Tasks
- **Site Admin**: All Field Worker features + Sensors, ML, Tasks management
- **Government Authority**: Dashboard, Advisories, Alerts
- **Super Admin**: All features + Admin panel

## 📁 Project Structure

```
mobile-app/
├── src/
│   ├── App.js                 # Main app component
│   ├── components/            # Reusable UI components
│   │   ├── AlertCard.js
│   │   ├── MapView.js
│   │   └── UploadBox.js
│   ├── hooks/                 # Custom React hooks
│   │   ├── useNetwork.js
│   │   └── useOfflineQueue.js
│   ├── navigation/            # Navigation setup
│   │   ├── AppNavigator.js
│   │   └── AuthNavigator.js
│   ├── screens/               # Screen components
│   │   ├── HomeScreen.js
│   │   ├── LoginScreen.js
│   │   ├── MapScreen.js
│   │   ├── ComplaintScreen.js
│   │   ├── SosScreen.js
│   │   ├── SensorsScreen.js
│   │   ├── MLPredictScreen.js
│   │   ├── MLDetectScreen.js
│   │   ├── MLForecastScreen.js
│   │   └── ...
│   ├── services/              # API services
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── ml.js
│   │   ├── sensors.js
│   │   ├── alerts.js
│   │   ├── complaints.js
│   │   ├── tasks.js
│   │   ├── slopes.js
│   │   ├── admin.js
│   │   └── govt.js
│   ├── storage/               # Offline storage
│   │   └── offlineQueue.js
│   └── utils/                 # Utilities
│       └── constants.js
├── assets/                    # Images, icons, etc.
├── app.json                   # Expo configuration
├── package.json               # Dependencies
└── README.md                  # This file
```

## 🔌 API Integration

The app connects to the backend API at `http://localhost:4000/api` (configurable).

### Endpoints Used

- `/api/auth/login` - User authentication
- `/api/auth/me` - Get current user profile
- `/api/alerts` - Get alerts
- `/api/complaints` - Submit/view complaints
- `/api/sensors` - Sensor data
- `/api/ml/predict` - ML risk prediction
- `/api/ml/detect` - Crack detection
- `/api/ml/forecast` - Risk forecast
- `/api/tasks` - Task management
- `/api/admin/*` - Admin endpoints
- `/api/govt/*` - Government endpoints

### Authentication

The app uses JWT tokens stored securely in AsyncStorage. Tokens are automatically attached to API requests via axios interceptors.

## 🤖 ML Features

### Risk Prediction

- Select a slope
- Get AI-powered risk score (0.0 - 1.0)
- View risk level (Low/Medium/High/Imminent)
- See feature importance breakdown

### Crack Detection

- Upload image from gallery or camera
- AI analyzes image for cracks
- Get confidence score
- Risk assessment with recommendations

### 72-Hour Forecast

- Select a slope
- View risk trend over next 72 hours
- Interactive chart visualization
- Current assessment with weather data

### Requirements

ML features require the Python ML service to be running. See backend README for ML service setup.

## 🔄 Offline Support

The app includes offline queue functionality:

- Requests are queued when offline
- Automatic sync when connection restored
- Visual indicator of queue status
- Last sync timestamp

## 🐛 Troubleshooting

### Common Issues

#### 1. Metro Bundler Issues

Clear cache and restart:

```bash
npm start -- --clear
```

#### 2. Android Build Errors

- Ensure Android SDK is properly installed
- Check JAVA_HOME environment variable
- Clean build: `cd android && ./gradlew clean`

#### 3. iOS Build Errors (macOS)

- Run `pod install` in ios directory
- Clean Xcode build folder (Cmd+Shift+K)
- Reset simulator: `xcrun simctl erase all`

#### 4. Network Connection Issues

- For physical devices, use your computer's IP address instead of `localhost`
- Ensure backend server is running
- Check firewall settings

#### 5. Module Not Found Errors

```bash
rm -rf node_modules
npm install
```

#### 6. Expo Go App Issues

- Update Expo Go app to latest version
- Clear Expo Go cache
- Restart development server

### Getting Help

1. Check Expo documentation: https://docs.expo.dev/
2. Check React Native documentation: https://reactnative.dev/
3. Review backend API documentation
4. Check ML service status

## 📱 Platform-Specific Notes

### Android

- Minimum SDK: 21 (Android 5.0)
- Target SDK: 33+
- Requires location permissions for map features
- Camera permissions for image capture

### iOS

- Minimum iOS: 13.0
- Requires Info.plist entries for permissions
- Camera and photo library access
- Location services

## 🔐 Permissions

The app requires the following permissions:

- **Camera**: For taking photos for complaints and crack detection
- **Photo Library**: For selecting images
- **Location**: For map features and location tagging
- **Notifications**: For push notifications (optional)

## 📊 Dependencies

### Core Dependencies

- `expo`: ~51.0.17 - Expo SDK
- `react`: 18.2.0 - React library
- `react-native`: 0.74.3 - React Native framework
- `@react-navigation/native`: ^6.1.18 - Navigation
- `axios`: ^1.7.7 - HTTP client
- `@react-native-async-storage/async-storage`: ^1.21.0 - Local storage

### UI Dependencies

- `@expo/vector-icons`: ^14.0.2 - Icons
- `react-native-paper`: ^5.12.3 - Material Design components
- `react-native-chart-kit`: ^6.12.0 - Charts
- `react-native-maps`: 1.10.0 - Maps

### Feature Dependencies

- `expo-camera`: ~15.0.6 - Camera access
- `expo-image-picker`: ~15.0.7 - Image selection
- `expo-location`: ~17.0.1 - Location services
- `expo-notifications`: ~0.28.15 - Push notifications
- `socket.io-client`: ^4.7.5 - WebSocket client

## 🚀 Deployment

### Android

1. Build APK:
```bash
eas build --platform android
```

2. Or use EAS Build service for production builds

### iOS

1. Build IPA:
```bash
eas build --platform ios
```

2. Submit to App Store via EAS Submit

## 📝 Version Information

- **React Native**: 0.74.3
- **Expo SDK**: ~51.0.17
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0

## 🔗 Related Documentation

- Backend API: See `../backend/README.md`
- ML Service: See `../backend/ml-service/README.md`
- Web App: See `../web-app/README.md`
- ML Integration: See `../ML_INTEGRATION_DOCS.txt`

## 📄 License

[Your License Here]

## 👥 Contributors

[Your Team/Contributors]

---

**Last Updated**: 2024
**Version**: 1.0.0
