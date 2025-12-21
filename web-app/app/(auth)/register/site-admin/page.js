"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '../../../../services/authService';
import { Button } from '../../../../components/common/Button';
import { Input } from '../../../../components/common/Input';
import { PhoneInput } from '../../../../components/auth/PhoneInput';
import { Card } from '../../../../components/common/Card';
import api from '@/lib/api';

export default function SiteAdminRegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        company_id_url: '',
        slope_id: ''
    });
    const [mines, setMines] = useState([]);
    const [loadingMines, setLoadingMines] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadMines();
    }, []);

    const loadMines = async () => {
        try {
            const response = await api.get('/auth/slopes');
            if (response.data.success) {
                setMines(response.data.data || []);
            }
        } catch (err) {
            console.error('Failed to load mines:', err);
        } finally {
            setLoadingMines(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!formData.slope_id) {
            setError('Please select a mine. Contact Super Admin if your mine is not listed.');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                password: formData.password,
                company_id_url: formData.company_id_url,
                slope_id: parseInt(formData.slope_id)
            };

            await authService.registerSiteAdmin(payload);
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
                    <h1 className="text-2xl font-bold text-gray-900">Site Admin Registration</h1>
                    <p className="text-gray-500 text-sm mt-2">Register and wait for Super Admin approval</p>
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

                        <PhoneInput
                            label="Phone Number"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                        />
                    </div>

                    <Input
                        type="email"
                        label="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />

                    {/* Mine Selection - REQUIRED */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Mine <span className="text-red-500">*</span>
                        </label>
                        {loadingMines ? (
                            <div className="text-sm text-gray-500 py-2">Loading mines...</div>
                        ) : mines.length === 0 ? (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                                ⚠️ No mines available. Please contact Super Admin to create a mine first.
                            </div>
                        ) : (
                            <>
                                <select
                                    value={formData.slope_id}
                                    onChange={(e) => setFormData({ ...formData, slope_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    required
                                >
                                    <option value="">-- Select your mine --</option>
                                    {mines.map((mine) => (
                                        <option key={mine.id} value={mine.id}>
                                            {mine.name} {mine.location && `(${mine.location})`}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    💡 Can't find your mine? Contact Super Admin to add it.
                                </p>
                            </>
                        )}
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

                    <Input
                        label="Company ID (Optional)"
                        value={formData.company_id_url}
                        onChange={(e) => setFormData({ ...formData, company_id_url: e.target.value })}
                        placeholder="Document URL or ID number"
                    />

                    <div className="pt-2">
                        <p className="text-xs text-gray-500 mb-4">
                            After registration, a Super Admin will review and approve your account.
                        </p>
                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={loading}
                            disabled={mines.length === 0}
                        >
                            Register
                        </Button>
                    </div>

                    <div className="text-center text-sm text-gray-500 mt-4">
                        Already have an account?{' '}
                        <Link href="/login" className="text-blue-600 hover:underline">
                            Login here
                        </Link>
                    </div>
                </form>
            </Card>
        </div>
    );
}
