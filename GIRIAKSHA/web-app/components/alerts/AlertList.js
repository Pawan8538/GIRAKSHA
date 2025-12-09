"use client";

export default function AlertList({ alerts, onRefresh }) {
    if (!alerts || alerts.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-center">
                    <svg
                        className="w-12 h-12 text-gray-400 mx-auto mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">No Active Alerts</h3>
                    <p className="text-xs text-gray-500">
                        All zones are safe. Create an alert to test the system.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Active Alerts</h3>
                <button
                    onClick={onRefresh}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    Refresh
                </button>
            </div>

            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {alerts.map((alert) => (
                    <div key={alert.alertId} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-gray-900">{alert.zone}</span>
                                    <span
                                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${alert.severity === 3
                                                ? 'bg-red-100 text-red-800'
                                                : alert.severity === 2
                                                    ? 'bg-orange-100 text-orange-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                    >
                                        Severity {alert.severity}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    ID: {alert.alertId}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Created: {new Date(alert.timestamp).toLocaleString()}
                                </p>
                                {alert.ackedBy && alert.ackedBy.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-xs text-green-700">
                                            ✓ Acknowledged by: {alert.ackedBy.join(', ')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="ml-4">
                                {alert.ackedBy && alert.ackedBy.length > 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        ACK
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs font-medium animate-pulse">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Pending
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
