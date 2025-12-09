"use client";

import Link from 'next/link';
import { Card } from '../../../components/common/Card';
import { Building2, ShieldCheck, HardHat } from 'lucide-react';

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900">Create an Account</h1>
                    <p className="text-gray-500 mt-2">Choose your role to get started</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Site Admin Card */}
                    <Link href="/register/site-admin" className="block group">
                        <Card className="h-full p-8 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer border-2 bg-white">
                            <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                                <Building2 className="w-8 h-8 text-blue-600 group-hover:text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Site Admin</h3>
                            <p className="text-gray-500 text-sm">
                                Manage mining sites, monitor sensors, and coordinate with field workers.
                            </p>
                        </Card>
                    </Link>

                    {/* Govt Authority Card */}
                    <Link href="/register/gov" className="block group">
                        <Card className="h-full p-8 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer border-2 bg-white">
                            <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors">
                                <ShieldCheck className="w-8 h-8 text-purple-600 group-hover:text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Government Authority</h3>
                            <p className="text-gray-500 text-sm">
                                Oversee mining compliance, issue advisories, and monitor regional risks.
                            </p>
                        </Card>
                    </Link>
                </div>

                <div className="text-center mt-8">
                    <p className="text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link href="/login" className="text-blue-600 font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
