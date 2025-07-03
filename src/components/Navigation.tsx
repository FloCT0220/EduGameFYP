'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navigation() {
    const router = useRouter();
    const pathname = usePathname();
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        // Get user role from localStorage (in a real app, this would come from auth)
        const role = localStorage.getItem('userRole');
        setUserRole(role);
    }, []);

    const studentNavItems = [
        { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
        { name: 'Subjects', path: '/courses', icon: '📚' },
    ];

    const adminNavItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: '🏠' }
    ];
console.log(userRole);
    const navItems = userRole === 'student' ? studentNavItems : adminNavItems;

    if (pathname === '/' || pathname === '/login' || pathname === '/register') {
        return null; // Don't show navigation on landing and auth pages
    }

    return (
        <nav className="glass border-b border-white/20 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <button 
                            onClick={() => {
                                if (userRole === 'admin') {
                                    router.push('/admin/dashboard');
                                } else {
                                    router.push('/dashboard');
                                }
                            }}
                            className="flex items-center space-x-2 text-xl font-bold text-white hover:text-blue-200 transition-colors"
                        >
                            <span>🎓</span>
                            <span className="text-gradient">EduQuest</span>
                        </button>
                    </div>

                    <div className="flex items-center space-x-4">
                        {navItems.map((item) => {
                            const isActive = pathname === item.path || 
                                           (item.path.includes('?tab=') && pathname === '/dashboard') ||
                                           (item.path === '/dashboard' && pathname === '/dashboard');
                            
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => {
                                        if (item.path.includes('?tab=')) {
                                            const tab = item.path.split('?tab=')[1];
                                            router.push(`/dashboard?tab=${tab}`);
                                        } else if (item.path === '/quiz') {
                                            // For general quiz access from nav, use default parameters
                                            router.push('/quiz?courseId=1&nodeId=general&nodeName=General Knowledge Quiz');
                                        } else {
                                            router.push(item.path);
                                        }
                                    }}
                                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        isActive
                                            ? 'bg-white/20 text-white shadow-lg'
                                            : 'text-white/80 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    <span>{item.icon}</span>
                                    <span className="hidden sm:block">{item.name}</span>
                                </button>
                            );
                        })}
                        
                        <div className="border-l border-white/20 pl-4">
                            <button
                                onClick={() => {
                                    localStorage.removeItem('userRole');
                                    router.push('/');
                                }}
                                className="flex items-center space-x-1 px-3 py-2 text-sm text-white/80 hover:text-red-200 transition-colors"
                            >
                                <span>🚪</span>
                                <span className="hidden sm:block">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
} 