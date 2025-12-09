// Geoscience-themed color palette for GeoGuard
export const Colors = {
    // Primary - Earth tones
    primary: '#8B4513', // Saddle Brown (rock/earth)
    primaryDark: '#5C2E0A',
    primaryLight: '#A0522D',

    // Background
    background: '#1a1b1e',
    surface: '#2a2b2e',
    surfaceLight: '#3a3b3e',

    // Risk levels
    riskImminent: '#7a0019', // Dark red
    riskHigh: '#d62728', // Red
    riskMedium: '#ff7f0e', // Orange
    riskLow: '#2ca02c', // Green
    riskSafe: '#1e7e34',

    // Emergency
    emergency: '#dc2626',
    emergencyDark: '#991b1b',
    warning: '#f59e0b',

    // Status
    success: '#16a34a',
    info: '#3b82f6',

    // Text
    textPrimary: '#ffffff',
    textSecondary: '#a0a0a0',
    textMuted: '#6b7280',

    // Borders
    border: 'rgba(255,255,255,0.1)',
    borderLight: 'rgba(255,255,255,0.05)',
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
};

export const Typography = {
    h1: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    h2: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    body: {
        fontSize: 16,
        color: Colors.textPrimary,
    },
    caption: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    small: {
        fontSize: 12,
        color: Colors.textMuted,
    },
};

export const Shadows = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 4,
    },
};
