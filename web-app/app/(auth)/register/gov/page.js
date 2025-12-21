"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '../../../../services/authService';
import { Button } from '../../../../components/common/Button';
import { Input } from '../../../../components/common/Input';
import { PhoneInput } from '../../../../components/auth/PhoneInput';
import { Card } from '../../../../components/common/Card';

export default function GovAdminRegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: '',
        govt_id_url: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                password: formData.password,
                department: formData.department,
                govt_id_url: formData.govt_id_url || 'https://example.com/placeholder.jpg',
                slope_ids: [] // Optional
            };

            await authService.registerGov(payload);
            router.push('/login?registered=true');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
            <Card className="w-full max-w-2xl p-8 shadow-lg">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Government Authority Registration</h1>
                    <p className="text-gray-500 text-sm mt-2">Register for oversight access</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input
                            label="Full Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <Input
                            type="email"
                            label="Email (Optional)"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <PhoneInput
                        label="Phone Number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                    />

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Department / Agency</label>
                        <select
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            required
                            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white sm:text-sm transition-all"
                        >
                            <option value="">Select Department</option>
                            <option value="Police Department">Police Department</option>
                            <option value="Health Department">Health Department</option>
                            <option value="Fire & Rescue Services">Fire & Rescue Services</option>
                            <option value="Mining Department">Mining Department</option>
                            <option value="Geological Survey">Geological Survey</option>
                            <option value="Environment Department">Environment Department</option>
                            <option value="Disaster Management Authority">Disaster Management Authority</option>
                            <option value="Public Works Department">Public Works Department</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <Input
                            type="password"
                            label="Password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                        <Input
                            type="password"
                            label="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full" isLoading={loading}>
                        Create Account
                    </Button>
                </form>
            </Card>
        </div>
    );
}
