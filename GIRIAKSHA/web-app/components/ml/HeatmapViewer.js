"use client";

import dynamic from 'next/dynamic';
import { Card } from '../common/Card';
import { Loader2 } from 'lucide-react';

const HeatmapMap = dynamic(() => import('./HeatmapMap'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
    ),
});

export default function HeatmapViewer({ points, center, zoom }) {
    return (
        <div className="h-[600px] w-full border border-gray-200 rounded-lg overflow-hidden relative z-0">
            <HeatmapMap points={points} center={center} zoom={zoom} />
        </div>
    );
}
