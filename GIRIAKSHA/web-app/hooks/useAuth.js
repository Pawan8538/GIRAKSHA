"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '../services/authService';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check for cached user on mount
        const loadUser = async () => {
            try {
                const cachedUser = authService.getUser();
                if (cachedUser) {
                    setUser(cachedUser);
                } else if (authService.isAuthenticated()) {
                    // If token exists but no user data, fetch profile
                    const profile = await authService.getProfile();
                    setUser(profile);
                    Cookies.set('user', JSON.stringify(profile));
                }
            } catch (error) {
                console.error('Auth verification failed', error);
                authService.logout();
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (phone, password) => {
        try {
            const userData = await authService.login(phone, password);
            setUser(userData);
            router.push('/dashboard');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Login failed' };
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
