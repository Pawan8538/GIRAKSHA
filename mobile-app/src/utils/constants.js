import Constants from 'expo-constants'
import { Platform } from 'react-native'

const extra = Constants.expoConfig?.extra || Constants.manifest?.extra || {}

const getApiUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000/api'
  }
  return 'http://localhost:4000/api'
}

export const API_URL = getApiUrl()
export const SOCKET_URL = Platform.OS === 'android' ? 'ws://10.0.2.2:4000' : 'ws://localhost:4000'

export const MEDIA_MAX_SIZE_MB = 12
export const DEVICE_PLATFORM = Platform.OS

export const PALETTE = {
  // Dark Mode
  dark: {
    background: '#0A1A2C',
    surface: '#132D46',
    surfaceNeutral: '#3F4A54',
    primary: '#01C88D',
    secondary: '#1FE8C2',
    text: '#FFFFFF',
    textSecondary: '#A8B3BD',
    divider: '#2C3A47',
    disabled: '#7D8A96',
    border: '#3F4A54',
  },
  // Light Mode (Reference)
  light: {
    background: '#F9FBFD',
    surface: '#EBEBEF',
    primary: '#00A67E',
    secondary: '#13CAB6',
    text: '#1A1D23',
    textSecondary: '#5A6570',
    divider: '#D6D7DB',
    disabled: '#B6BCC2',
    border: '#C9CED4',
  },
  // Alerts / Risk
  risk: {
    critical: '#D32F2F',
    high: '#FF5722',
    moderate: '#FFC107',
    low: '#4CAF50',
  },
  // Map / Geotech
  map: {
    slopeBoundary: '#2B9CEF',
    sensorNormal: '#01C88D',
    sensorWarning: '#FFC107',
    sensorCritical: '#D32F2F',
    demContour: '#7A8EA1',
  }
}

// Defaulting to Dark Mode for the "New Look"
export const COLORS = {
  primary: PALETTE.dark.primary,
  accent: PALETTE.dark.secondary,
  danger: PALETTE.risk.critical,
  warning: PALETTE.risk.moderate,
  success: PALETTE.risk.low,
  surface: PALETTE.dark.surface,
  surfaceNeutral: PALETTE.dark.surfaceNeutral,
  background: PALETTE.dark.background,
  text: PALETTE.dark.text,
  textSecondary: PALETTE.dark.textSecondary,
  border: PALETTE.dark.border,
  divider: PALETTE.dark.divider,
  disabled: PALETTE.dark.disabled,
  // Map specific
  ...PALETTE.map
}

export const RISK_LEVELS = {
  low: { label: 'Low', color: PALETTE.risk.low, threshold: 0.35 },
  medium: { label: 'Medium', color: PALETTE.risk.moderate, threshold: 0.6 },
  high: { label: 'High', color: PALETTE.risk.high, threshold: 0.75 },
  imminent: { label: 'Critical', color: PALETTE.risk.critical, threshold: 0.9 },
}

export const ROLES = {
  FIELD_WORKER: 'field_worker',
  SITE_ADMIN: 'site_admin',
  GOV_AUTHORITY: 'gov_authority',
  SUPER_ADMIN: 'super_admin',
}

export const getRiskLevel = (score) => {
  if (score >= RISK_LEVELS.imminent.threshold) return RISK_LEVELS.imminent
  if (score >= RISK_LEVELS.high.threshold) return RISK_LEVELS.high
  if (score >= RISK_LEVELS.medium.threshold) return RISK_LEVELS.medium
  return RISK_LEVELS.low
}

