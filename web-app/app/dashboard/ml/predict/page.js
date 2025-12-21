"use client";

import MLPredictionDashboard from '../../../../components/ml/MLPredictionDashboard';

export default function PredictionPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    Live Prediction Modeling
                    <span className="flex items-center px-2 py-0.5 ml-3 rounded-full bg-green-100 text-green-700 text-xs font-bold animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                        LIVE
                    </span>
                </h1>
                <p className="text-gray-500">Real-time breakdown of Fusion Engine analysis and model contributors</p>
            </div>

            <MLPredictionDashboard />
        </div>
    );
}
