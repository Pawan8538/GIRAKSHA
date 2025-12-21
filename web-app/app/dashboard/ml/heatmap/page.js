"use client";

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import HeatmapViewer from '../../../../components/ml/HeatmapViewer';
import { Card } from '../../../../components/common/Card';
import { mlService } from '../../../../services/mlService';
import api from '../../../../lib/api';
import CreateAlertModal from '../../../../components/alerts/CreateAlertModal';
import DeviceStatus from '../../../../components/alerts/DeviceStatus';
import AlertList from '../../../../components/alerts/AlertList';

export default function HeatmapPage() {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [devices, setDevices] = useState({ bands: 0, sirens: 0, dashboards: 0 });
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        loadHeatmapData();
        loadDevices();
        loadActiveAlerts();

        // Auto-refresh heatmap every 5 seconds
        const heatmapInterval = setInterval(() => {
            loadHeatmapData();
        }, 5000);

        // Setup Socket.io connection
        const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const newSocket = io(socketUrl);

        newSocket.on('connect', () => {
            console.log('Connected to Socket.io for alerts');
            // Register as dashboard
            newSocket.emit('register', { role: 'dashboard', zones: [] });
        });

        newSocket.on('deviceUpdate', (deviceCount) => {
            setDevices(deviceCount);
        });

        newSocket.on('log', (logData) => {
            console.log('Alert log:', logData);
            // Reload active alerts when there's activity
            loadActiveAlerts();
        });

        setSocket(newSocket);

        return () => {
            clearInterval(heatmapInterval);
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, []);

    const loadHeatmapData = async () => {
        try {
            const data = await mlService.getHeatmapData();
            setPoints(data);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Failed to load heatmap data', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDevices = async () => {
        try {
            const response = await api.get('/alerts/socket/devices');
            if (response.data.success) {
                setDevices(response.data.devices);
            }
        } catch (error) {
            console.error('Failed to load devices:', error);
        }
    };

    const loadActiveAlerts = async () => {
        try {
            const response = await api.get('/alerts/socket/active');
            if (response.data.success) {
                setActiveAlerts(response.data.alerts);
            }
        } catch (error) {
            console.error('Failed to load active alerts:', error);
        }
    };

    const handleAlertSuccess = () => {
        loadActiveAlerts();
    };

    // Categorize risk levels
    const imminentRisk = points.filter(p => p.risk >= 0.75).length;
    const highRisk = points.filter(p => p.risk >= 0.5 && p.risk < 0.75).length;
    const mediumRisk = points.filter(p => p.risk >= 0.25 && p.risk < 0.5).length;
    const lowRisk = points.filter(p => p.risk < 0.25).length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Risk Heatmap</h1>
                    <p className="text-gray-500">Real-time risk visualization from fusion engine</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowAlertModal(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        CREATE NEW
                    </button>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-gray-200">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-xs text-gray-600">Imminent ({imminentRisk})</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-gray-200">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-xs text-gray-600">High ({highRisk})</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-gray-200">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-xs text-gray-600">Medium ({mediumRisk})</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-gray-200">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-xs text-gray-600">Low ({lowRisk})</span>
                    </div>
                </div>
            </div>

            {/* Device Status */}
            <DeviceStatus devices={devices} />

            {/* Active Alerts */}
            <AlertList alerts={activeAlerts} onRefresh={loadActiveAlerts} />

            <Card className="p-0 overflow-hidden border-none shadow-lg">
                {loading ? (
                    <div className="h-96 flex items-center justify-center text-gray-500">
                        Loading heatmap data...
                    </div>
                ) : (
                    <HeatmapViewer points={points} center={[11.1053, 79.1506]} zoom={16} />
                )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6 bg-red-50 border-red-100">
                    <h3 className="text-sm font-medium text-red-900 mb-2">Imminent Risk</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-red-700">{imminentRisk}</span>
                        <span className="text-sm text-red-600">cells</span>
                    </div>
                </Card>
                <Card className="p-6 bg-orange-50 border-orange-100">
                    <h3 className="text-sm font-medium text-orange-900 mb-2">High Risk</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-orange-700">{highRisk}</span>
                        <span className="text-sm text-orange-600">cells</span>
                    </div>
                </Card>
                <Card className="p-6 bg-yellow-50 border-yellow-100">
                    <h3 className="text-sm font-medium text-yellow-900 mb-2">Medium Risk</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-yellow-700">{mediumRisk}</span>
                        <span className="text-sm text-yellow-600">cells</span>
                    </div>
                </Card>
                <Card className="p-6 bg-green-50 border-green-100">
                    <h3 className="text-sm font-medium text-green-900 mb-2">Low Risk</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-green-700">{lowRisk}</span>
                        <span className="text-sm text-green-600">cells</span>
                    </div>
                </Card>
            </div>

            <Card className="p-4 bg-blue-50 border-blue-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-sm text-blue-900">Live Data</span>
                    </div>
                    <span className="text-sm text-blue-700">
                        Last updated: {lastUpdate.toLocaleTimeString()}
                    </span>
                </div>
            </Card>

            {/* Alert Creation Modal */}
            <CreateAlertModal
                isOpen={showAlertModal}
                onClose={() => setShowAlertModal(false)}
                onSuccess={handleAlertSuccess}
            />
        </div>
    );
}
