"use client";

import { useState, useEffect } from 'react';
import { dashboardService } from '../../../services/dashboardService';
import { Card } from '../../../components/common/Card';
import RiskBadge from '../../../components/common/RiskBadge';
import { MapPin, Search } from 'lucide-react';
import { Input } from '../../../components/common/Input';

export default function GovMinesListPage() {
    const [mines, setMines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadMines();
    }, []);

    const loadMines = async () => {
        try {
            const data = await dashboardService.getGovMines();
            setMines(data);
        } catch (error) {
            console.error('Failed to load mines', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMines = mines.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Regional Mines</h1>
                    <p className="text-gray-500">View all registered mining sites</p>
                </div>
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
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <RiskBadge level={mine.risk_level || 'low'} />
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-1">{mine.name}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{mine.description || 'No description provided'}</p>

                            <div className="flex items-center text-xs text-gray-500">
                                <span className="bg-gray-100 px-2 py-1 rounded">
                                    Lat: {mine.lat?.toFixed(4) || 'N/A'}
                                </span>
                                <span className="mx-2">•</span>
                                <span className="bg-gray-100 px-2 py-1 rounded">
                                    Lng: {mine.lng?.toFixed(4) || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
