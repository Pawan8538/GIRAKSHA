import { Radio, Activity, Droplets, Ruler, Zap, Clock, Power, AlertTriangle } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useState } from 'react';
import { sensorService } from '../../services/sensorService';

const getSensorIcon = (type) => {
    switch (type?.toLowerCase()) {
        case 'displacement': return Ruler;
        case 'pore_pressure': return Droplets;
        case 'vibration': return Activity;
        case 'rain_gauge': return Droplets;
        case 'seismic': return Activity;
        case 'tilt': return Activity;
        default: return Radio;
    }
};

const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
};

const getStatusColor = (isActive, lastReadingTime) => {
    if (!isActive) return 'border-gray-200 bg-gray-50 opacity-75';

    if (!lastReadingTime) return 'border-red-200 bg-red-50';

    const secondsAgo = (new Date() - new Date(lastReadingTime)) / 1000;
    if (secondsAgo > 30) return 'border-yellow-200 bg-yellow-50'; // Stale data

    return 'border-green-200 bg-white hover:border-green-300'; // Healthy
};

export const SensorCard = ({ sensor, onUpdate, userRole }) => {
    const [loading, setLoading] = useState(false);
    const Icon = getSensorIcon(sensor.sensor_type);
    const isAdmin = ['site_admin', 'super_admin'].includes(userRole);

    const isStale = sensor.is_active && sensor.last_reading_time &&
        (new Date() - new Date(sensor.last_reading_time)) / 1000 > 30;

    const handleToggle = async (e) => {
        e.stopPropagation();
        if (!isAdmin) return;

        if (!confirm(`Are you sure you want to ${sensor.is_active ? 'deactivate' : 'activate'} this sensor?`)) return;

        try {
            setLoading(true);
            await sensorService.toggleSensorActive(sensor.id);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Failed to toggle sensor', error);
            alert('Failed to update sensor status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className={`transition-all duration-300 ${getStatusColor(sensor.is_active, sensor.last_reading_time)}`}>
            <div className="p-6 relative">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center 
                        ${sensor.is_active ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                        <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex items-center gap-2">
                        {isStale && (
                            <div className="flex items-center text-yellow-600 bg-yellow-100 px-2 py-1 rounded text-xs font-medium" title="No recent data">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Stale
                            </div>
                        )}
                        <Badge variant={sensor.is_active ? 'success' : 'secondary'}>
                            {sensor.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-gray-900 mb-1 capitalize">
                    {sensor.sensor_type?.replace(/_/g, ' ')}
                </h3>
                <p className="text-xs text-gray-500 font-mono mb-4">ID: {sensor.name}</p>

                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span className={`text-3xl font-bold ${sensor.is_active ? 'text-gray-900' : 'text-gray-400'}`}>
                            {sensor.current_value !== null ? Number(sensor.current_value).toFixed(2) : '--'}
                            <span className="text-base font-normal text-gray-500 ml-1">{sensor.unit}</span>
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-4 mt-4 border-t border-gray-100/50 flex justify-between items-center">
                    <span className="text-xs text-gray-500 flex items-center" title={sensor.last_reading_time ? new Date(sensor.last_reading_time).toLocaleString() : 'Never'}>
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTimeAgo(sensor.last_reading_time)}
                    </span>

                    {isAdmin && (
                        <button
                            onClick={handleToggle}
                            disabled={loading}
                            className={`p-1.5 rounded-full transition-colors ${sensor.is_active
                                    ? 'text-red-500 hover:bg-red-50'
                                    : 'text-green-500 hover:bg-green-50'
                                }`}
                            title={sensor.is_active ? 'Deactivate Sensor' : 'Activate Sensor'}
                        >
                            <Power className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
                        </button>
                    )}
                </div>
            </div>
        </Card>
    );
};
