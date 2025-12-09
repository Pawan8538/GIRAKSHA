import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = () => {
  // 1. Check for extra config (from app.json or EAS)
  if (Constants.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl;
  }

  // 2. Development fallback
  if (__DEV__) {
    // Android Emulator uses 10.0.2.2 to access host localhost
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:4000/api';
    }
    return 'http://localhost:4000/api';
  }

  // 3. Production fallback (Update this after deploying to Render)
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
export const SOCKET_URL = getSocketUrl();
