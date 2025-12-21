"use client";

import { Card } from '../../../../components/common/Card';
import { Button } from '../../../../components/common/Button';
import { Camera, AlertCircle, CheckCircle } from 'lucide-react';

export default function DetectPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Crack Detection</h1>
                <p className="text-gray-500">AI-powered image analysis for structural integrity</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Upload Analysis</h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">Drag and drop site images or click to upload</p>
                        <Button>Select Image</Button>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Detections</h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="w-20 h-20 bg-gray-300 rounded-md"></div>
                            <div>
                                <h4 className="font-bold text-gray-900">Sector 4 Wall</h4>
                                <div className="flex items-center text-green-600 mt-1">
                                    <CheckCircle className="w-4 h-4 mr-1" /> No cracks detected
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Today, 10:30 AM</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg">
                            <div className="w-20 h-20 bg-gray-300 rounded-md"></div>
                            <div>
                                <h4 className="font-bold text-gray-900">Retaining Wall B</h4>
                                <div className="flex items-center text-red-600 mt-1">
                                    <AlertCircle className="w-4 h-4 mr-1" /> Hairline crack detected
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Yesterday, 4:15 PM</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
