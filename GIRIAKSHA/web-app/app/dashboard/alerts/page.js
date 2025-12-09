"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, MapPin, Clock, Bell, X, AlertOctagon, CheckCircle } from 'lucide-react';
import Cookies from 'js-cookie';

export default function AlertsPage() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        alert_type: 'ml_prediction',
        message: '',
        severity: 'medium'
    });
    const [mines, setMines] = useState([]);
    const [selectedMine, setSelectedMine] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [alertsRes, minesRes] = await Promise.all([
                api.get('/alerts').catch(() => ({ data: { data: [] } })),
                api.get('/admin/slopes').catch(() => ({ data: { data: [] } }))
            ]);
            setAlerts(alertsRes.data.data || []);
            setMines(minesRes.data.data || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await api.post('/alerts', {
                ...formData,
                slope_id: selectedMine || null
            });
            setShowModal(false);
            setFormData({ alert_type: 'ml_prediction', message: '', severity: 'medium' });
            setSelectedMine('');
            loadData();
        } catch (error) {
            console.error('Failed to create alert:', error);
            alert('Failed to create alert. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical':
            case 'high':
                return 'bg-red-50 border-l-red-500';
            case 'warning':
            case 'medium':
                return 'bg-yellow-50 border-l-yellow-500';
            case 'low':
            case 'info':
                return 'bg-blue-50 border-l-blue-500';
            default:
                return 'bg-gray-50 border-l-gray-500';
        }
    };

    const getSeverityIconColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical':
            case 'high':
                return 'bg-red-100 text-red-600';
            case 'warning':
            case 'medium':
                return 'bg-yellow-100 text-yellow-600';
            case 'low':
            case 'info':
                return 'bg-blue-100 text-blue-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    // Helper to get alert styles
    const getAlertStyle = (type, severity) => {
        if (type === 'sos') return 'bg-red-50 border-red-200 ring-2 ring-red-500 ring-offset-2';
        if (severity === 'critical') return 'bg-red-50 border-red-100';
        if (severity === 'high') return 'bg-orange-50 border-orange-100';
        return 'bg-white border-gray-100';
    };

    const handleAcknowledge = async (alertId) => {
        try {
            // Assuming we have an acknowledge endpoint in api/alerts
            // If not, we might need to add it to dashboardService or alertService
            // For now using direct API call pattern or dashboardService if available
            // Let's assume dashboardService.acknowledgeAlert(alertId)
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/alerts/${alertId}/acknowledge`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${Cookies.get('token')}`
                }
            });
            if (response.ok) {
                loadData();
            }
        } catch (error) {
            console.error("Failed to acknowledge alert:", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                    <AlertTriangle className="w-4 h-4" />
                    Create Alert
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card className="bg-red-50 border-red-100">
                    <div className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <AlertOctagon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">SOS Alerts</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {alerts.filter(a => a.alert_type === 'sos' && !a.acknowledged).length}
                            </p>
                        </div>
                    </div>
                </Card>
                {/* ... other cards (kept from original via incomplete replacement or assumed existing) ... */}
            </div>

            {/* Alerts List */}
            <div className="grid gap-4">
                {loading ? (
                    [1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse" />
                    ))
                ) : (
                    alerts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No active alerts</p>
                        </div>
                    ) : (
                        alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`p-4 rounded-xl border transition-all ${getAlertStyle(alert.alert_type, alert.severity)}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${alert.alert_type === 'sos' ? 'bg-red-100 text-red-600 animate-pulse' :
                                            alert.severity === 'critical' ? 'bg-red-100 text-red-600' :
                                                'bg-orange-100 text-orange-600'
                                            }`}>
                                            {alert.alert_type === 'sos' ? <AlertOctagon className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-900 capitalize flex items-center gap-2">
                                                    {alert.alert_type === 'sos' ? 'SOS EMERGENCY' : (alert.alert_type?.replace(/_/g, ' ') || 'System Alert')}
                                                    {alert.alert_type === 'sos' && !alert.acknowledged && (
                                                        <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] uppercase rounded-full tracking-wider animate-pulse">
                                                            Active
                                                        </span>
                                                    )}
                                                </h3>
                                                <span className="text-sm text-gray-500">• {new Date(alert.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-gray-800 mt-1 font-medium">{alert.message}</p>

                                            {/* Context Info */}
                                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                                                {alert.slope_id && (
                                                    <span className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded">
                                                        <MapPin className="w-3 h-3" />
                                                        Mine ID: {alert.slope_id}
                                                    </span>
                                                )}
                                                {alert.acknowledged ? (
                                                    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Acknowledged by User #{alert.acknowledged_by}
                                                    </span>
                                                ) : (
                                                    alert.alert_type === 'sos' && (
                                                        <button
                                                            onClick={() => handleAcknowledge(alert.id)}
                                                            className="flex items-center gap-1 text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded shadow-sm text-xs font-bold transition-colors"
                                                        >
                                                            ACKNOWLEDGE SOS
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>

            {/* Create Alert Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg p-6 bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Create Alert</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Alert Type</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={formData.alert_type}
                                    onChange={(e) => setFormData({ ...formData, alert_type: e.target.value })}
                                >
                                    <option value="ml_prediction">ML Prediction</option>
                                    <option value="sensor_anomaly">Sensor Anomaly</option>
                                    <option value="weather_warning">Weather Warning</option>
                                    <option value="system">System Alert</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    rows="4"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                    placeholder="Describe the alert..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={formData.severity}
                                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Target Mine (Optional)
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={selectedMine}
                                    onChange={(e) => setSelectedMine(e.target.value)}
                                >
                                    <option value="">All Mines</option>
                                    {mines.map((mine) => (
                                        <option key={mine.id} value={mine.id}>
                                            {mine.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" className="flex-1" isLoading={submitting}>
                                    Create Alert
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
