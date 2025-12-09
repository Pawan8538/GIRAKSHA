"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';

export default function ForecastChart({ data }) {
    if (!data || !data.timestamps || !data.forecast) {
        return (
            <div className="h-96 w-full flex items-center justify-center text-gray-500">
                No forecast data available
            </div>
        );
    }

    // Transform data for chart
    const chartData = data.timestamps.map((timestamp, index) => ({
        time: timestamp,
        risk: (data.forecast[index] * 100).toFixed(1), // Convert to percentage
        baseRisk: data.baseRiskTrend ? (data.baseRiskTrend[index] * 100).toFixed(1) : null,
        riskValue: data.forecast[index]
    }));

    return (
        <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                        dataKey="time"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        label={{ value: 'Risk Score (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '8px'
                        }}
                        formatter={(value) => [`${value}%`, 'Risk Score']}
                    />
                    <Legend />
                    <Area
                        type="monotone"
                        dataKey="risk"
                        stroke="#f97316"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRisk)"
                        name="Enhanced Risk (%)"
                    />
                    <Line
                        type="monotone"
                        dataKey="baseRisk"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Base ML Risk (%)"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

