"use client";

import { useEffect, useState } from 'react';
import { Card } from '../common/Card';
import { Loader2, AlertTriangle, CheckCircle, Wind, Droplets, Activity, Thermometer } from 'lucide-react';
import api from '../../lib/api';

const RiskGauge = ({ level, score }) => {
    const getColor = (l) => {
        switch (l?.toLowerCase()) {
            case 'imminent': return 'text-red-600 bg-red-100 border-red-200';
            case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
            case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
            default: return 'text-green-600 bg-green-100 border-green-200';
        }
    };

    const colorClass = getColor(level);

    return (
        <div className={`flex flex-col items-center justify-center p-6 rounded-full border-4 w-48 h-48 ${colorClass}`}>
            <span className="text-3xl font-bold">{Math.round(score * 100)}%</span>
            <span className="text-sm font-medium uppercase mt-2">{level || 'SAFE'}</span>
        </div>
    );
};

const FactorBar = ({ label, value, color = "bg-blue-500" }) => (
    <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-700">{label}</span>
            <span className="text-gray-500">{Math.round(value * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
            <div
                className={`h-2 rounded-full ${color}`}
                style={{ width: `${Math.min(value * 100, 100)}%` }}
            ></div>
        </div>
    </div>
);

export default function MLPredictionDashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [error, setError] = useState(null);

    const [isPolling, setIsPolling] = useState(true);

    useEffect(() => {
        loadData(); // Initial load

        const interval = setInterval(() => {
            if (isPolling && document.visibilityState === 'visible') {
                loadData();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [isPolling]);

    const loadData = async () => {
        try {
            setLoading(true);
            const riskRes = await api.get('http://localhost:8000/risk/current'); // Direct ML service call or via proxy
            // Note: In production this should go through the main backend proxy

            if (riskRes.data) {
                setData(riskRes.data);

                // Fetch explanation for interpretable results
                try {
                    const explainRes = await api.get(`http://localhost:8000/explain/current?slopeId=${riskRes.data.slopeId}`);
                    setExplanation(explainRes.data.data);
                } catch (e) {
                    console.warn("Could not fetch explanation", e);
                }
            }
        } catch (err) {
            console.error(err);
            // Fallback mock data if ML service is offline
            setData({
                slopeId: "slope_1",
                timestamp: new Date().toISOString(),
                enhanced_risk: 0.65,
                risk_level: "high",
                sources: {
                    xgboost: { risk_score: 0.62, risk_level: "high" },
                    vision: { risk_score: 0.75, risk_level: "imminent" },
                    sensors: {
                        max_disp_mm: 12.5,
                        max_pore_kpa: 45.2,
                        max_vib_g: 0.05
                    }
                },
                weather_data: {
                    temperature: 32.5,
                    rainfall_24h: 12.0,
                    max_rain_intensity: 5.5
                },
                weather_impact: 0.15
            });
            setError("Using simulated data (ML Service unreachable)");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    const sens = data?.sources?.sensors || {};
    const xgb = data?.sources?.xgboost || {};
    const vision = data?.sources?.visual || {};
    const weather = data?.weather_data || {};

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Level Risk Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 flex items-center justify-center p-6">
                    <RiskGauge level={data?.risk_level} score={data?.enhanced_risk} />
                </Card>

                <Card className="md:col-span-2 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Fusion Engine Analysis</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-sm text-gray-500 uppercase">Primary Model (XGBoost)</h4>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-blue-600">{(xgb.risk_score * 100).toFixed(1)}%</span>
                                <span className="text-sm text-gray-500">Confidence</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Analyzes geotechnical sensor arrays</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-sm text-gray-500 uppercase">Vision Model (CNN)</h4>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-purple-600">{(vision.risk_score * 100).toFixed(1)}%</span>
                                <span className="text-sm text-gray-500">Confidence</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Detects surface cracks from feeds</p>
                        </div>
                    </div>
                    {explanation && (
                        <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-sm rounded border border-blue-100">
                            <strong>AI Insight:</strong> {explanation.explanation}
                        </div>
                    )}
                </Card>
            </div>

            {/* Detailed Factors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Model Contribution Factors</h3>
                    <div className="space-y-4">
                        <FactorBar label="Displacement (Ground Movement)" value={sens.max_disp_mm / 20} color="bg-red-500" />
                        <FactorBar label="Pore Water Pressure" value={sens.max_pore_kpa / 100} color="bg-blue-500" />
                        <FactorBar label="Seismic Vibration" value={sens.max_vib_g * 10} color="bg-yellow-500" />
                        <FactorBar label="Visual Anomalies (Crack Logic)" value={vision.risk_score} color="bg-purple-500" />
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Dynamic Environmental Factors</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                            <Droplets className="text-blue-500" />
                            <div>
                                <p className="text-xs text-gray-500">Rainfall (1h)</p>
                                <p className="font-bold">{weather.max_rain_intensity || weather.rainfall_24h || 0} mm</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                            <Thermometer className="text-orange-500" />
                            <div>
                                <p className="text-xs text-gray-500">Temperature</p>
                                <p className="font-bold">{weather.temperature || 0}°C</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                            <Activity className="text-indigo-500" />
                            <div>
                                <p className="text-xs text-gray-500">Seismic Activity</p>
                                <p className="font-bold">{sens.max_vib_g} g</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                            <Wind className="text-teal-500" />
                            <div>
                                <p className="text-xs text-gray-500">Weather Impact</p>
                                <p className="font-bold">+{(data?.weather_impact * 100).toFixed(0)}% Risk</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Comprehensive Sensor Data Table */}
            <Card className="p-6 border-t-4 border-blue-500">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Live Sensor Array Breakdown
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Geotechnical Column */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-700 border-b pb-2">Geotechnical</h4>
                        <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Max Displacement</span>
                                <span className="font-mono font-medium">{sens.max_disp_mm} mm</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Pore Pressure</span>
                                <span className="font-mono font-medium">{sens.max_pore_kpa} kPa</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Vibration (Peak)</span>
                                <span className="font-mono font-medium">{sens.max_vib_g} g</span>
                            </div>
                        </div>
                    </div>

                    {/* Environmental Column */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-blue-700 border-b pb-2">Environmental</h4>
                        <div className="bg-blue-50 p-3 rounded text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-blue-900">Rainfall (Last 1h)</span>
                                <span className="font-mono font-medium text-blue-800">{weather.max_rain_intensity || weather.rainfall_24h || 0} mm</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blue-900">Temperature</span>
                                <span className="font-mono font-medium text-blue-800">{weather.temperature || 0} °C</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blue-900">Weather Impact</span>
                                <span className="font-mono font-medium text-blue-800">{(data?.weather_impact * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Geometric/Other Column */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-700 border-b pb-2">Geometric & System</h4>
                        <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Slope ID</span>
                                <span className="font-mono font-medium">{data?.slopeId || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Last Update</span>
                                <span className="font-mono font-medium text-xs">
                                    {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'Live'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Active Sensors</span>
                                <span className="font-mono font-medium text-green-600">ONLINE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
