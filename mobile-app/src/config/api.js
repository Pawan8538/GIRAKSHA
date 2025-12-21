import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = () => {
  // 1. Check for Environment Variable (Best for "no hardcoding")
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Check for extra config (from app.json or EAS)
  if (Constants.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl;
  }

  // 3. Development fallback: Dynamic detection
  if (__DEV__) {
    // Try to derive from Expo Host URI (LAN IP)
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(':')[0];

    if (localhost) {
      return `http://${localhost}:4000/api`;
    }

    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:4000/api';
    }
    return 'http://localhost:4000/api';
  }

  // 4. Production fallback
  return 'https://your-render-app-name.onrender.com/api';
};

const getSocketUrl = () => {
  if (Constants.expoConfig?.extra?.socketUrl) {
    return Constants.expoConfig.extra.socketUrl;
  }

  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'ws://10.0.2.2:4000';
    }
    return 'ws://localhost:4000';
  }

  return 'wss://your-render-app-name.onrender.com';
};

export const API_URL = getApiUrl();
console.log('Mobile App Configured API_URL:', API_URL); // DEBUG LOG
export const SOCKET_URL = getSocketUrl();
