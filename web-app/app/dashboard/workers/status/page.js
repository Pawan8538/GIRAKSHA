"use client";

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/common/Card';
import { Users, Search, Phone, Mail, Clock, ShieldCheck, ShieldAlert } from 'lucide-react';
import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

export default function WorkerStatusPage() {
    const [workers, setWorkers] = useState([]);
    // We'll store online status in a map: userId -> { status: 'online'|'offline', lastSeen: ISOString }
    const [onlineStatus, setOnlineStatus] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const socketRef = useRef(null);

    useEffect(() => {
        loadData();
        setupSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            // 1. Fetch all workers
            const workersRes = await api.get('/auth/workers'); // Helper endpoint or listWorkers
            // 2. Fetch online status
            const statusRes = await api.get('/admin/workers/status');

            if (workersRes.data.success) {
                setWorkers(workersRes.data.data || []);
            }

            if (statusRes.data.success) {
                // Initialize online status map
                const statusMap = {};
                if (Array.isArray(statusRes.data.data)) {
                    statusRes.data.data.forEach(item => {
                        statusMap[item.userId] = {
                            status: item.status,
                            lastSeen: item.lastSeen
                        };
                    });
                }
                setOnlineStatus(statusMap);
            }
        } catch (err) {
            console.error('Failed to load worker data:', err);
            setError('Failed to load worker status');
        } finally {
            setLoading(false);
        }
    };

    const setupSocket = () => {
        const token = Cookies.get('token');
        const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

        // Connect to the same namespace/server as backend
        const socket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            console.log('Connected to socket for status updates');
            socket.emit('join', 'admin_viewer'); // Optional, if we needed to join a room
        });

        socket.on('user:status', (data) => {
            // data = { userId, status: 'online' | 'offline', timestamp }
            console.log('Received status update:', data);
            setOnlineStatus(prev => ({
                ...prev,
                [data.userId]: {
                    status: data.status,
                    lastSeen: new Date(data.timestamp).toISOString()
                }
            }));
        });

        socketRef.current = socket;
    };

    const filteredWorkers = workers.filter(w =>
        w.name?.toLowerCase().includes(search.toLowerCase()) ||
        w.phone?.includes(search) ||
        w.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-7 h-7" />
                        Worker Real-time Status
                    </h1>
                    <p className="text-gray-500 mt-1">Monitor currently active field workers</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            {/* Search */}
            <Card className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search workers..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </Card>

            {/* Status List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worker</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredWorkers.map((worker) => {
                            const statusData = onlineStatus[worker.id];
                            const isOnline = statusData?.status === 'online';

                            return (
                                <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                    {worker.name?.charAt(0) || 'U'}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                                                <div className="text-sm text-gray-500">{worker.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 capitalize">{worker.role_name?.replace('_', ' ')}</div>
                                        <div className="text-xs text-gray-500">{worker.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full mr-2 self-center ${isOnline ? 'bg-green-500' : 'bg-gray-500'
                                                }`}></span>
                                            {isOnline ? 'Online' : 'Offline'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {statusData?.lastSeen ? (
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(statusData.lastSeen).toLocaleTimeString()}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredWorkers.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        No workers found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
}
