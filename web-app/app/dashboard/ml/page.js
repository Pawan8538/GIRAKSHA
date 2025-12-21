"use client";

import Link from 'next/link';
import { Card } from '../../../components/common/Card';
import { Activity, Map as MapIcon, Clock, AlertTriangle, Search, Ruler } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

export default function MLHubPage() {
    const { user } = useAuth();

    // Check if user is Site Admin or Super Admin
    const canAccessManualPredict = user && ['SITE_ADMIN', 'SUPER_ADMIN'].includes(user.role);

    const allTools = [
        {
            title: 'Risk Heatmap',
            description: 'Geospatial observation of high-risk zones',
            icon: MapIcon,
            href: '/dashboard/ml/heatmap',
            color: 'bg-blue-100 text-blue-600'
        },
        {
            title: '72hr Forecast',
            description: 'Predictive stability models for upcoming shifts',
            icon: Clock,
            href: '/dashboard/ml/forecast',
            color: 'bg-green-100 text-green-600'
        },
        {
            title: 'Evacuation Routes',
            description: 'Dynamic safe path calculation',
            icon: Activity,
            href: '/dashboard/ml/evacuation',
            color: 'bg-red-100 text-red-600'
        },
        {
            title: 'Crack Detection',
            description: 'Computer vision analysis of site images',
            icon: Search,
            href: '/dashboard/ml/detect',
            color: 'bg-purple-100 text-purple-600'
        },
        {
            title: 'Risk Prediction',
            description: 'Long-term structural integrity forecasting',
            icon: AlertTriangle,
            href: '/dashboard/ml/predict',
            color: 'bg-orange-100 text-orange-600'
        },
        {
            title: 'Manual Prediction Testing',
            description: 'Test ML model with manual sensor inputs',
            icon: Ruler,
            href: '/dashboard/ml/manual-predict',
            color: 'bg-yellow-100 text-yellow-600',
            adminOnly: true
        }
    ];

    // Filter tools based on user role
    const tools = allTools.filter(tool => !tool.adminOnly || canAccessManualPredict);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">ML Analytics Suite</h1>
                <p className="text-gray-500">Advanced AI tools for mine safety and monitoring</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                    <Link key={tool.title} href={tool.href}>
                        <Card className="h-full hover:shadow-md transition-shadow cursor-pointer p-6">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tool.color}`}>
                                <tool.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{tool.title}</h3>
                            <p className="text-sm text-gray-500">{tool.description}</p>
                            {tool.adminOnly && (
                                <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
                                    Admin Only
                                </span>
                            )}
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
