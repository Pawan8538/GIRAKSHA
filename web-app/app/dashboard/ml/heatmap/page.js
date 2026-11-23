"use client";

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import HeatmapViewer from '../../../../components/ml/HeatmapViewer';
import { Card } from '../../../../components/common/Card';
import { mlService } from '../../../../services/mlService';
import api from '../../../../lib/api';
import DeviceStatus from '../../../../components/alerts/DeviceStatus';
import AlertList from '../../../../components/alerts/AlertList';

export default function HeatmapPage() {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [devices, setDevices] = useState({ bands: 0, sirens: 0, dashboards: 0 });
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        loadHeatmapData();
        loadDevices();
        loadActiveAlerts();

        // Auto-refresh removed. Data now streams via Centralized WebSocket.

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

        newSocket.on('heatmapData', (data) => {
            if (document.visibilityState === 'visible') {
                const transformedData = data.map(cell => ({
                    id: cell.id,
                    lat: cell.lat,
                    lng: cell.lon,
                    risk: cell.risk_score,
                    mineProximity: cell.mine_proximity,
                    sensorInfluence: cell.sensor_influence
                }));
                setPoints(transformedData);
                setLastUpdate(new Date());
                setLoading(false);
            }
        });

        setSocket(newSocket);

        return () => {
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

    const handleTriggerSiren = async () => {
        try {
            await api.post('/worker/siren/trigger');
        } catch (error) {
            console.error('Failed to trigger siren:', error);
            alert('Failed to trigger siren. Ensure backend is reachable.');
        }
    };

    const handleStopSiren = async () => {
        try {
            await api.post('/worker/siren/reset');
        } catch (error) {
            console.error('Failed to stop siren:', error);
            alert('Failed to stop siren.');
        }
    };

    // Categorize risk levels - Aligned with Research Paper Table 3
    const imminentRisk = points.filter(p => (p.risk ?? p.risk_score) >= 0.75).length;
    const highRisk = points.filter(p => (p.risk ?? p.risk_score) >= 0.60 && (p.risk ?? p.risk_score) < 0.75).length;
    const mediumRisk = points.filter(p => (p.risk ?? p.risk_score) >= 0.35 && (p.risk ?? p.risk_score) < 0.60).length;
    const lowRisk = points.filter(p => (p.risk ?? p.risk_score) < 0.35).length;
    const impassableCells = imminentRisk + highRisk;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-gray-900">20×20 IDW Spatial Risk Heatmap</h1>
                        <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            TAMIL NADU LIMESTONE MINE
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Continuous Inverse Distance Weighting (IDW) geotechnical interpolation • Research Paper Section 4.2 & Table 3
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-red-200 shadow-sm">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-xs font-medium text-gray-700">Imminent: {imminentRisk}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-orange-200 shadow-sm">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-xs font-medium text-gray-700">High: {highRisk}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-yellow-200 shadow-sm">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-xs font-medium text-gray-700">Medium: {mediumRisk}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-green-200 shadow-sm">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-xs font-medium text-gray-700">Low: {lowRisk}</span>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 bg-slate-900 text-white border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs text-slate-400 uppercase font-mono">Spatial Grid Dimensions</span>
                            <p className="text-lg font-bold text-white mt-1">20 × 20 Matrix (400 Cells)</p>
                            <p className="text-xs text-slate-400">Cell resolution: ~28–30m per cell • IDW geotechnical surface</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-red-400 uppercase font-mono font-bold">Impassable Barrier Cells</span>
                            <p className="text-2xl font-bold text-red-500 mt-0.5">{impassableCells} / 400</p>
                            <p className="text-[11px] text-slate-400">Risk &ge; 0.60 blocks A* pathfinding</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-blue-50 border-blue-100 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-sm font-bold text-blue-950">Central WebSocket Live Stream</span>
                        </div>
                        <p className="text-xs text-blue-700 mt-1">
                            Geotechnical telemetry ingested every 5s • BRIN indexed
                        </p>
                    </div>
                    <span className="text-xs font-mono font-semibold text-blue-800 bg-blue-100/80 px-2.5 py-1.5 rounded-lg border border-blue-200">
                        {lastUpdate.toLocaleTimeString()}
                    </span>
                </Card>
            </div>

        </div>
    );
}
