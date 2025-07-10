'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Navigation() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout, isAuthenticated } = useAuth();

    const studentNavItems = [
        { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
        { name: 'Courses', path: '/courses', icon: '📚' },
        { name: 'Coding Simulators', path: '/coding-sim', icon: '🖥️' },
        { name: 'Leaderboard', path: '/leaderboard', icon: '🏅' },
    ];

    const adminNavItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: '🏠' }
    ];
    const navItems = user?.role === 'student' ? studentNavItems : adminNavItems;

    if (pathname === '/' || pathname === '/login' || pathname === '/register' || !isAuthenticated) {
        return null; // Don't show navigation on landing and auth pages
    }

    // Don't show navigation on admin pages (admin layout has its own sidebar)
    if (pathname.startsWith('/admin/')) {
        return null;
    }

    return (
        <nav className="fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-blue-900 to-blue-800 shadow-2xl z-40 block">
            <div className="flex flex-col h-full">
                {/* Logo/Header */}
                <div className="flex items-center p-4 border-b border-blue-700">
                    <button 
                        onClick={() => {
                            if (user?.role === 'admin') {
                                router.push('/admin/dashboard');
                            } else {
                                router.push('/dashboard');
                            }
                        }}
                        className="flex items-center space-x-2 text-xl font-bold text-white hover:text-blue-200 transition-colors"
                    >
                        <span className="text-2xl">🎓</span>
                        <span className="text-gradient">EduQuest</span>
                    </button>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 py-4">
                    <div className="space-y-2 px-3">
                        {navItems.map((item) => {
                            const isActive = pathname === item.path || 
                                           (item.path === '/dashboard' && pathname === '/dashboard') ||
                                           (item.path === '/courses' && pathname.startsWith('/courses')) ||
                                           (item.path === '/coding-sim' && pathname === '/coding-sim') ||
                                           (item.path === '/leaderboard' && pathname === '/leaderboard');
                            
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => {
                                        if (item.path === '/quiz') {
                                            // For general quiz access from nav, use default parameters
                                            router.push('/quiz?courseId=1&nodeId=general&nodeName=General Knowledge Quiz');
                                        } else {
                                            router.push(item.path);
                                        }
                                    }}
                                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        isActive
                                            ? 'bg-white/20 text-white shadow-lg'
                                            : 'text-white/80 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    <span>{item.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* User Info and Actions */}
                <div className="border-t border-blue-700 p-4">
                    {/* Profile Link */}
                    <button
                        onClick={() => router.push('/profile')}
                        className={`w-full flex items-center space-x-3 px-3 py-2 mb-3 text-sm rounded-lg transition-all duration-200 ${
                            pathname === '/profile'
                                ? 'bg-white/20 text-white shadow-lg'
                                : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 text-left">
                            <div className="text-sm font-medium truncate">{user?.username}</div>
                            <div className="text-xs text-white/60">View Profile</div>
                        </div>
                    </button>
                    
                    {/* Logout Button */}
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to logout?')) {
                                logout();
                                router.push('/');
                            }
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-white/80 hover:text-red-200 hover:bg-red-500/20 rounded-lg transition-all duration-200 border border-red-500/30"
                    >
                        <span className="text-lg">🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    );
} 