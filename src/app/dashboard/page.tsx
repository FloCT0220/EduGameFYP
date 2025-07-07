'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Badge from '@/components/gamification/Badge';
import PointsDisplay from '@/components/gamification/PointsDisplay';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardData {
    user: {
        id: number;
        name: string;
        points: number;
        level: number;
        currentXP: number;
        xpForNextLevel: number;
        streakDays: number;
        maxStreak: number;
    };
    courses: Array<{
        id: number;
        name: string;
        progress: number;
        totalLessons: number;
        completedLessons: number;
    }>;
    achievements: Array<{
        title: string;
        description: string;
        icon: string;
        earned: boolean;
        earnedDate?: Date;
        rarity: 'common' | 'rare' | 'epic' | 'legendary';
    }>;
    quizStats: {
        totalAttempts: number;
        averageScore: number;
        totalPoints: number;
    };
}



export default function Dashboard() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Fetch dashboard data from API
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;
            
            try {
                setLoading(true);
                const response = await fetch(`/api/dashboard?userId=${user.id}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }
                
                const data = await response.json();
                if (data.success) {
                    setDashboardData(data.data);
                } else {
                    throw new Error(data.error || 'Failed to load dashboard data');
                }
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);



    // Loading state
    if (authLoading || loading || !user) {
        return (
            <div className="min-h-screen p-6 md:ml-64" style={{ background: 'var(--background-primary)' }}>
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse space-y-8">
                        <div className="h-8 bg-white/20 rounded w-1/3"></div>
                        <div className="grid grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-24 bg-white/20 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !dashboardData) {
        return (
            <div className="min-h-screen p-6 md:ml-64" style={{ background: 'var(--background-primary)' }}>
                <div className="max-w-7xl mx-auto">
                    <div className="card border-red-200 bg-red-50">
                        <h2 className="text-red-800 font-semibold mb-2">Error Loading Dashboard</h2>
                        <p className="text-red-600">{error || 'Failed to load dashboard data'}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="mt-4 btn btn-error"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const { user: dashboardUser, courses, achievements, quizStats } = dashboardData;

    return (
        <div className="min-h-screen p-6 md:ml-64" style={{ background: 'var(--background-primary)' }}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 bg-white/80 rounded-lg p-4">
                    <h1 className="text-3xl font-bold mb-2">
                        Welcome back, {dashboardUser.name}! 👋
                    </h1>
                    <p className="text-white/80">Ready to continue your learning journey?</p>
                </div>

                {/* Points Display */}
                <div className="mb-8">
                    <PointsDisplay
                        points={dashboardUser.points}
                        level={dashboardUser.level}
                        xpForNextLevel={dashboardUser.xpForNextLevel}
                        currentXP={dashboardUser.currentXP}
                        showAnimation={true}
                        size="lg"
                    />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="card">
                        <div className="flex items-center">
                            <div className="text-3xl mr-3">🔥</div>
                            <div>
                                <h3 className="text-sm text-gray-600">Current Streak</h3>
                                <p className="text-2xl font-bold text-orange-600">{dashboardUser.streakDays} days</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="card">
                        <div className="flex items-center">
                            <div className="text-3xl mr-3">📚</div>
                            <div>
                                <h3 className="text-sm text-gray-600">Courses</h3>
                                <p className="text-2xl font-bold text-blue-600">
                                    {courses.filter(c => c.progress === 100).length}/{courses.length}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="card">
                        <div className="flex items-center">
                            <div className="text-3xl mr-3">🏆</div>
                            <div>
                                <h3 className="text-sm text-gray-600">Achievements</h3>
                                <p className="text-2xl font-bold text-purple-600">
                                    {achievements.filter(a => a.earned).length}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="card">
                        <div className="flex items-center">
                            <div className="text-3xl mr-3">📊</div>
                            <div>
                                <h3 className="text-sm text-gray-600">Quiz Score</h3>
                                <p className="text-2xl font-bold text-green-600">
                                    {quizStats.averageScore}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>



                {/* Achievements */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Your Achievements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {achievements.map((achievement, index) => (
                            <Badge
                                key={`achievement-${achievement.title}-${index}`}
                                title={achievement.title}
                                description={achievement.description}
                                icon={achievement.icon}
                                earned={achievement.earned}
                                rarity={achievement.rarity}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
} 