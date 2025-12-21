"use client";

import { useState, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Bell, Check, Trash2 } from 'lucide-react';
import api from '../../../lib/api';
import Link from 'next/link';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data.data || []);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await api.post(`/notifications/${notificationId}/read`);
            setNotifications(notifications.map(n =>
                n.id === notificationId ? { ...n, is_read: true } : n
            ));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/mark-all');
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getNotificationIcon = (type) => {
        return <Bell className="w-5 h-5" />;
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'alert':
            case 'user_registration':
                return 'bg-red-50 border-l-red-500';
            case 'advisory':
                return 'bg-yellow-50 border-l-yellow-500';
            case 'task':
                return 'bg-blue-50 border-l-blue-500';
            case 'message':
                return 'bg-green-50 border-l-green-500';
            default:
                return 'bg-gray-50 border-l-gray-500';
        }
    };

    const getIconColor = (type) => {
        switch (type) {
            case 'alert':
            case 'user_registration':
                return 'bg-red-100 text-red-600';
            case 'advisory':
                return 'bg-yellow-100 text-yellow-600';
            case 'task':
                return 'bg-blue-100 text-blue-600';
            case 'message':
                return 'bg-green-100 text-green-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-500">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button onClick={markAllAsRead}>
                        <Check className="w-4 h-4 mr-2" /> Mark All as Read
                    </Button>
                )}
            </div>

            {loading ? (
                <Card className="p-12 text-center text-gray-500">
                    Loading notifications...
                </Card>
            ) : notifications.length === 0 ? (
                <Card className="p-12 text-center text-gray-500">
                    <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900">No Notifications</h3>
                    <p className="mt-1">You're all caught up!</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <Card
                            key={notification.id}
                            className={`p-4 border-l-4 cursor-pointer transition-all ${getNotificationColor(notification.type)
                                } ${!notification.is_read ? 'bg-opacity-100' : 'bg-opacity-50'}`}
                            onClick={() => !notification.is_read && markAsRead(notification.id)}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg ${getIconColor(notification.type)}`}>
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className={`font-semibold ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                                                {notification.title}
                                            </h3>
                                            <p className={`text-sm mt-1 ${!notification.is_read ? 'text-gray-700' : 'text-gray-500'}`}>
                                                {notification.body}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                                        <span>{new Date(notification.created_at).toLocaleString()}</span>
                                        <span>•</span>
                                        <span className="capitalize">{notification.type?.replace(/_/g, ' ')}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
