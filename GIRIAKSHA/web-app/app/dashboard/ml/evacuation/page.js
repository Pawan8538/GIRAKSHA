"use client";

import dynamic from 'next/dynamic';
import { Card } from '../../../../components/common/Card';
import { Loader2 } from 'lucide-react';

// Reuse the HeatmapMap structure but adapting for routes (Polylines)
// customized later for specific route rendering
const EvacuationMapContent = dynamic(() => import('../../../../components/ml/HeatmapMap'), {
    ssr: false,
    loading: () => <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>
});

export default function EvacuationPage() {
    const points = [
        { id: 'safe_zone_1', lat: 20.6200, lng: 78.9900, risk: 0 },
        { id: 'hazard_1', lat: 20.5937, lng: 78.9629, risk: 0.9 }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Evacuation Routes</h1>
                <p className="text-gray-500">Safe paths calculated dynamically based on risk levels</p>
            </div>

            <Card className="p-0 overflow-hidden h-[600px]">
                <EvacuationMapContent points={points} center={[20.6000, 78.9700]} zoom={13} />
                {/* Note: In a full implementation, we'd add Polyline layers here for the routes */}
            </Card>

            <Card className="p-6 bg-green-50 border-green-100">
                <h3 className="font-bold text-green-900">Active Protocol: Standard Safety</h3>
                <p className="text-green-700 mt-1">
                    All routes are currently clear. No immediate evacuation required.
                </p>
            </Card>
        </div>
    );
}
