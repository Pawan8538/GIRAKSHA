"use client";

import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function CreateAlertModal({ isOpen, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [slopes, setSlopes] = useState([]);
    const [formData, setFormData] = useState({
        zone: '',
        severity: 3,
        type: 'alert' // 'alert' or 'scenario'
    });
    const [scenarioData, setScenarioData] = useState({
        epicenterZone: '',
        magnitude: 3.0
    });

    useEffect(() => {
        if (isOpen) {
            loadSlopes();
        }
    }, [isOpen]);

    const loadSlopes = async () => {
        try {
            const response = await api.get('/sensors/slopes');
            setSlopes(response.data.slopes || []);
        } catch (error) {
            console.error('Failed to load slopes:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (formData.type === 'alert') {
                await api.post('/alerts/socket/create', {
                    zone: formData.zone,
                    severity: formData.severity
                });
            } else {
                await api.post('/alerts/socket/scenario', {
                    epicenterZone: scenarioData.epicenterZone,
                    magnitude: scenarioData.magnitude
                });
            }

            onSuccess?.();
            onClose();

            // Reset form
            setFormData({ zone: '', severity: 3, type: 'alert' });
            setScenarioData({ epicenterZone: '', magnitude: 3.0 });
        } catch (error) {
            console.error('Failed to create alert:', error);
            alert('Failed to create alert');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    🚨 Create Alert
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Alert Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Alert Type
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className={`flex-1 py-2 px-4 rounded-md ${formData.type === 'alert'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700'
                                    }`}
                                onClick={() => setFormData({ ...formData, type: 'alert' })}
                            >
                                Single Alert
                            </button>
                            <button
                                type="button"
                                className={`flex-1 py-2 px-4 rounded-md ${formData.type === 'scenario'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700'
                                    }`}
                                onClick={() => setFormData({ ...formData, type: 'scenario' })}
                            >
                                Earthquake Scenario
                            </button>
                        </div>
                    </div>

                    {formData.type === 'alert' ? (
                        <>
                            {/* Zone Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Zone / Slope
                                </label>
                                <select
                                    value={formData.zone}
                                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">Select zone...</option>
                                    {slopes.map((slope) => (
                                        <option key={slope.slope_id} value={slope.slope_name}>
                                            {slope.slope_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Severity Level */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Severity Level
                                </label>
                                <div className="flex gap-2">
                                    {[1, 2, 3].map((level) => (
                                        <button
                                            key={level}
                                            type="button"
                                            className={`flex-1 py-2 px-4 rounded-md ${formData.severity === level
                                                ? level === 3
                                                    ? 'bg-red-600 text-white'
                                                    : level === 2
                                                        ? 'bg-orange-600 text-white'
                                                        : 'bg-yellow-600 text-white'
                                                : 'bg-gray-100 text-gray-700'
                                                }`}
                                            onClick={() => setFormData({ ...formData, severity: level })}
                                        >
                                            Level {level}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Level 1: Low | Level 2: Medium | Level 3: High
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Epicenter Zone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Epicenter Zone
                                </label>
                                <select
                                    value={scenarioData.epicenterZone}
                                    onChange={(e) =>
                                        setScenarioData({ ...scenarioData, epicenterZone: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">Select epicenter zone...</option>
                                    {slopes.map((slope) => (
                                        <option key={slope.slope_id} value={slope.slope_name}>
                                            {slope.slope_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Magnitude */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Magnitude
                                </label>
                                <input
                                    type="number"
                                    min="1.0"
                                    max="9.0"
                                    step="0.1"
                                    value={scenarioData.magnitude}
                                    onChange={(e) =>
                                        setScenarioData({
                                            ...scenarioData,
                                            magnitude: parseFloat(e.target.value)
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Richter scale magnitude (1.0 - 9.0)
                                </p>
                            </div>
                        </>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Alert'}
                        </button>
                    </div>
                </form>

                {/* Info Box */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                    <p className="text-xs text-blue-900">
                        <strong>Note:</strong> Alerts are sent to worker bands via Socket.io. Ensure mobile
                        devices are connected to the same network.
                    </p>
                </div>
            </div>
        </div>
    );
}
