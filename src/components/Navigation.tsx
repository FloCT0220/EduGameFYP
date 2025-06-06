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
        { name: 'Courses', path: '/courses', icon: '📚' },
        { name: 'Quiz', path: '/quiz', icon: '🎯' },
        { name: 'Achievements', path: '/dashboard?tab=achievements', icon: '🏆' },
        { name: 'Leaderboard', path: '/dashboard?tab=leaderboard', icon: '👑' },
    ];

    const teacherNavItems = [
        { name: 'Dashboard', path: '/teacher/dashboard', icon: '🏠' },
        { name: 'My Courses', path: '/teacher/courses', icon: '📚' },
        { name: 'Students', path: '/teacher/students', icon: '👥' },
        { name: 'Analytics', path: '/teacher/analytics', icon: '📊' },
        { name: 'Create Quiz', path: '/teacher/create-quiz', icon: '✏️' },
    ];

    const navItems = userRole === 'student' ? studentNavItems : teacherNavItems;

    if (pathname === '/' || pathname === '/login' || pathname === '/register') {
        return null; // Don't show navigation on landing and auth pages
    }

    return (
        <nav className="bg-white shadow-lg border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <button 
                            onClick={() => router.push('/')}
                            className="flex items-center space-x-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                            <span>🎓</span>
                            <span>EduQuest</span>
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
                                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                >
                                    <span>{item.icon}</span>
                                    <span className="hidden sm:block">{item.name}</span>
                                </button>
                            );
                        })}
                        
                        <div className="border-l border-gray-200 pl-4">
                            <button
                                onClick={() => {
                                    localStorage.removeItem('userRole');
                                    router.push('/');
                                }}
                                className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
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