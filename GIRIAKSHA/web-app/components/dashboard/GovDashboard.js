"use client";

import { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboardService';
import StatsCard from './StatsCard';
import { Map, AlertTriangle, Bell, ShieldCheck } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../common/Card';
import RiskBadge from '../common/RiskBadge';

export default function GovDashboard() {
    const [stats, setStats] = useState({
        totalMines: 0,
        highRiskMines: 0,
        activeAdvisories: 0,
        complianceRate: 98
    });
    const [mines, setMines] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const minesList = await dashboardService.getGovMines();
                setMines(minesList);

                setStats({
                    totalMines: minesList.length,
                    highRiskMines: minesList.filter(m => m.risk_level === 'high' || m.risk_level === 'imminent').length,
                    activeAdvisories: 3, // Mock
                    complianceRate: 92 // Mock
                });
            } catch (error) {
                console.error('Failed to fetch gov dashboard data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Regional Oversight</h1>
                <p className="text-gray-500">Authority Panel • Tamil Nadu Region</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Monitored Mines"
                    value={stats.totalMines}
                    icon={Map}
                    color="blue"
                    loading={loading}
                />
                <StatsCard
                    title="High Risk Sites"
                    value={stats.highRiskMines}
                    icon={AlertTriangle}
                    color="red"
                    loading={loading}
                    trend={{ value: 1, label: 'increase', direction: 'up' }}
                />
                <StatsCard
                    title="Active Advisories"
                    value={stats.activeAdvisories}
                    icon={Bell}
                    color="orange"
                    loading={loading}
                />
                <StatsCard
                    title="Compliance Rate"
                    value={`${stats.complianceRate}%`}
                    icon={ShieldCheck}
                    color="green"
                    loading={loading}
                    trend={{ value: 2, label: 'vs last audit', direction: 'up' }}
                />
            </div>

            {/* Mines List Table */}
            <Card className="overflow-hidden">
                <CardTitle className="p-6 pb-4 border-b border-gray-100">Regional Mine Status</CardTitle>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Mine Name</th>
                                <th className="px-6 py-3">Location</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Last Update</th>
                                <th className="px-6 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mines.map((mine) => (
                                <tr key={mine.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{mine.name}</td>
                                    <td className="px-6 py-4">{mine.lat.toFixed(4)}, {mine.lng.toFixed(4)}</td>
                                    <td className="px-6 py-4">
                                        <RiskBadge level={mine.risk_level} />
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">2 mins ago</td>
                                    <td className="px-6 py-4">
                                        <button className="text-blue-600 hover:underline">View Details</button>
                                    </td>
                                </tr>
                            ))}
                            {mines.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No mines found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
