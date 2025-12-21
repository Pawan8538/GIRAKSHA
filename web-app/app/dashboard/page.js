"use client";

import { useAuth } from '../../hooks/useAuth';
import SuperAdminDashboard from '../../components/dashboard/SuperAdminDashboard';
import SiteAdminDashboard from '../../components/dashboard/SiteAdminDashboard';
import GovDashboard from '../../components/dashboard/GovDashboard';

export default function DashboardPage() {
    const { user } = useAuth();

    // User is already checked in layout.js
    if (!user) return null;

    const renderDashboard = () => {
        switch (user.role_name) {
            case 'super_admin':
                return <SuperAdminDashboard user={user} />;
            case 'site_admin':
                return <SiteAdminDashboard user={user} />;
            case 'gov_authority':
                return <GovDashboard user={user} />;
            default:
                // Fallback for workers or unknown roles
                return (
                    <div className="p-8 text-center">
                        <h2 className="text-xl font-semibold text-gray-800">Field Worker Dashboard</h2>
                        <p className="text-gray-500 mt-2">Mobile app usage is recommended for field operations.</p>
                    </div>
                );
        }
    };

    return renderDashboard();
}
