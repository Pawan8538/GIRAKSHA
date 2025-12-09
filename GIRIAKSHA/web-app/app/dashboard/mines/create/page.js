"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mineService } from '../../../../services/mineService';
import { Button } from '../../../../components/common/Button';
import { Input } from '../../../../components/common/Input';
import { Card } from '../../../../components/common/Card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateMinePage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        lat: '',
        lng: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await mineService.createMine(formData);
            router.push('/dashboard/mines');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create mine');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/mines">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Add New Mine</h1>
                    <p className="text-gray-500">Register a new mining location</p>
                </div>
            </div>

            <Card className="p-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Mine Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="e.g. Alpha Limestone Quarry"
                    />

                    <div className="grid grid-cols-2 gap-6">
                        <Input
                            label="Latitude"
                            type="number"
                            step="any"
                            value={formData.lat}
                            onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                            required
                            placeholder="11.1234"
                        />
                        <Input
                            label="Longitude"
                            type="number"
                            step="any"
                            value={formData.lng}
                            onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                            required
                            placeholder="78.1234"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            className="input h-32"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Enter details about the mine..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Link href="/dashboard/mines">
                            <Button variant="outline" type="button">Cancel</Button>
                        </Link>
                        <Button type="submit" isLoading={loading}>Create Mine</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
