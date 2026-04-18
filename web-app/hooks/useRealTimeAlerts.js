/**
 * Real-Time Alerts Hook
 * 
 * Listens for new alerts via Socket.IO and provides real-time updates
 * Gracefully degrades if WebSocket connection fails
 */

import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

let socket = null;

export function useRealTimeAlerts(onNewAlert) {
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        // Only run in browser
        if (typeof window === 'undefined') return;

        // Initialize socket connection with error handling
        if (!socket) {
            try {
                socket = io(SOCKET_URL, {
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionAttempts: 3,
                    timeout: 5000
                });

                socket.on('connect', () => {
                    console.log('✅ Real-time alerts connected');
                    setConnected(true);
                });

                socket.on('disconnect', () => {
                    console.log('ℹ️ Real-time alerts disconnected');
                    setConnected(false);
                });

                socket.on('connect_error', (error) => {
                    console.warn('Real-time connection failed (app still works):', error.message);
                    setConnected(false);
                    // App continues to function normally
                });

                socket.on('error', (error) => {
                    console.warn('Socket error (non-critical):', error);
                });
            } catch (error) {
                console.warn('Could not initialize real-time alerts:', error);
                // App still works, just without real-time features
            }
        }

        // Listen for new alerts
        const handleNewAlert = (alert) => {
            console.log('🔔 New alert received:', alert);

            // Play notification sound (optional)
            try {
                if (typeof window !== 'undefined' && window.Audio) {
                    const audio = new Audio('/notification.mp3');
                    audio.play().catch(() => { });
                }
            } catch (e) { }

            // Show browser notification (optional)
            try {
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(alert.title || 'New Alert', {
                        body: alert.message,
                        icon: '/alert-icon.png',
                        tag: `alert-${alert.id}`,
                        requireInteraction: alert.severity === 'critical'
                    });
                }
            } catch (e) { }

            // Call callback
            if (onNewAlert) {
                try {
                    onNewAlert(alert);
                } catch (e) {
                    console.error('Error in alert callback:', e);
                }
            }
        };

        if (socket) {
            socket.on('newAlert', handleNewAlert);
        }

        // Request notification permission (non-blocking)
        try {
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission().catch(() => { });
            }
        } catch (e) { }

        // Cleanup
        return () => {
            if (socket) {
                socket.off('newAlert', handleNewAlert);
            }
        };
    }, [onNewAlert]);

    return { connected };
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
