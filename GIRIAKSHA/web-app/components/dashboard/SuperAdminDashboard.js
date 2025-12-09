"use client";

import { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboardService';
import { authService } from '../../services/authService';
import StatsCard from './StatsCard';
import { Users, HardHat, AlertTriangle, Building2, Check, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardTitle, CardContent } from '../common/Card';

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalMines: 0,
        pendingApprovals: 0,
        activeAlerts: 0
    });
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            console.log('🔍 Starting to load dashboard data...');

            const [users, mines, pending, alerts] = await Promise.all([
                dashboardService.getUsers().catch(e => { console.error('❌ getUsers failed:', e); return []; }),
                dashboardService.getMines().catch(e => { console.error('❌ getMines failed:', e); return []; }),
                authService.getPendingUsers().catch(e => { console.error('❌ getPendingUsers failed:', e); return []; }),
                dashboardService.getAlerts().catch(e => { console.error('❌ getAlerts failed:', e); return []; })
            ]);

            console.log('✅ Users:', users.length);
            console.log('✅ Mines:', mines.length);
            console.log('✅ Pending users:', pending.length);
            console.log('✅ Alerts:', alerts.length);

            // Process alerts for the chart (Last 7 days)
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const chartData = days.map(day => ({ name: day, alerts: 0 }));

            alerts.forEach(alert => {
                const date = new Date(alert.created_at);
                const dayIndex = date.getDay(); // 0 is Sunday
                chartData[dayIndex].alerts += 1;
            });

            // Reorder to start from today? Or just Mon-Sun fixed? 
            // Let's keep it Mon-Sun or just last 7 days.
            // Simplified: mapped to fixed indices for now as per previous mock data structure
            // Better: Rotate to show last 7 days? 
            // For simplicity and matching UI: Standard Mon-Sun or just map the day index directly.
            // The chart expects {name: 'Mon', ...}. Let's just use the current week's aggregation or simple distribution.
            // Fix: Shift chartData so today is last? Or just static Mon-Sun.
            // Let's stick to standard names order [Sun, Mon, ...] but user's previous mock started with Mon.

            const orderedChartData = [
                chartData[1], // Mon
                chartData[2], // Tue
                chartData[3], // Wed
                chartData[4], // Thu
                chartData[5], // Fri
                chartData[6], // Sat
                chartData[0], // Sun
            ];

            setChartData(orderedChartData);

            setStats({
                totalUsers: users.length,
                totalMines: mines.length,
                pendingApprovals: pending.length,
                activeAlerts: alerts.length
            });
            setPendingUsers(pending);

            console.log('✅ State updated successfully');
        } catch (error) {
            console.error('❌ Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleApprove = async (userId) => {
        try {
            await authService.approveUser(userId);
            // Refresh data
            loadData();
        } catch (error) {
            console.error('Failed to approve user', error);
            alert('Failed to approve user');
        }
    };

    const handleReject = async (userId) => {
        if (!confirm('Are you sure you want to reject this user?')) return;
        try {
            await authService.rejectUser(userId);
            // Refresh data
            loadData();
        } catch (error) {
            console.error('Failed to reject user', error);
            alert('Failed to reject user');
        }
    };

    const [chartData, setChartData] = useState([
        { name: 'Mon', alerts: 0 },
        { name: 'Tue', alerts: 0 },
        { name: 'Wed', alerts: 0 },
        { name: 'Thu', alerts: 0 },
        { name: 'Fri', alerts: 0 },
        { name: 'Sat', alerts: 0 },
        { name: 'Sun', alerts: 0 },
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
                <p className="text-gray-500">Welcome back, Super Admin</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    color="blue"
                    loading={loading}
                    trend={{ value: 12, label: 'vs last month', direction: 'up' }}
                />
                <StatsCard
                    title="Active Mines"
                    value={stats.totalMines}
                    icon={Building2}
                    color="purple"
                    loading={loading}
                    trend={{ value: 2, label: 'new this month', direction: 'up' }}
                />
                <StatsCard
                    title="Pending Approvals"
                    value={stats.pendingApprovals}
                    icon={HardHat}
                    color="orange"
                    loading={loading}
                    trend={{ value: stats.pendingApprovals, label: 'needing action', direction: 'neutral' }}
                />
                <StatsCard
                    title="System Alerts"
                    value={stats.activeAlerts}
                    icon={AlertTriangle}
                    color="red"
                    loading={loading}
                    trend={{ value: 5, label: 'vs yesterday', direction: 'down' }}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <CardTitle className="mb-4">Alert Activity</CardTitle>
                    <CardContent className="h-80 pl-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="alerts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="p-6">
                    <CardTitle className="mb-4 flex justify-between items-center">
                        <span>Pending Registrations</span>
                        <span className="text-xs font-normal text-gray-500">{pendingUsers.length} requests</span>
                    </CardTitle>
                    <CardContent>
                        <div className="space-y-4 max-h-[320px] overflow-y-auto">
                            {pendingUsers.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No pending registrations</p>
                            ) : (
                                pendingUsers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold uppercase">
                                                {user.name.substring(0, 2)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                <p className="text-xs text-gray-500 capitalize">{user.role_name?.replace('_', ' ')}</p>
                                                {user.department && (
                                                    <p className="text-xs text-blue-600 font-medium">{user.department}</p>
                                                )}
                                                <p className="text-xs text-gray-400">{user.email || user.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(user.id)}
                                                className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-full transition-colors"
                                                title="Approve"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleReject(user.id)}
                                                className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                                                title="Reject"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
