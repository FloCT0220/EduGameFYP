"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If authentication is still loading, wait
        if (loading) return;
        
        // If user is already authenticated, redirect to their dashboard
        if (isAuthenticated && user) {
            if (user.role === 'admin') {
                router.push('/admin/dashboard');
            } else {
                router.push('/dashboard');
            }
            return;
        }
        
        // If not authenticated, redirect to login
        router.push('/login');
    }, [loading, isAuthenticated, user, router]);

    // Show loading while checking authentication or redirecting
    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background-primary)' }}>
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30 mx-auto mb-4"></div>
                <p className="text-white/70">Loading EduQuest...</p>
            </div>
        </div>
    );
}



