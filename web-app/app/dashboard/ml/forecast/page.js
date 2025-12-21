"use client";

import { useState, useEffect } from 'react';
import ForecastChart from '../../../../components/ml/ForecastChart';
import { Card } from '../../../../components/common/Card';
import { Clock, AlertTriangle, CloudRain, Wind } from 'lucide-react';
import { mlService } from '../../../../services/mlService';

export default function ForecastPage() {
    const [slopes, setSlopes] = useState([]);
    const [selectedSlope, setSelectedSlope] = useState('');
    const [forecastData, setForecastData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load mines from API or use mock data
        setSlopes([{ id: '1', name: 'Limestone Mine - Dindigul' }]);
        setSelectedSlope('1');
    }, []);

    useEffect(() => {
        if (selectedSlope) {
            loadForecastData();
        }
    }, [selectedSlope]);

    const loadForecastData = async () => {
        if (!selectedSlope) return;

        setLoading(true);
        try {
            const data = await mlService.getForecast(selectedSlope);
            setForecastData(data);
        } catch (error) {
            console.error('Failed to load forecast data', error);
        } finally {
            setLoading(false);
        }
    };

    const currentAssessment = forecastData?.currentAssessment;
    const maxRisk = forecastData?.forecast ? Math.max(...forecastData.forecast) : 0;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Risk Forecast (72 Hours)</h1>
                    <p className="text-gray-500">AI-powered predictive analysis with weather integration</p>
                </div>
            </div>

            {/* Slope Selector */}
            <Card className="p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Mine</label>
                <select
                    value={selectedSlope}
                    onChange={(e) => setSelectedSlope(e.target.value)}
                    className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {slopes.map(slope => (
                        <option key={slope.id} value={slope.id}>{slope.name}</option>
                    ))}
                </select>
            </Card>

            {/* Current Assessment */}
            {currentAssessment && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 bg-blue-50 border-blue-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-900">Base Risk</p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {(currentAssessment.base_risk * 100).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6 bg-orange-50 border-orange-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                                <CloudRain className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-orange-900">Enhanced Risk</p>
                                <p className="text-2xl font-bold text-orange-700">
                                    {(currentAssessment.enhanced_risk * 100).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6 bg-purple-50 border-purple-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                                <Wind className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-purple-900">Weather Impact</p>
                                <p className="text-2xl font-bold text-purple-700">
                                    {currentAssessment.weather_impact ?
                                        `${(currentAssessment.weather_impact.total_impact * 100).toFixed(1)}%` : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Forecast Chart */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">72-Hour Risk Trend</h3>
                {loading ? (
                    <div className="h-96 flex items-center justify-center text-gray-500">Loading forecast data...</div>
                ) : forecastData ? (
                    <ForecastChart data={forecastData} />
                ) : (
                    <div className="h-96 flex items-center justify-center text-gray-500">
                        Select a mine to view forecast
                    </div>
                )}
            </Card>

            {/* Weather Impact Breakdown */}
            {currentAssessment?.weather_impact && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Weather Impact Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">24h Rainfall</p>
                            <p className="text-lg font-bold text-gray-900">
                                {currentAssessment.weather_impact.rainfall_24h?.toFixed(1) || 'N/A'} mm
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">72h Rainfall</p>
                            <p className="text-lg font-bold text-gray-900">
                                {currentAssessment.weather_impact.rainfall_72h?.toFixed(1) || 'N/A'} mm
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Condition</p>
                            <p className="text-lg font-bold text-gray-900">
                                {currentAssessment.weather_impact.condition || 'N/A'}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Max Intensity</p>
                            <p className="text-lg font-bold text-gray-900">
                                {currentAssessment.weather_impact.max_intensity?.toFixed(1) || 'N/A'} mm/h
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
