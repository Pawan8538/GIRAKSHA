"use client";

import { useState, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Bell, Plus, X } from 'lucide-react';
import api from '../../../lib/api';

export default function AdvisoriesPage() {
    const [advisories, setAdvisories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        severity: 'info',
        slopeId: ''
    });
    const [mines, setMines] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [advisoriesRes, minesRes] = await Promise.all([
                api.get('/govt/advisories'),
                api.get('/admin/slopes')
            ]);
            setAdvisories(advisoriesRes.data.data || []);
            setMines(minesRes.data.data || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await api.post('/govt/advisories', formData);
            setShowModal(false);
            setFormData({ title: '', message: '', severity: 'info', slopeId: '' });
            loadData(); // Reload advisories
        } catch (error) {
            console.error('Failed to create advisory:', error);
            alert('Failed to create advisory. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'border-l-red-500 bg-red-50';
            case 'warning': return 'border-l-yellow-500 bg-yellow-50';
            case 'info': return 'border-l-blue-500 bg-blue-50';
            default: return 'border-l-gray-500 bg-gray-50';
        }
    };

    const getSeverityIconColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-600';
            case 'warning': return 'bg-yellow-100 text-yellow-600';
            case 'info': return 'bg-blue-100 text-blue-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Safety Advisories</h1>
                    <p className="text-gray-500">Manage regional safety notifications</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4 mr-2" /> NEW ADVISORY
                </Button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <Card className="p-6">
                        <p className="text-gray-500 text-center">Loading advisories...</p>
                    </Card>
                ) : advisories.length === 0 ? (
                    <Card className="p-6">
                        <p className="text-gray-500 text-center">No advisories yet. Create one to get started.</p>
                    </Card>
                ) : (
                    advisories.map((advisory) => (
                        <Card key={advisory.id} className={`p-6 border-l-4 ${getSeverityColor(advisory.severity)}`}>
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg ${getSeverityIconColor(advisory.severity)}`}>
                                    <Bell className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900">{advisory.title}</h3>
                                    <p className="text-gray-600 mt-2">{advisory.message}</p>
                                    <div className="flex gap-4 mt-4 text-sm text-gray-500">
                                        <span>Posted: {new Date(advisory.created_at).toLocaleString()}</span>
                                        <span>•</span>
                                        <span className="capitalize">Severity: {advisory.severity}</span>
                                        {advisory.slope_id && (
                                            <>
                                                <span>•</span>
                                                <span>Mine ID: {advisory.slope_id}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* New Advisory Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg p-6 bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">New Advisory</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="e.g., Heavy Rainfall Alert"
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="4"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                    placeholder="Describe the advisory in detail..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.severity}
                                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                >
                                    <option value="info">Info</option>
                                    <option value="warning">Warning</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Target Mine (Optional - leave empty to notify all)
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.slopeId}
                                    onChange={(e) => setFormData({ ...formData, slopeId: e.target.value })}
                                >
                                    <option value="">All Mines</option>
                                    {mines.map((mine) => (
                                        <option key={mine.id} value={mine.id}>
                                            {mine.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" className="flex-1" isLoading={submitting}>
                                    Create Advisory
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
