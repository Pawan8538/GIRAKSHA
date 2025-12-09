"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Map as MapIcon,
    Activity,
    Radio,
    Bell,
    FileText,
    MessageSquare,
    User,
    ShieldAlert,
    Menu,
    X,
    ClipboardList
} from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';

// Navigation configuration
const navConfig = {
    super_admin: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Users', href: '/dashboard/users', icon: Users },
        { label: 'Mines', href: '/dashboard/mines', icon: MapIcon }, // Mines, NOT Slopes
        {
            label: 'ML Analytics',
            href: '/dashboard/ml',
            icon: Activity,
            subItems: [
                { label: 'Heatmap', href: '/dashboard/ml/heatmap' },
                { label: 'Forecast', href: '/dashboard/ml/forecast' },
                { label: 'Evacuation', href: '/dashboard/ml/evacuation' },
                { label: 'Crack Detect', href: '/dashboard/ml/detect' },
                { label: 'Risk Predict', href: '/dashboard/ml/predict' },
                { label: 'Manual Predict', href: '/dashboard/ml/manual-predict' },
            ]
        },
        { label: 'Sensors', href: '/dashboard/sensors', icon: Radio },
        { label: 'Alerts', href: '/dashboard/alerts', icon: ShieldAlert },
        { label: 'Complaints', href: '/dashboard/complaints', icon: FileText },
        { label: 'Tasks', href: '/dashboard/tasks', icon: ClipboardList },
        { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
        { label: 'Profile', href: '/dashboard/profile', icon: User }, // Moved Profile to bottom
    ],
    site_admin: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        {
            label: 'ML Analytics',
            href: '/dashboard/ml',
            icon: Activity,
            subItems: [
                { label: 'Heatmap', href: '/dashboard/ml/heatmap' },
                { label: 'Forecast', href: '/dashboard/ml/forecast' },
                { label: 'Evacuation', href: '/dashboard/ml/evacuation' },
                { label: 'Crack Detect', href: '/dashboard/ml/detect' },
                { label: 'Risk Predict', href: '/dashboard/ml/predict' },
                { label: 'Manual Predict', href: '/dashboard/ml/manual-predict' },
            ]
        },
        { label: 'Sensors', href: '/dashboard/sensors', icon: Radio },
        { label: 'Alerts', href: '/dashboard/alerts', icon: ShieldAlert },
        { label: 'Complaints', href: '/dashboard/complaints', icon: FileText },
        { label: 'Tasks', href: '/dashboard/tasks', icon: ClipboardList },
        { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
        { label: 'Profile', href: '/dashboard/profile', icon: User }, // Moved Profile to bottom
    ],
    gov_authority: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Mines List', href: '/dashboard/mines-list', icon: MapIcon },
        {
            label: 'ML Analytics',
            href: '/dashboard/ml',
            icon: Activity,
            subItems: [
                { label: 'Heatmap', href: '/dashboard/ml/heatmap' },
                { label: 'Forecast', href: '/dashboard/ml/forecast' },
                { label: 'Evacuation', href: '/dashboard/ml/evacuation' },
                { label: 'Crack Detect', href: '/dashboard/ml/detect' },
                { label: 'Risk Predict', href: '/dashboard/ml/predict' },
            ]
        },
        { label: 'Alerts', href: '/dashboard/alerts', icon: ShieldAlert },
        { label: 'Complaints', href: '/dashboard/complaints', icon: FileText },
        { label: 'Advisories', href: '/dashboard/advisories', icon: Bell },
        { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
        { label: 'Profile', href: '/dashboard/profile', icon: User }, // Moved Profile to bottom
    ]
};

export default function Sidebar({ role = 'super_admin', user = null }) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false); // Mobile menu state

    const navItems = navConfig[role] || navConfig.super_admin;

    // Extract sub-role (department for gov_authority)
    const subRole = user?.department || user?.gov_department || null;

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
                onClick={toggleSidebar}
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Sidebar Overlay (Mobile) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside className={clsx(
                "fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo - Fixed at top */}
                <div className="h-24 flex items-center justify-center border-b border-gray-200 flex-shrink-0">
                    <Image
                        src="/logo_raw.png"
                        alt="Logo"
                        width={80}
                        height={80}
                        className="object-contain"
                    />
                    <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 -ml-2">
                        गिरAKSHA
                    </h1>
                </div>

                {/* User Info (Mini) - Fixed below logo */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Current User'}</p>
                            <p className="text-xs text-gray-500 capitalize">{role.replace('_', ' ')}</p>
                            {subRole && (
                                <p className="text-xs text-blue-600 font-medium truncate">{subRole}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation - Scrollable area */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {navItems.map((item, index) => (
                        <div key={index}>
                            <Link
                                href={item.href}
                                className={clsx(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    pathname === item.href || pathname.startsWith(item.href + '/')
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-gray-700 hover:bg-gray-100"
                                )}
                                onClick={() => setIsOpen(false)}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>

                            {/* Sub-items */}
                            {item.subItems && (
                                <div className="ml-9 mt-1 space-y-1">
                                    {item.subItems.map((sub, subIndex) => (
                                        <Link
                                            key={subIndex}
                                            href={sub.href}
                                            className={clsx(
                                                "block px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                                                pathname === sub.href
                                                    ? "text-blue-600 bg-blue-50/50"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            {sub.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>
            </aside>
        </>
    );
}
