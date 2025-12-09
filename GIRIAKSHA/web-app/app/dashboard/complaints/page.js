"use client";

import { useState, useEffect } from 'react';
import { complaintService } from '@/services/complaintService';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, MapPin, User, CheckCircle, Clock, AlertTriangle, MessageSquare } from 'lucide-react';

export default function ComplaintsPage() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await complaintService.getAllComplaints();
            setComplaints(data || []);
        } catch (error) {
            console.error("Failed to load complaints:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await complaintService.updateStatus(id, status);
            loadData();
            if (selectedComplaint?.id === id) {
                setSelectedComplaint(prev => ({ ...prev, status }));
            }
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Failed to update status");
        }
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        if (!selectedComplaint) return;

        setSubmitting(true);
        try {
            // Need worker ID from selectedComplaint if available
            await complaintService.addFeedback(selectedComplaint.id, feedback, selectedComplaint.user_id);
            setFeedback('');
            // Optionally reload feedback list here
            alert("Feedback sent");
        } catch (error) {
            console.error("Failed to send feedback:", error);
            alert("Failed to send feedback");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'resolved': return 'text-green-600 bg-green-50 border-green-200';
            case 'investigating': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-orange-600 bg-orange-50 border-orange-200';
        }
    };

    return (
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
            {/* List Panel */}
            <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden h-full">
                <div className="p-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">Complaints List</h2>
                    <span className="text-xs text-gray-500">{complaints.length} Total</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-lg animate-pulse" />)
                    ) : (
                        complaints.map(complaint => (
                            <div
                                key={complaint.id}
                                onClick={() => setSelectedComplaint(complaint)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedComplaint?.id === complaint.id
                                        ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                                        : 'bg-white border-gray-100 hover:border-blue-100 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${getStatusColor(complaint.status)}`}>
                                        {complaint.status}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(complaint.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-gray-900 line-clamp-1">{complaint.description}</p>
                                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                    <MapPin className="w-3 h-3" />
                                    <span>ID: {complaint.slope_id}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-1">
                {selectedComplaint ? (
                    <div className="space-y-6">
                        {/* Main Detail Card */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-1">
                                            Complaint #{selectedComplaint.id}
                                        </h2>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <User className="w-4 h-4" /> User ID: {selectedComplaint.user_id}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" /> Mine ID: {selectedComplaint.slope_id}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {['pending', 'investigating', 'resolved'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusUpdate(selectedComplaint.id, status)}
                                                disabled={selectedComplaint.status === status}
                                                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors capitalize ${selectedComplaint.status === status
                                                        ? getStatusColor(status)
                                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-6">
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                                    <p className="text-gray-700 leading-relaxed">{selectedComplaint.description}</p>
                                </div>

                                {selectedComplaint.media_url && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">Evidence</h3>
                                        {/* Using generic img for now, in real app consider next/image with proper domain config */}
                                        <img
                                            src={selectedComplaint.media_url.startsWith('http') ? selectedComplaint.media_url : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${selectedComplaint.media_url}`}
                                            alt="Complaint Evidence"
                                            className="rounded-lg max-h-96 object-contain border border-gray-200 bg-gray-50"
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Reply/Feedback Section */}
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Reply to Field Worker
                                </h3>
                                <form onSubmit={handleFeedbackSubmit}>
                                    <textarea
                                        required
                                        rows="3"
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                                        placeholder="Type your response or status update here..."
                                        value={feedback}
                                        onChange={e => setFeedback(e.target.value)}
                                    />
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={submitting || !feedback.trim()}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition"
                                        >
                                            {submitting ? 'Sending...' : 'Send Reply'}
                                        </button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                        <FileText className="w-12 h-12 mb-2 opacity-50" />
                        <p>Select a complaint to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
}
