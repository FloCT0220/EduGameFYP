'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProgressBar from '@/components/gamification/ProgressBar';
import Badge from '@/components/gamification/Badge';
import PointsDisplay from '@/components/gamification/PointsDisplay';
import Leaderboard from '@/components/gamification/Leaderboard';

// Mock data - replace with actual API calls
const mockUserData = {
    id: "user123",
    name: "Alex Johnson",
    points: 2850,
    level: 12,
    currentXP: 350,
    xpForNextLevel: 500,
    streakDays: 7,
    coursesCompleted: 3,
    totalCourses: 8,
    quizzesCompleted: 15,
    totalQuizzes: 20
};

const mockAchievements = [
    { title: "First Steps", description: "Complete your first quiz", icon: "🎯", earned: true, earnedDate: new Date('2024-01-15'), rarity: "common" as const },
    { title: "Quick Learner", description: "Score 100% on 5 quizzes", icon: "⚡", earned: true, earnedDate: new Date('2024-01-20'), rarity: "rare" as const },
    { title: "Streak Master", description: "Maintain a 7-day learning streak", icon: "🔥", earned: true, earnedDate: new Date('2024-01-25'), rarity: "epic" as const },
    { title: "Knowledge Seeker", description: "Complete 10 courses", icon: "📚", earned: false, rarity: "legendary" as const },
    { title: "Quiz Champion", description: "Perfect score on advanced quiz", icon: "👑", earned: false, rarity: "legendary" as const },
    { title: "Helpful Student", description: "Help 5 classmates", icon: "🤝", earned: false, rarity: "rare" as const },
];

const mockLeaderboard = [
    { id: "user456", name: "Sarah Chen", points: 3200, level: 15, streak: 12 },
    { id: "user789", name: "Mike Rodriguez", points: 3100, level: 14, streak: 8 },
    { id: "user123", name: "Alex Johnson", points: 2850, level: 12, streak: 7 },
    { id: "user321", name: "Emily Davis", points: 2700, level: 11, streak: 5 },
    { id: "user654", name: "David Kim", points: 2500, level: 10, streak: 3 },
];

const mockRecentCourses = [
    { id: 1, name: "React Fundamentals", progress: 85, totalLessons: 20, completedLessons: 17 },
    { id: 2, name: "JavaScript Advanced", progress: 60, totalLessons: 15, completedLessons: 9 },
    { id: 3, name: "TypeScript Basics", progress: 100, totalLessons: 12, completedLessons: 12 },
];

export default function Dashboard() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(tabParam || 'overview');
    const [userData, setUserData] = useState(mockUserData);
    const [showRecentActivity, setShowRecentActivity] = useState(true);

    useEffect(() => {
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome back, {userData.name}! 👋
                    </h1>
                    <p className="text-gray-600">Ready to continue your learning journey?</p>
                </div>

                {/* Points Display */}
                <div className="mb-8">
                    <PointsDisplay
                        points={userData.points}
                        level={userData.level}
                        xpForNextLevel={userData.xpForNextLevel}
                        currentXP={userData.currentXP}
                        showAnimation={true}
                        size="lg"
                    />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <div className="text-3xl mr-3">🔥</div>
                            <div>
                                <p className="text-sm text-gray-600">Current Streak</p>
                                <p className="text-2xl font-bold text-orange-600">{userData.streakDays} days</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <div className="text-3xl mr-3">📚</div>
                            <div>
                                <p className="text-sm text-gray-600">Courses</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {userData.coursesCompleted}/{userData.totalCourses}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <div className="text-3xl mr-3">🎯</div>
                            <div>
                                <p className="text-sm text-gray-600">Quizzes</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {userData.quizzesCompleted}/{userData.totalQuizzes}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <div className="text-3xl mr-3">🏆</div>
                            <div>
                                <p className="text-sm text-gray-600">Achievements</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {mockAchievements.filter(a => a.earned).length}/{mockAchievements.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            {['overview', 'courses', 'achievements', 'leaderboard'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                                        activeTab === tab
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Recent Courses */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-semibold mb-4">Continue Learning</h3>
                            <div className="space-y-4">
                                {mockRecentCourses.map((course) => (
                                    <div key={course.id} className="border rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-2">{course.name}</h4>
                                        <ProgressBar
                                            current={course.completedLessons}
                                            total={course.totalLessons}
                                            label={`${course.completedLessons}/${course.totalLessons} lessons`}
                                            color="blue"
                                        />
                                        <button className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium">
                                            Continue Course →
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Achievements */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-semibold mb-4">Recent Achievements</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {mockAchievements.filter(a => a.earned).slice(0, 4).map((achievement, index) => (
                                    <Badge
                                        key={index}
                                        title={achievement.title}
                                        description={achievement.description}
                                        icon={achievement.icon}
                                        earned={achievement.earned}
                                        earnedDate={achievement.earnedDate}
                                        rarity={achievement.rarity}
                                        size="sm"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'courses' && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-xl font-semibold mb-6">Your Courses</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {mockRecentCourses.map((course) => (
                                <div key={course.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                                    <h4 className="font-semibold text-lg mb-3">{course.name}</h4>
                                    <ProgressBar
                                        current={course.completedLessons}
                                        total={course.totalLessons}
                                        label="Progress"
                                        color={course.progress === 100 ? "green" : "blue"}
                                    />
                                    <div className="mt-4 flex justify-between items-center">
                                        <span className="text-sm text-gray-600">
                                            {course.progress}% Complete
                                        </span>
                                        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm">
                                            {course.progress === 100 ? "Review" : "Continue"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'achievements' && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-xl font-semibold mb-6">Achievements</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {mockAchievements.map((achievement, index) => (
                                <Badge
                                    key={index}
                                    title={achievement.title}
                                    description={achievement.description}
                                    icon={achievement.icon}
                                    earned={achievement.earned}
                                    earnedDate={achievement.earnedDate}
                                    rarity={achievement.rarity}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div className="max-w-2xl mx-auto">
                        <Leaderboard 
                            entries={mockLeaderboard}
                            currentUserId={userData.id}
                            title="Weekly Leaderboard"
                        />
                    </div>
                )}
            </div>
        </div>
    );
} 