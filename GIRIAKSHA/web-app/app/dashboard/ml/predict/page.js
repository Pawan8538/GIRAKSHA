"use client";

import { Card } from '../../../../components/common/Card';
import ForecastChart from '../../../../components/ml/ForecastChart';

export default function PredictionPage() {
    // Reuse forecast chart with different data for long-term prediction
    const data = [
        { time: 'Day 1', risk_score: 20 },
        { time: 'Day 2', risk_score: 25 },
        { time: 'Day 3', risk_score: 22 },
        { time: 'Day 4', risk_score: 30 },
        { time: 'Day 5', risk_score: 45 },
        { time: 'Day 6', risk_score: 40 },
        { time: 'Day 7', risk_score: 35 },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Long-term Risk Prediction</h1>
                <p className="text-gray-500">7-Day stability forecast model</p>
            </div>

            <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Projected Stability Index</h3>
                <ForecastChart data={data} />
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                    <h4 className="font-bold text-yellow-800">model_v2_prediction:</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                        Increasing instability detected around Day 5 due to predicted rainfall patterns.
                        Recommended action: Increase monitoring frequency in Sector 3.
                    </p>
                </div>
            </Card>
        </div>
    );
}
