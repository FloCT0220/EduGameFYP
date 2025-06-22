'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProgressBar from '@/components/gamification/ProgressBar';
import Badge from '@/components/gamification/Badge';
import PointsDisplay from '@/components/gamification/PointsDisplay';
import Leaderboard from '@/components/gamification/Leaderboard';

// For now, using a hardcoded user ID - replace with actual authentication
const CURRENT_USER_ID = 1; // This should come from your auth system

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

interface LeaderboardEntry {
    id: number;
    name: string;
    points: number;
    level: number;
    streak: number;
}

export default function Dashboard() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(tabParam || 'overview');
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch dashboard data from API
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/dashboard?userId=${CURRENT_USER_ID}`);
                
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
    }, []);

    // Fetch leaderboard data
    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch('/api/leaderboard');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setLeaderboardData(data.leaderboard);
                    }
                }
            } catch (err) {
                console.error('Error fetching leaderboard:', err);
            }
        };

        fetchLeaderboard();
    }, []);

    useEffect(() => {
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen p-6" style={{ background: 'var(--background-primary)' }}>
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
            <div className="min-h-screen p-6" style={{ background: 'var(--background-primary)' }}>
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

    const { user, courses, achievements, quizStats } = dashboardData;

    return (
        <div className="min-h-screen p-6" style={{ background: 'var(--background-primary)' }}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 bg-white/80 rounded-lg p-4">
                    <h1 className="text-3xl font-bold mb-2">
                        Welcome back, {user.name}! 👋
                    </h1>
                    <p className="text-white/80">Ready to continue your learning journey?</p>
                </div>

                {/* Points Display */}
                <div className="mb-8">
                    <PointsDisplay
                        points={user.points}
                        level={user.level}
                        xpForNextLevel={user.xpForNextLevel}
                        currentXP={user.currentXP}
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
                                <p className="text-2xl font-bold text-orange-600">{user.streakDays} days</p>
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

                {/* Tabs */}
                <div className="mb-8">
                    <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
                        {[
                            { id: 'overview', label: 'Overview', icon: '📊' },
                            { id: 'courses', label: 'Courses', icon: '📚' },
                            { id: 'achievements', label: 'Achievements', icon: '🏆' },
                            { id: 'leaderboard', label: 'Leaderboard', icon: '🏅' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                    activeTab === tab.id
                                        ? 'bg-white text-gray-900 shadow-lg'
                                        : 'text-white/80 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Activity */}
                            <div className="card">
                                <h2 className="font-semibold text-gray-900 mb-4">Recent Activity</h2>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                                        <span className="text-2xl">📚</span>
                                        <div>
                                            <p className="font-medium text-gray-900">Completed Algebra Basics</p>
                                            <p className="text-sm text-gray-600">2 hours ago</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                                        <span className="text-2xl">🏆</span>
                                        <div>
                                            <p className="font-medium text-gray-900">Earned &quot;Math Wizard&quot; Badge</p>
                                            <p className="text-sm text-gray-600">1 day ago</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                                        <span className="text-2xl">⭐</span>
                                        <div>
                                            <p className="font-medium text-gray-900">Reached Level 5</p>
                                            <p className="text-sm text-gray-600">3 days ago</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="card">
                                <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="btn btn-primary">
                                        📚 Continue Learning
                                    </button>
                                    <button className="btn btn-secondary">
                                        🧩 Take Quiz
                                    </button>
                                    <button className="btn btn-success">
                                        🏆 View Achievements
                                    </button>
                                    <button className="btn btn-warning">
                                        📊 View Progress
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'courses' && (
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Courses</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {courses.map((course) => (
                                    <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-gray-900">{course.name}</h4>
                                            <span className="text-sm text-gray-500">{course.progress}%</span>
                                        </div>
                                        <ProgressBar current={course.completedLessons} total={course.totalLessons} />
                                        <div className="mt-2 text-sm text-gray-600">
                                            {course.completedLessons}/{course.totalLessons} lessons completed
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'achievements' && (
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {achievements.map((achievement, index) => (
                                    <Badge
                                        key={index}
                                        title={achievement.title}
                                        description={achievement.description}
                                        icon={achievement.icon}
                                        earned={achievement.earned}
                                        rarity={achievement.rarity}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'leaderboard' && (
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leaderboard</h3>
                            <Leaderboard entries={leaderboardData.map(entry => ({ ...entry, id: entry.id.toString() }))} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 