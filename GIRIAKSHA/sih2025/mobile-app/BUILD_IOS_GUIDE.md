# 🍎 Building GeoGuard for iPhone 16

Since GeoGuard is built with React Native, it is fully compatible with iOS (including the new iPhone 16).

## 📋 Prerequisites

To build and install the app on your iPhone, you need:
1.  **Apple Developer Account** (required for physical device installation).
2.  **EAS CLI** (already installed).
3.  **Expo Account** (logged in).

## 🚀 Option 1: Build for iOS Simulator (No Developer Account needed)

If you just want to test it on your Mac's iOS Simulator:

1.  **Install Xcode** from the Mac App Store.
2.  **Open Xcode** and install the command line tools.
3.  Run the following command in the `mobile-app` directory:
    ```bash
    npx expo run:ios
    ```
    This will launch the iPhone 16 simulator and install the app.

## 📱 Option 2: Build for Real Device (Requires Apple Account)

To generate an `.ipa` file to install on your phone:

1.  **Login to EAS**:
    ```bash
    eas login
    ```

2.  **Run the Build Command**:
    ```bash
    cd mobile-app
    eas build --platform ios --profile production
    ```

3.  **Follow the Prompts**:
    - You will be asked to log in to your Apple Developer account.
    - EAS will handle certificate generation and provisioning profiles automatically.

4.  **Download & Install**:
    - Once the build finishes, you will get a link to download the `.ipa` file.
    - You can install it using **TestFlight** or via **AltStore** / **Sideloadly**.

## ⚡ Option 3: Preview Build (Simulator Only)

To build a simulator-compatible file without running the full environment locally:

```bash
eas build --platform ios --profile preview
```
This generates a build you can drag and drop into the iOS Simulator.
