"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { PhoneInput } from '../../../components/auth/PhoneInput';
import { Card } from '../../../components/common/Card';

export default function LoginPage() {
    const { login } = useAuth();
    const [formData, setFormData] = useState({ phone: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(formData.phone, formData.password);

        if (!result.success) {
            setError(result.error);
            setLoading(false);
        }
        // On success, redirect is handled by hook
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 shadow-lg">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        गिरAKSHA Login
                    </h1>
                    <p className="text-gray-500 text-sm mt-2">Enter your phone number to continue</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <PhoneInput
                        label="Phone Number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        placeholder="9876543210"
                    />

                    <Input
                        type="password"
                        label="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        placeholder="••••••••"
                    />

                    <Button type="submit" className="w-full" isLoading={loading}>
                        Sign In
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <span className="text-gray-500">Don't have an account? </span>
                    <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                        Register
                    </Link>
                </div>
            </Card>
        </div>
    );
}
