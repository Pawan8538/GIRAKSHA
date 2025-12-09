"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { mineService } from '../../../services/mineService';
import { Button } from '../../../components/common/Button';
import { Card, CardTitle } from '../../../components/common/Card';
import RiskBadge from '../../../components/common/RiskBadge';
import { Plus, MapPin, Search, Trash2 } from 'lucide-react';
import { Input } from '../../../components/common/Input';

export default function MinesPage() {
    const [mines, setMines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadMines();
    }, []);

    const loadMines = async () => {
        try {
            const data = await mineService.getAllMines();
            setMines(data);
        } catch (error) {
            console.error('Failed to load mines', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this mine? This action cannot be undone.')) {
            try {
                await mineService.deleteMine(id);
                setMines(mines.filter(m => m.id !== id));
            } catch (error) {
                alert('Failed to delete mine');
            }
        }
    };

    const filteredMines = mines.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mines Management</h1>
                    <p className="text-gray-500">Oversee all mining locations</p>
                </div>
                <Link href="/dashboard/mines/create">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Mine
                    </Button>
                </Link>
            </div>

            <Card className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                        placeholder="Search mines..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMines.map((mine) => (
                    <Card key={mine.id} className="hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <RiskBadge level={mine.risk_level || 'low'} />
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-1">{mine.name}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{mine.description || 'No description provided'}</p>

                            <div className="flex items-center text-xs text-gray-500 mb-4">
                                <span className="bg-gray-100 px-2 py-1 rounded">
                                    Lat: {mine.location?.coordinates?.[1]?.toFixed(4) || mine.lat?.toFixed(4) || 'N/A'}
                                </span>
                                <span className="mx-2">•</span>
                                <span className="bg-gray-100 px-2 py-1 rounded">
                                    Lng: {mine.location?.coordinates?.[0]?.toFixed(4) || mine.lng?.toFixed(4) || 'N/A'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <span className="text-xs text-gray-400">ID: {mine.id}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                    onClick={() => handleDelete(mine.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}

                {filteredMines.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No mines found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
}
