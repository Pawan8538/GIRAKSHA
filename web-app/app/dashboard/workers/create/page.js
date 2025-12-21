"use client";

import { useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { UserPlus, Users, CheckCircle, XCircle, Copy, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CreateWorkersPage() {
    const [phoneInput, setPhoneInput] = useState('');
    const [creating, setCreating] = useState(false);
    const [result, setResult] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleCreate = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setResult(null);
        setCreating(true);

        try {
            // Parse phone numbers (comma, space, or newline separated)
            const phones = phoneInput
                .split(/[,\n\s]+/)
                .map(p => p.trim())
                .filter(p => p.length === 10 && /^\d+$/.test(p));

            if (phones.length === 0) {
                setMessage({ type: 'error', text: 'Please enter valid 10-digit phone numbers' });
                setCreating(false);
                return;
            }

            const response = await api.post('/auth/create-workers', { phones });

            if (response.data.success) {
                setResult(response.data.data);
                setMessage({
                    type: 'success',
                    text: `Successfully created ${response.data.data.success_count} worker(s)!`
                });
                setPhoneInput('');
            }
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Failed to create workers'
            });
        } finally {
            setCreating(false);
        }
    };

    const copyCredentials = (phone, password) => {
        const text = `Login Credentials:\nPhone: ${phone}\nPassword: ${password}`;
        navigator.clipboard.writeText(text);
        setMessage({ type: 'success', text: 'Credentials copied!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    };

    const copyAllCredentials = () => {
        if (!result || !result.created.length) return;

        const text = result.created.map(w =>
            `Phone: ${w.phone}, Password: ${w.password}, Name: ${w.name}`
        ).join('\n');

        navigator.clipboard.writeText(text);
        setMessage({ type: 'success', text: 'All credentials copied!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <UserPlus className="w-7 h-7 text-blue-600" />
                        Create Field Workers
                    </h1>
                    <p className="text-gray-500 mt-1">Directly create worker accounts (no OTP needed)</p>
                </div>
                <Link href="/dashboard/workers/invite">
                    <Button variant="secondary">
                        Or Use Invite System →
                    </Button>
                </Link>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`p-4 rounded-lg border ${message.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Creation Form */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Add Workers by Phone Number</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Numbers <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            placeholder="Enter phone numbers (one per line or comma-separated)&#10;Example:&#10;9876543210&#10;9999888877&#10;8888777766"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            rows={6}
                            required
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            💡 Enter multiple numbers (comma or newline separated). Accounts will be created instantly.
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                        <p className="font-semibold text-blue-900 mb-2">⚡ Quick Creation Process:</p>
                        <ul className="space-y-1 text-blue-800 ml-4 list-disc">
                            <li>Workers created with <strong>phone number as password</strong></li>
                            <li>Accounts <strong>auto-approved</strong> (is_approved = true)</li>
                            <li>Workers can login immediately on mobile app</li>
                            <li>Assigned to your mine automatically</li>
                        </ul>
                    </div>

                    <Button type="submit" isLoading={creating} className="w-full">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Worker Accounts
                    </Button>
                </form>
            </Card>

            {/* Results */}
            {result && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Creation Results</h2>
                        {result.created.length > 0 && (
                            <Button size="sm" variant="secondary" onClick={copyAllCredentials}>
                                <Copy className="w-4 h-4 mr-1" />
                                Copy All Credentials
                            </Button>
                        )}
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-gray-900">{result.total}</div>
                            <div className="text-xs text-gray-500 mt-1">Total Attempted</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600">{result.success_count}</div>
                            <div className="text-xs text-gray-500 mt-1">Created Successfully</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-red-600">{result.error_count}</div>
                            <div className="text-xs text-gray-500 mt-1">Failed</div>
                        </div>
                    </div>

                    {/* Successful Creations */}
                    {result.created.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Successfully Created ({result.created.length})
                            </h3>
                            <div className="space-y-2">
                                {result.created.map((worker, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{worker.name}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                                <span className="font-mono">📱 {worker.phone}</span>
                                                <span className="font-mono">🔑 {worker.password}</span>
                                                <span className="text-xs bg-green-100 px-2 py-0.5 rounded text-green-700">
                                                    ✓ Auto-approved
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => copyCredentials(worker.phone, worker.password)}
                                            className="p-2 hover:bg-green-100 rounded transition"
                                            title="Copy credentials"
                                        >
                                            <Copy className="w-4 h-4 text-green-600" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                <strong>⚠️ Important:</strong> Share these credentials with the workers.
                                They can login immediately using their phone number as both username and password.
                            </div>
                        </div>
                    )}

                    {/* Errors */}
                    {result.errors.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                                <XCircle className="w-5 h-5" />
                                Failed ({result.errors.length})
                            </h3>
                            <div className="space-y-2">
                                {result.errors.map((error, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                        <span className="font-mono text-red-700">{error.phone}</span>
                                        <span className="text-red-600">- {error.error}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Info Panel */}
            <Card className="p-6 bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-3">📖 How This Works</h3>
                <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex gap-3">
                        <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                        <p>Enter one or more phone numbers (10 digits each)</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                        <p>System creates accounts with <strong>phone number as password</strong></p>
                    </div>
                    <div className="flex gap-3">
                        <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                        <p>All workers <strong>auto-approved</strong> and assigned to your mine</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                        <p>Share credentials with workers (they can login immediately)</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">5</span>
                        <p>Workers can change their password after first login</p>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                        <strong>Note:</strong> This is the fastest way to onboard workers.
                        For OTP-based invitation, use the <Link href="/dashboard/workers/invite" className="text-blue-600 hover:underline">Invite System</Link>.
                    </p>
                </div>
            </Card>
        </div>
    );
}
