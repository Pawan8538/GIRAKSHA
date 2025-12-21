"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Users, Trash2, Plus, Search, Phone, Mail } from 'lucide-react';
import Cookies from 'js-cookie';

export default function WorkersPage() {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadWorkers();
    }, []);

    const loadWorkers = async () => {
        try {
            const response = await api.get('/auth/workers');
            if (response.data.success) {
                setWorkers(response.data.data || []);
            }
        } catch (err) {
            console.error('Failed to load workers:', err);
            setError('Failed to load workers');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (workerId, workerName) => {
        if (!confirm(`Delete ${workerName}? This action cannot be undone.`)) {
            return;
        }

        try {
            await api.delete(`/auth/admin/worker/${workerId}`);
            setWorkers(workers.filter(w => w.id !== workerId));
        } catch (err) {
            alert('Failed to delete worker: ' + (err.response?.data?.message || 'Unknown error'));
        }
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
                        Field Workers
                    </h1>
                    <p className="text-gray-500 mt-1">Manage workers assigned to your mine</p>
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
                        placeholder="Search by name, phone, or email..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </Card>

            {/* Workers List */}
            <div className="grid gap-4">
                {filteredWorkers.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {search ? 'No workers found' : 'No field workers yet'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {search
                                ? 'Try adjusting your search terms'
                                : 'Invite field workers to get started'
                            }
                        </p>
                    </Card>
                ) : (
                    filteredWorkers.map((worker) => (
                        <Card key={worker.id} className="p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-gray-900">{worker.name}</h3>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                            {worker.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {worker.phone}
                                                </span>
                                            )}
                                            {worker.email && (
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {worker.email}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-right mr-4">
                                        <p className="text-xs text-gray-400">User ID</p>
                                        <p className="text-sm font-medium text-gray-600">{worker.id}</p>
                                    </div>

                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${worker.is_approved
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {worker.is_approved ? 'Active' : 'Pending'}
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                        onClick={() => handleDelete(worker.id, worker.name)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Summary */}
            <div className="text-sm text-gray-500 text-center">
                Showing {filteredWorkers.length} of {workers.length} field workers
            </div>
        </div>
    );
}
