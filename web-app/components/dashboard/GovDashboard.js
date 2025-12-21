"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card } from '../common/Card';
import {
    MapPin, AlertTriangle, MessageSquare,
    FileText, Activity, TrendingUp, Shield
} from 'lucide-react';

export default function GovDashboard({ user }) {
    const [stats, setStats] = useState({
        totalAlerts: 0,
        recentAlerts: [],
        todayAlerts: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            // Load alerts
            const alertsRes = await api.get('/alerts');
            const alerts = alertsRes.data?.data || [];

            // Calculate today's alerts
            const today = new Date().toDateString();
            const todayAlerts = alerts.filter(a =>
                new Date(a.created_at).toDateString() === today
            ).length;

            setStats({
                totalAlerts: alerts.length,
                recentAlerts: alerts.slice(0, 5),
                todayAlerts
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
            case 'critical': return 'border-l-4 border-red-500 bg-red-50';
            case 'high': return 'border-l-4 border-orange-500 bg-orange-50';
            case 'medium': return 'border-l-4 border-yellow-500 bg-yellow-50';
            default: return 'border-l-4 border-blue-500 bg-blue-50';
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
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-8 h-8" />
                    <h1 className="text-2xl font-bold">Government Authority Dashboard</h1>
                </div>
                <p className="text-blue-100">Monitoring & Oversight Portal</p>
                <p className="text-sm text-blue-200 mt-2">Department: {user.department || 'General Oversight'}</p>
            </div>

            {/* Mine Overview */}
            <Card className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-blue-200">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            Tamil Nadu Limestone Mine
                        </h2>
                        <p className="text-sm text-gray-600 mb-3">Tamil Nadu, India</p>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <Activity className="w-3 h-3 mr-1" />
                                Active
                            </span>
                            <Link
                                href="/dashboard/ml/forecast"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                                <TrendingUp className="w-4 h-4" />
                                View ML Analytics →
                            </Link>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link href="/dashboard/alerts">
                    <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-t-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Alerts</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalAlerts}</p>
                                <p className="text-xs text-gray-500 mt-1">All notifications</p>
                            </div>
                            <AlertTriangle className="w-12 h-12 text-red-500 opacity-20" />
                        </div>
                    </Card>
                </Link>

                <Card className="p-6 border-t-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Today's Alerts</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.todayAlerts}</p>
                            <p className="text-xs text-gray-500 mt-1">In last 24 hours</p>
                        </div>
                        <Activity className="w-12 h-12 text-orange-500 opacity-20" />
                    </div>
                </Card>

                <Link href="/dashboard/advisories">
                    <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-t-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Advisories</p>
                                <p className="text-sm text-gray-900 mt-2 font-medium">Send Guidance</p>
                                <p className="text-xs text-gray-500 mt-1">To mine admin</p>
                            </div>
                            <FileText className="w-12 h-12 text-blue-500 opacity-20" />
                        </div>
                    </Card>
                </Link>

                <Link href="/dashboard/messages">
                    <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-t-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Messages</p>
                                <p className="text-sm text-gray-900 mt-2 font-medium">Communicate</p>
                                <p className="text-xs text-gray-500 mt-1">With site admin</p>
                            </div>
                            <MessageSquare className="w-12 h-12 text-green-500 opacity-20" />
                        </div>
                    </Card>
                </Link>
            </div>

            {/* Recent Alerts */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Recent Alerts from Mine
                    </h2>
                    <Link href="/dashboard/alerts" className="text-sm text-blue-600 hover:underline">
                        View All →
                    </Link>
                </div>

                {stats.recentAlerts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <AlertTriangle className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                        <p>No recent alerts</p>
                        <p className="text-sm text-gray-400 mt-1">System is operating normally</p>
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
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-semibold text-gray-900">
                                            {alert.type?.toUpperCase()} Alert
                                            {alert.severity && (
                                                <span className={`ml-2 text-xs px-2 py-0.5 rounded ${alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                                        alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {alert.severity}
                                                </span>
                                            )}
                                        </h3>
                                        <span className="text-xs text-gray-500">
                                            {new Date(alert.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{alert.message || 'No description'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/dashboard/advisories">
                    <Card className="p-6 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-600">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Send Advisory</h3>
                                <p className="text-sm text-gray-600">Provide guidance to mine</p>
                            </div>
                        </div>
                    </Card>
                </Link>

                <Link href="/dashboard/messages">
                    <Card className="p-6 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-green-50 to-white border-l-4 border-green-600">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Direct Message</h3>
                                <p className="text-sm text-gray-600">Communicate with admin</p>
                            </div>
                        </div>
                    </Card>
                </Link>

                <Link href="/dashboard/ml/forecast">
                    <Card className="p-6 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-purple-50 to-white border-l-4 border-purple-600">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">View Analytics</h3>
                                <p className="text-sm text-gray-600">ML forecasts & insights</p>
                            </div>
                        </div>
                    </Card>
                </Link>
            </div>

            {/* Role Info */}
            <Card className="p-6 bg-gradient-to-r from-gray-50 to-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Your Authority Role
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2 text-gray-700">
                        <p className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">✓</span>
                            <span>Monitor mine safety & compliance</span>
                        </p>
                        <p className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">✓</span>
                            <span>Receive real-time incident notifications</span>
                        </p>
                        <p className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">✓</span>
                            <span>Send advisories to mine administration</span>
                        </p>
                    </div>
                    <div className="space-y-2 text-gray-700">
                        <p className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">✓</span>
                            <span>Coordinate emergency response</span>
                        </p>
                        <p className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">✓</span>
                            <span>Access ML analytics & forecasts</span>
                        </p>
                        <p className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">✓</span>
                            <span>View sensor data & reports</span>
                        </p>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
                    <strong>Note:</strong> You are in oversight mode for Tamil Nadu Limestone Mine.
                    Use Advisories and Messages to coordinate with site administration.
                </p>
            </Card>
        </div>
    );
}
