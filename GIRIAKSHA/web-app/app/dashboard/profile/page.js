"use client";

import ProfileForm from '@/components/profile/ProfileForm';

export default function ProfilePage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                    <p className="text-gray-500 mt-1">Manage your account settings and preferences</p>
                </div>
            </div>

            <ProfileForm />
        </div>
    );
}
