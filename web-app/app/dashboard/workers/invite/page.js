"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { UserPlus, Copy, RefreshCw, X, Phone, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function InviteWorkerPage() {
    const [phone, setPhone] = useState('');
    const [inviting, setInviting] = useState(false);
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [lastInvite, setLastInvite] = useState(null);

    useEffect(() => {
        loadInvites();
    }, []);

    const loadInvites = async () => {
        try {
            // Note: Backend needs GET /api/auth/invites endpoint
            // For now, showing placeholder
            setInvites([]);
        } catch (err) {
            console.error('Failed to load invites:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setInviting(true);

        try {
            const response = await api.post('/auth/invite/worker', { phone });

            if (response.data.success) {
                const otp = response.data.otp || '123456'; // Backend should return OTP

                setLastInvite({
                    phone,
                    otp,
                    created_at: new Date().toISOString()
                });

                setMessage({
                    type: 'success',
                    text: `Invitation sent to ${phone}! Share the OTP with the worker.`
                });

                setPhone('');
                loadInvites();
            }
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Failed to send invitation'
            });
        } finally {
            setInviting(false);
        }
    };

    const copyOTP = (otp) => {
        navigator.clipboard.writeText(otp);
        setMessage({ type: 'success', text: 'OTP copied to clipboard!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <UserPlus className="w-7 h-7 text-blue-600" />
                    Invite Field Worker
                </h1>
                <p className="text-gray-500 mt-1">Send an invitation to register a new field worker</p>
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

            {/* Last Invite OTP Display */}
            {lastInvite && (
                <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                ✅ Invitation Sent Successfully!
                            </h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <Phone className="w-4 h-4" />
                                    <span>Phone: <strong>{lastInvite.phone}</strong></span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-700">OTP Code:</span>
                                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border-2 border-blue-300">
                                        <span className="text-2xl font-mono font-bold text-blue-600 tracking-wider">
                                            {lastInvite.otp}
                                        </span>
                                        <button
                                            onClick={() => copyOTP(lastInvite.otp)}
                                            className="p-1 hover:bg-blue-100 rounded transition"
                                            title="Copy OTP"
                                        >
                                            <Copy className="w-4 h-4 text-blue-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                                ⚠️ <strong>Important:</strong> Share this OTP with the worker via WhatsApp/call.
                                They'll need it to register on the mobile app. OTP expires in 24 hours.
                            </p>
                        </div>
                        <button
                            onClick={() => setLastInvite(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </Card>
            )}

            {/* Invite Form */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Send New Invitation</h2>
                <form onSubmit={handleInvite} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Worker's Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Enter 10-digit phone number"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                pattern="[0-9]{10}"
                                required
                            />
                            <Button type="submit" isLoading={inviting}>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Send Invite
                            </Button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            The worker will receive an OTP to register on the mobile app
                        </p>
                    </div>
                </form>
            </Card>

            {/* How It Works */}
            <Card className="p-6 bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-3">📋 How Field Worker Invitation Works</h3>
                <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                        <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                        <span>Enter the worker's phone number and click "Send Invite"</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                        <span>System generates a unique OTP code (displayed above)</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                        <span>Share the OTP with the worker via WhatsApp, SMS, or call</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                        <span>Worker downloads the mobile app and registers using their phone number + OTP</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">5</span>
                        <span>Worker account is automatically approved and assigned to your mine</span>
                    </li>
                </ol>
            </Card>

            {/* Pending Invites (Future) */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Pending Invitations</h2>
                    <button
                        onClick={loadInvites}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading invites...</div>
                ) : invites.length === 0 ? (
                    <div className="text-center py-12">
                        <UserPlus className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No pending invitations</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Invites will appear here after you send them
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {invites.map((invite) => (
                            <div key={invite.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Phone className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{invite.phone}</p>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(invite.created_at).toLocaleDateString()}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded ${invite.is_registered
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {invite.is_registered ? 'Registered' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {!invite.is_registered && (
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" title="Copy OTP">
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text text-red-500 hover:bg-red-50">
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <strong>💡 Note:</strong> Currently, the OTP is set to <code className="bg-blue-100 px-1 rounded">123456</code> for all invites.
                In production, unique OTPs should be generated for each invite and sent via SMS.
            </div>
        </div>
    );
}
