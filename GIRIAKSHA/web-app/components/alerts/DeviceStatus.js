"use client";

export default function DeviceStatus({ devices }) {
    const { bands = 0, sirens = 0, dashboards = 0 } = devices || {};
    const totalDevices = bands + sirens + dashboards;

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Connected Devices</h3>
                {totalDevices > 0 && (
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs text-green-700 font-medium">Live</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-3 gap-3">
                {/* Worker Bands */}
                <div className="bg-blue-50 rounded-md p-3 border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                        <svg
                            className="w-4 h-4 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                        </svg>
                        <span className="text-xs font-medium text-blue-900">Bands</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">{bands}</div>
                </div>

                {/* Sirens */}
                <div className="bg-red-50 rounded-md p-3 border border-red-100">
                    <div className="flex items-center gap-2 mb-1">
                        <svg
                            className="w-4 h-4 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                            />
                        </svg>
                        <span className="text-xs font-medium text-red-900">Sirens</span>
                    </div>
                    <div className="text-2xl font-bold text-red-700">{sirens}</div>
                </div>

                {/* Dashboards */}
                <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                        <svg
                            className="w-4 h-4 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                        </svg>
                        <span className="text-xs font-medium text-gray-900">Dashboards</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-700">{dashboards}</div>
                </div>
            </div>

            {totalDevices === 0 && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-xs text-yellow-800">
                        No devices connected. Ensure mobile apps are running and connected to the same network.
                    </p>
                </div>
            )}
        </div>
    );
}
