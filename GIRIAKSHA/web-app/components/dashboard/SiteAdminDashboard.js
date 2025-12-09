"use client";

import { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboardService';
import StatsCard from './StatsCard';
import { Users, Radio, AlertTriangle, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardTitle, CardContent } from '../common/Card';
import RiskBadge from '../common/RiskBadge';

export default function SiteAdminDashboard({ user }) {
    const [stats, setStats] = useState({
        activeWorkers: 0,
        onlineSensors: 0,
        todaysAlerts: 0,
        currentRisk: 35 // Mock value
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (user?.slope_id) {
                    const workers = await dashboardService.getWorkers(user.slope_id);
                    setStats(prev => ({
                        ...prev,
                        activeWorkers: workers.length,
                        onlineSensors: 15, // Mock
                        todaysAlerts: 2,   // Mock
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch site dashboard data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const riskData = [
        { time: '00:00', risk: 20 },
        { time: '04:00', risk: 18 },
        { time: '08:00', risk: 45 },
        { time: '12:00', risk: 35 },
        { time: '16:00', risk: 28 },
        { time: '20:00', risk: 22 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mine Overview</h1>
                    <p className="text-gray-500">Monitoring: <span className="font-semibold text-gray-900">Limestone Mine Alpha</span></p>
                </div>
                <RiskBadge level="medium" score={0.35} className="text-base px-4 py-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Active Workers"
                    value={Math.max(0, Math.floor(stats.activeWorkers))}
                    icon={Users}
                    color="blue"
                    loading={loading}
                    trend={{ value: 5, label: 'on shift', direction: 'neutral', unit: '' }}
                />
                <StatsCard
                    title="Online Sensors"
                    value={stats.onlineSensors}
                    icon={Radio}
                    color="green"
                    loading={loading}
                />
                <StatsCard
                    title="Today's Alerts"
                    value={stats.todaysAlerts}
                    icon={AlertTriangle}
                    color="red"
                    loading={loading}
                    trend={{ value: 2, label: 'resolved', direction: 'up' }}
                />
                <StatsCard
                    title="Current Risk Score"
                    value={`${stats.currentRisk}%`}
                    icon={Activity}
                    color="orange"
                    loading={loading}
                    trend={{ value: 5, label: 'vs avg', direction: 'down' }}
                />
            </div>

            {/* Real-time Chart */}
            <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <CardTitle>Real-time Risk Trend</CardTitle>
                    <div className="flex gap-2">
                        <span className="flex items-center text-xs text-gray-500">
                            <span className="w-2 h-2 bg-orange-400 rounded-full mr-1"></span> Risk Level
                        </span>
                    </div>
                </div>
                <CardContent className="h-80 pl-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={riskData}>
                            <defs>
                                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                            <Tooltip />
                            <Area type="monotone" dataKey="risk" stroke="#f97316" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
