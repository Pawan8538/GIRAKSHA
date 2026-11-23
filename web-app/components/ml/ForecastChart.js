"use client";

import { 
    ResponsiveContainer, ComposedChart, Line, Area, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine 
} from 'recharts';

export default function ForecastChart({ data }) {
    if (!data || !data.timestamps || !data.forecast) {
        return (
            <div className="h-96 w-full flex items-center justify-center text-gray-500 font-mono text-sm">
                No forecast data available
            </div>
        );
    }

    // Transform data for chart ensuring numeric values for Recharts scale
    const chartData = data.timestamps.map((timestamp, index) => {
        const enhancedVal = data.forecast[index] !== undefined ? Number((data.forecast[index] * 100).toFixed(1)) : 0;
        const baseVal = data.baseRiskTrend && data.baseRiskTrend[index] !== undefined 
            ? Number((data.baseRiskTrend[index] * 100).toFixed(1)) 
            : null;

        return {
            time: timestamp,
            risk: enhancedVal,
            baseRisk: baseVal,
            riskValue: data.forecast[index]
        };
    });

    return (
        <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                            <stop offset="50%" stopColor="#eab308" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis
                        domain={[0, 100]}
                        ticks={[0, 25, 35, 60, 75, 100]}
                        stroke="#64748b"
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Risk Probability (%)', angle: -90, position: 'insideLeft', offset: 0, fill: '#64748b', fontSize: 11 }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}
                        formatter={(value, name) => [`${value}%`, name]}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                    
                    {/* Research Paper Table 3 Threshold Reference Lines */}
                    <ReferenceLine y={60} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'High Alert (60%)', position: 'insideTopRight', fill: '#f97316', fontSize: 10 }} />
                    <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Imminent (75%)', position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }} />

                    <Area
                        type="monotone"
                        dataKey="risk"
                        stroke="#f97316"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRisk)"
                        name="Enhanced Risk (% with Ingress)"
                    />
                    <Line
                        type="monotone"
                        dataKey="baseRisk"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 3, fill: '#3b82f6' }}
                        name="Base ML Geotechnical Risk (%)"
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}

