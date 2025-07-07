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
        { name: 'Leaderboard', path: '/dashboard?tab=leaderboard', icon: '🏅' },
    ];

    const adminNavItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: '🏠' }
    ];
    const navItems = user?.role === 'student' ? studentNavItems : adminNavItems;

    if (pathname === '/' || pathname === '/login' || pathname === '/register' || !isAuthenticated) {
        return null; // Don't show navigation on landing and auth pages
    }

    // Check if we should show sidebar (on dashboard or courses pages)
    const shouldShowSidebar = pathname === '/dashboard' || 
                             pathname === '/courses' || 
                             pathname.startsWith('/courses/') ||
                             pathname.startsWith('/admin/dashboard');

    if (!shouldShowSidebar) {
        return null; // Don't show sidebar on other pages
    }

    return (
        <nav className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-blue-900 to-blue-800 shadow-2xl z-50 md:block hidden">
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
                                           (item.path.includes('?tab=') && pathname === '/dashboard') ||
                                           (item.path === '/dashboard' && pathname === '/dashboard') ||
                                           (item.path === '/courses' && pathname.startsWith('/courses')) ||
                                           (item.path.includes('tab=leaderboard') && pathname === '/dashboard');
                            
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

                {/* User Info and Logout */}
                <div className="border-t border-blue-700 p-4">
                    <div className="mb-3">
                        <div className="text-xs text-white/60 mb-1">Welcome back</div>
                        <div className="text-sm text-white font-medium truncate">
                            {user?.username}
                        </div>
                    </div>
                    
                    <button
                        onClick={() => {
                            logout();
                            router.push('/');
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-white/80 hover:text-red-200 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                    >
                        <span className="text-lg">🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    );
} 