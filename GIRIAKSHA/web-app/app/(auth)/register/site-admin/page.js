"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '../../../../services/authService';
import { Button } from '../../../../components/common/Button';
import { Input } from '../../../../components/common/Input';
import { PhoneInput } from '../../../../components/auth/PhoneInput';
import { Card } from '../../../../components/common/Card';

export default function SiteAdminRegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: ''
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
                password: formData.password
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
            <Card className="w-full max-w-md p-8 shadow-lg">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Site Admin Registration</h1>
                    <p className="text-gray-500 text-sm mt-2">Register and wait for Super Admin approval</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
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

                    <Input
                        type="email"
                        label="Email (Optional)"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />

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

                    <div className="pt-2">
                        <p className="text-xs text-gray-500 mb-4">
                            After registration, a Super Admin will review and approve your account.
                            You will be assigned to a mine upon approval.
                        </p>
                        <Button type="submit" className="w-full" isLoading={loading}>
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
