"use client";

import { Bell, LogOut } from 'lucide-react';
import { Button } from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function Navbar() {
    const { logout } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                // Assuming dashboardService is available or use raw API
                const response = await api.get('/notifications');
                if (response.data.success) {
                    const unread = response.data.data.filter(n => !n.is_read).length;
                    setUnreadCount(unread);
                }
            } catch (error) {
                // Silently fail on network errors to avoid console spam
                if (error.code !== 'ERR_NETWORK') {
                    console.error('Failed to fetch notifications:', error.message);
                }
            }
        };

        fetchNotifications();
        // Poll every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col lg:ml-64">
            {/* Top Ministry Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white py-2 px-6 shadow-md relative z-10">
                <div className="flex items-center justify-center gap-4 max-w-7xl mx-auto">
                    <img
                        src="/SIH-logo.png"
                        alt="SIH Logo"
                        className="h-32 w-auto object-contain drop-shadow-lg"
                    />
                    <div className="flex flex-col items-center">
                        <h1 className="text-xs md:text-sm font-bold tracking-wide text-center uppercase leading-tight text-gray-100">
                            Ministry of Mines <span className="hidden md:inline mx-2">|</span> National Institute of Rock Mechanics (NIRM)
                        </h1>
                        <div className="text-yellow-400 font-extrabold text-xs md:text-sm mt-1 uppercase tracking-wider">
                            SIH-2025 Team-Zenware
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Navbar */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                {/* Left side (Breadcrumbs or Page Title) */}
                <div className="flex items-center">
                    <h2 className="text-lg font-semibold text-gray-800">
                        My Dashboard
                    </h2>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <Link href="/dashboard/notifications">
                        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
                        </button>
                    </Link>

                    <div className="h-6 w-px bg-gray-200" />

                    {/* Logout */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={logout}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </header>
        </div>
    );
}
