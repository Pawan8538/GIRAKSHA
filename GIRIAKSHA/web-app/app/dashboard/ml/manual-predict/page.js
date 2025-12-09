"use client";

import { useState } from 'react';
import Cookies from 'js-cookie';
import { Card } from '../../../../components/common/Card';
import { Button } from '../../../../components/common/Button';
import { Activity, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

export default function ManualPredictPage() {
    const [loading, setLoading] = useState(false);
    const [prediction, setPrediction] = useState(null);
    const [alert, setAlert] = useState(null);
    const [error, setError] = useState(null);

    const [sensorData, setSensorData] = useState({
        disp_last: 0,
        disp_1h_mean: 0,
        disp_1h_std: 0,
        pore_kpa: 0,
        vibration_g: 0,
        slope_deg: 30,
        aspect_deg: 180,
        curvature: 0.1,
        roughness: 0.5,
        precip_mm_1h: 0,
        temp_c: 25,
        lat: 11.1053,  // Default mine center latitude
        lon: 79.1506   // Default mine center longitude
    });

    const handleInputChange = (field, value) => {
        setSensorData(prev => ({
            ...prev,
            [field]: parseFloat(value) || 0
        }));
    };

    const handlePredict = async () => {
        setLoading(true);
        setError(null);
        setPrediction(null);
        setAlert(null);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const token = Cookies.get('token');

            const response = await fetch(`${API_URL}/ml/manual-predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    slopeId: 'manual-test',
                    sensorData,
                    lat: sensorData.lat,
                    lon: sensorData.lon
                })
            });

            const result = await response.json();

            if (!result.success) {
                setError(result.message || 'Prediction failed');
                return;
            }

            setPrediction(result.data.prediction);
            setAlert(result.data.alert);

        } catch (err) {
            setError(`Failed to connect to server: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level) => {
        const colors = {
            'imminent': 'red',
            'high': 'orange',
            'medium': 'yellow',
            'low': 'green',
            'safe': 'blue'
        };
        return colors[level] || 'gray';
    };

    const getRiskBgClass = (level) => {
        const classes = {
            'imminent': 'bg-red-100 border-red-300',
            'high': 'bg-orange-100 border-orange-300',
            'medium': 'bg-yellow-100 border-yellow-300',
            'low': 'bg-green-100 border-green-300'
        };
        return classes[level] || 'bg-gray-100 border-gray-300';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Manual Sensor Input Testing</h1>
                <p className="text-gray-500">Input sensor values manually to test ML prediction model and generate alerts</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Form */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <Activity className="w-5 h-5 mr-2" />
                        Sensor Parameters
                    </h3>

                    <div className="space-y-4">
                        {/* Displacement */}
                        <div className="border-b pb-3">
                            <h4 className="font-semibold text-sm text-gray-700 mb-2">Displacement (mm)</h4>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-xs text-gray-500">Last Reading</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={sensorData.disp_last}
                                        onChange={(e) => handleInputChange('disp_last', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">1h Mean</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={sensorData.disp_1h_mean}
                                        onChange={(e) => handleInputChange('disp_1h_mean', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">1h Std Dev</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={sensorData.disp_1h_std}
                                        onChange={(e) => handleInputChange('disp_1h_std', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Pore Pressure & Vibration */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 font-semibold">Pore Pressure (kPa)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={sensorData.pore_kpa}
                                    onChange={(e) => handleInputChange('pore_kpa', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border rounded mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-semibold">Vibration (g)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={sensorData.vibration_g}
                                    onChange={(e) => handleInputChange('vibration_g', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border rounded mt-1"
                                />
                            </div>
                        </div>

                        {/* Slope Geometry */}
                        <div className="border-b pb-3">
                            <h4 className="font-semibold text-sm text-gray-700 mb-2">Slope Geometry</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-500">Angle (deg)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={sensorData.slope_deg}
                                        onChange={(e) => handleInputChange('slope_deg', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Aspect (deg)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={sensorData.aspect_deg}
                                        onChange={(e) => handleInputChange('aspect_deg', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Curvature</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={sensorData.curvature}
                                        onChange={(e) => handleInputChange('curvature', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Roughness</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={sensorData.roughness}
                                        onChange={(e) => handleInputChange('roughness', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Weather */}
                        <div>
                            <h4 className="font-semibold text-sm text-gray-700 mb-2">Weather Conditions</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500">Rainfall (mm/h)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={sensorData.precip_mm_1h}
                                        onChange={(e) => handleInputChange('precip_mm_1h', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Temperature (°C)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={sensorData.temp_c}
                                        onChange={(e) => handleInputChange('temp_c', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="border-t pt-3">
                            <h4 className="font-semibold text-sm text-gray-700 mb-2">Marker Location (Grid Cell)</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500">Latitude</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={sensorData.lat}
                                        onChange={(e) => handleInputChange('lat', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                        placeholder="11.102222"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Longitude</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={sensorData.lon}
                                        onChange={(e) => handleInputChange('lon', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                        placeholder="79.156389"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Set exact coordinates for heatmap marker placement</p>
                        </div>

                        <Button
                            onClick={handlePredict}
                            disabled={loading}
                            className="w-full mt-4"
                        >
                            {loading ? 'Analyzing...' : 'Run Prediction'}
                        </Button>
                    </div>
                </Card>

                {/* Results */}
                <div className="space-y-4">
                    {error && (
                        <Card className="p-4 bg-red-50 border-red-200">
                            <div className="flex items-start">
                                <AlertTriangle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-red-900">Error</h4>
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {prediction && (
                        <>
                            <Card className={`p-6 border-2 ${getRiskBgClass(prediction.risk_level)}`}>
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <TrendingUp className="w-5 h-5 mr-2" />
                                    Risk Assessment
                                </h3>

                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm text-gray-600">Risk Score</span>
                                            <span className="text-2xl font-bold">{(prediction.risk_score * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className={`h-3 rounded-full bg-${getRiskColor(prediction.risk_level)}-500`}
                                                style={{ width: `${prediction.risk_score * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                                        <span className="font-semibold text-gray-700">Risk Level</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase text-${getRiskColor(prediction.risk_level)}-700 bg-${getRiskColor(prediction.risk_level)}-100`}>
                                            {prediction.risk_level}
                                        </span>
                                    </div>

                                    {prediction.explainability && (
                                        <div className="mt-4">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Contributing Factors</h4>
                                            <div className="space-y-1">
                                                {Object.entries(prediction.explainability.top_features).slice(0, 4).map(([feature, value]) => (
                                                    <div key={feature} className="flex justify-between text-xs">
                                                        <span className="text-gray-600">{feature.replace('_', ' ')}</span>
                                                        <span className="font-mono">{(value * 100).toFixed(1)}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {alert && (
                                <Card className="p-4 bg-red-50 border-2 border-red-300">
                                    <div className="flex items-start">
                                        <AlertTriangle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-red-900 mb-1">Alert Generated</h4>
                                            <p className="text-sm text-red-800">{alert.message}</p>
                                            <p className="text-xs text-red-600 mt-2">
                                                Alert ID: {alert.id} | Severity: {alert.severity.toUpperCase()}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {!alert && (
                                <Card className="p-4 bg-green-50 border-green-200">
                                    <div className="flex items-start">
                                        <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-bold text-green-900">No Alert Required</h4>
                                            <p className="text-sm text-green-700">Risk level is within acceptable thresholds</p>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </>
                    )}

                    {!prediction && !error && !loading && (
                        <Card className="p-8 text-center">
                            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Enter sensor values and click "Run Prediction" to see results</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
