"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card } from '@/components/common/Card';
import {
    MapPin, AlertTriangle, Users, MessageSquare,
    FileText, Activity, TrendingUp, Shield
} from 'lucide-react';

export default function GovAuthorityDashboard() {
    const [stats, setStats] = useState({
        totalAlerts: 0,
        recentAlerts: [],
        mineInfo: null,
        todayAlerts: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Load alerts
            const alertsRes = await api.get('/alerts');
            const alerts = alertsRes.data?.data || [];

            // Calculate today's alerts
            const today = new Date().toDateString();
            const todayAlerts = alerts.filter(a =>
                new Date(a.created_at).toDateString() === today
            ).length;

            // Get recent alerts (last 5)
            const recent = alerts.slice(0, 5);

            setStats({
                totalAlerts: alerts.length,
                recentAlerts: recent,
                todayAlerts,
                mineInfo: {
                    name: "Tamil Nadu Limestone Mine",
                    location: "Tamil Nadu, India",
                    status: "Active"
                }
            });
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAlertIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'sos': return '🆘';
            case 'sensor': return '📡';
            case 'ml': return '🤖';
            default: return '⚠️';
        }
    };

    const getAlertColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'text-red-600 bg-red-50 border-red-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default: return 'text-blue-600 bg-blue-50 border-blue-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-7 h-7 text-blue-600" />
                    Government Authority Dashboard
                </h1>
                <p className="text-gray-500 mt-1">Monitoring & Oversight Portal</p>
            </div>

            {/* Mine Overview */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            {stats.mineInfo?.name}
                        </h2>
                        <p className="text-sm text-gray-600 mb-3">{stats.mineInfo?.location}</p>
                        <div className="flex items-center gap-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <Activity className="w-3 h-3 mr-1" />
                                {stats.mineInfo?.status}
                            </span>
                            <Link
                                href="/dashboard/ml/forecast"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                                <TrendingUp className="w-4 h-4" />
                                View ML Analytics
                            </Link>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link href="/dashboard/alerts">
                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Alerts</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalAlerts}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </Card>
                </Link>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Today's Alerts</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.todayAlerts}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <Activity className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </Card>

                <Link href="/dashboard/advisories">
                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Advisories</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">
                                    <FileText className="w-8 h-8 text-blue-600 inline" />
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </Card>
                </Link>

                <Link href="/dashboard/messages">
                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Messages</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">
                                    <MessageSquare className="w-8 h-8 text-green-600 inline" />
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </Card>
                </Link>
            </div>

            {/* Recent Alerts */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Recent Alerts</h2>
                    <Link href="/dashboard/alerts" className="text-sm text-blue-600 hover:underline">
                        View All →
                    </Link>
                </div>

                {stats.recentAlerts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <AlertTriangle className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                        <p>No recent alerts</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {stats.recentAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`flex items-start gap-3 p-4 border rounded-lg ${getAlertColor(alert.severity)}`}
                            >
                                <span className="text-2xl">{getAlertIcon(alert.type)}</span>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">{alert.type?.toUpperCase()} Alert</h3>
                                        <span className="text-xs">
                                            {new Date(alert.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm mt-1">{alert.message || 'No description'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/dashboard/advisories">
                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-600">
                        <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-blue-600" />
                            <div>
                                <h3 className="font-semibold">Send Advisory</h3>
                                <p className="text-sm text-gray-500">Provide guidance to mine admin</p>
                            </div>
                        </div>
                    </Card>
                </Link>

                <Link href="/dashboard/messages">
                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-600">
                        <div className="flex items-center gap-3">
                            <MessageSquare className="w-8 h-8 text-green-600" />
                            <div>
                                <h3 className="font-semibold">Send Message</h3>
                                <p className="text-sm text-gray-500">Communicate with site admin</p>
                            </div>
                        </div>
                    </Card>
                </Link>

                <Link href="/dashboard/ml/forecast">
                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-purple-600">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-purple-600" />
                            <div>
                                <h3 className="font-semibold">View Analytics</h3>
                                <p className="text-sm text-gray-500">ML forecasts & insights</p>
                            </div>
                        </div>
                    </Card>
                </Link>
            </div>

            {/* Info Panel */}
            <Card className="p-6 bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Your Role: Government Authority
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                    <p>✅ Monitor mine safety and compliance</p>
                    <p>✅ Receive notifications about incidents and alerts</p>
                    <p>✅ Send advisories to mine administration</p>
                    <p>✅ Coordinate emergency response (medical, safety)</p>
                    <p>✅ Access ML analytics and forecasts</p>
                    <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                        You are in <strong>oversight mode</strong> - monitoring Tamil Nadu Limestone Mine
                    </p>
                </div>
            </Card>
        </div>
    );
}
