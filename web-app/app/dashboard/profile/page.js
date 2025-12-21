"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { User, Mail, Phone, Shield, MapPin, Lock } from 'lucide-react';

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await api.get('/auth/me');
            if (response.data.success) {
                const user = response.data.data;
                setProfile(user);
                setFormData({
                    name: user.name || '',
                    phone: user.phone || '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            setMessage({ type: 'error', text: 'Failed to load profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            // Validate password change
            if (formData.newPassword) {
                if (!formData.currentPassword) {
                    setMessage({ type: 'error', text: 'Current password required to change password' });
                    setSaving(false);
                    return;
                }
                if (formData.newPassword !== formData.confirmPassword) {
                    setMessage({ type: 'error', text: 'New passwords do not match' });
                    setSaving(false);
                    return;
                }
                if (formData.newPassword.length < 6) {
                    setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
                    setSaving(false);
                    return;
                }
            }

            const updateData = {
                name: formData.name,
                phone: formData.phone
            };

            if (formData.newPassword) {
                updateData.currentPassword = formData.currentPassword;
                updateData.newPassword = formData.newPassword;
            }

            const response = await api.put('/auth/me', updateData);

            if (response.data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));
                loadProfile(); // Reload to get updated data
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update profile'
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>

            {message.text && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
                    'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
                {/* Profile Info Card */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Profile Information
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="font-medium text-sm">{profile?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                            <Shield className="w-4 h-4 text-gray-500" />
                            <div>
                                <p className="text-xs text-gray-500">Role</p>
                                <p className="font-medium text-sm capitalize">{profile?.role_name?.replace('_', ' ')}</p>
                            </div>
                        </div>
                        {profile?.department && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                                <Shield className="w-4 h-4 text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Sub Role (Department)</p>
                                    <p className="font-medium text-sm">{profile.department}</p>
                                </div>
                            </div>
                        )}
                        {profile?.slope_id && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Mine ID</p>
                                    <p className="font-medium text-sm">{profile.slope_id}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                            <div className={`w-2 h-2 rounded-full ${profile?.is_approved ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <div>
                                <p className="text-xs text-gray-500">Status</p>
                                <p className="font-medium text-sm">{profile?.is_approved ? 'Approved' : 'Pending Approval'}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Edit Form */}
                <Card className="p-6 md:col-span-2">
                    <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div className="pt-4 border-t">
                            <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Change Password (Optional)
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.currentPassword}
                                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Leave blank to keep current password"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Minimum 6 characters"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="submit" className="flex-1" isLoading={saving}>
                                Save Changes
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => router.back()}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
