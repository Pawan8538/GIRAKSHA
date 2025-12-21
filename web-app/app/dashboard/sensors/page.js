"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { sensorService } from '../../../services/sensorService';
import { SensorCard } from '../../../components/sensors/SensorCard';
import { RefreshCw, Radio, Filter, Eye, EyeOff, Power } from 'lucide-react';
import { Button } from '../../../components/common/Button';

export default function SensorsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [sensors, setSensors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [showInactive, setShowInactive] = useState(false);
    const [isPolling, setIsPolling] = useState(true);
    const [systemPaused, setSystemPaused] = useState(false);

    // Sync system paused state with data
    useEffect(() => {
        if (!loading && sensors.length === 0) {
            setSystemPaused(true);
        } else if (sensors.length > 0) {
            setSystemPaused(false);
        }
    }, [sensors, loading]);

    const handleGlobalToggle = async () => {
        try {
            setRefreshing(true);
            // Toggle: If currently paused, we want to Activate (true).
            await sensorService.toggleGlobalSystem(systemPaused);
            await loadSensors();
        } catch (e) {
            console.error(e);
            alert('Failed to toggle system');
        } finally {
            setRefreshing(false);
        }
    };

    // Redirect if not site_admin
    useEffect(() => {
        if (user && user.role_name !== 'site_admin') {
            router.replace('/dashboard');
        }
    }, [user, router]);

    const loadSensors = useCallback(async (isAutoRefresh = false) => {
        if (!user) return;

        try {
            if (!isAutoRefresh) setRefreshing(true);

            // For super_admin or users without assigned mine, fetch all sensors
            // For site_admin or others with assigned mine, fetch only their mine's sensors
            const data = await sensorService.getSensorsByMine(user.slope_id || null);
            setSensors(data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to load sensors', error);
            // Don't stop polling on single error, but maybe warn?
        } finally {
            if (!isAutoRefresh) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, [user]);

    // Initial load
    useEffect(() => {
        loadSensors();
    }, [loadSensors]);

    // Polling effect
    useEffect(() => {
        if (!isPolling) return;

        const intervalId = setInterval(() => {
            // Only poll if page is visible
            if (document.visibilityState === 'visible') {
                loadSensors(true);
            }
        }, 5000); // 5 second interval

        return () => clearInterval(intervalId);
    }, [loadSensors, isPolling]);

    // Filtered sensors based on showInactive toggle
    const filteredSensors = sensors.filter(s => showInactive || s.is_active);
    const inactiveCount = sensors.length - sensors.filter(s => s.is_active).length;

    if (loading && sensors.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">Sensor Monitoring</h1>
                        {isPolling && (
                            <span className="flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                                LIVE
                            </span>
                        )}
                    </div>
                    <p className="text-gray-500 mt-1">Real-time status of mine sensors</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Toggle polling */}
                    <button
                        onClick={() => setIsPolling(!isPolling)}
                        className={`text-xs px-2 py-1 rounded border ${isPolling ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                        title={isPolling ? "Auto-refresh ON" : "Auto-refresh PAUSED"}
                    >
                        {isPolling ? 'Auto-Refresh ON' : 'Paused'}
                    </button>

                    <Button
                        variant={systemPaused ? "success" : "destructive"}
                        size="sm"
                        onClick={handleGlobalToggle}
                        className={systemPaused ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
                    >
                        <Power className="w-4 h-4 mr-2" />
                        {systemPaused ? 'RESUME SYSTEM' : 'PAUSE SYSTEM'}
                    </Button>

                    <div className="h-6 w-px bg-gray-200 hidden md:block" />

                    {/* Show/Hide Inactive Toggle */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowInactive(!showInactive)}
                        className={`${showInactive ? 'bg-gray-100' : ''}`}
                    >
                        {showInactive ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        {showInactive ? 'Hide Inactive' : `Show Inactive (${inactiveCount})`}
                    </Button>

                    <span className="text-xs text-mono text-gray-400 hidden md:block">
                        Updated: {lastUpdated.toLocaleTimeString()}
                    </span>

                    <button
                        onClick={() => loadSensors(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        disabled={refreshing}
                        title="Manual Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredSensors.map((sensor) => (
                    <SensorCard
                        key={sensor.id}
                        sensor={sensor}
                        onUpdate={() => loadSensors(false)}
                        userRole={user?.role_name}
                    />
                ))}

                {filteredSensors.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Radio className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No {showInactive ? '' : 'Active'} Sensors Found</h3>
                        <p className="text-gray-500 mt-1">
                            {showInactive
                                ? "No sensors are currently registered for this mine."
                                : "No active sensors found. Try showing inactive sensors."}
                        </p>
                        {!showInactive && inactiveCount > 0 && (
                            <button
                                onClick={() => setShowInactive(true)}
                                className="mt-4 text-blue-600 hover:underline text-sm font-medium"
                            >
                                View {inactiveCount} inactive sensors
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
