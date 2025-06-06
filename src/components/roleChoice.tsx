'use client';

import { useRouter } from 'next/navigation';

export default function RoleChoice() {
    const router = useRouter();

    const handleRoleSelect = (role: 'student' | 'teacher') => {
        // Store role in localStorage for demo purposes
        localStorage.setItem('userRole', role);
        
        if (role === 'student') {
            router.push('/dashboard');
        } else {
            router.push('/login');
        }
    };

    return (
        <div className="text-center">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome to EduQuest 🎓
                </h1>
                <p className="text-gray-600">
                    Your gamified learning adventure starts here!
                </p>
            </div>

            <h2 className="text-xl font-semibold mb-6 text-gray-800">Choose Your Role</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                    onClick={() => handleRoleSelect('student')}
                    className="group cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🎯</div>
                    <h3 className="text-xl font-bold text-blue-700 mb-3">Student</h3>
                    <p className="text-blue-600 text-sm mb-4">
                        Learn, earn points, unlock achievements, and climb the leaderboards!
                    </p>
                    <div className="flex justify-center space-x-2 text-2xl">
                        <span>⭐</span>
                        <span>🏆</span>
                        <span>🔥</span>
                        <span>📚</span>
                    </div>
                    <div className="mt-4">
                        <span className="inline-block bg-blue-500 text-white px-4 py-2 rounded-lg font-medium group-hover:bg-blue-600 transition-colors">
                            Start Learning →
                        </span>
                    </div>
                </div>

                <div 
                    onClick={() => handleRoleSelect('teacher')}
                    className="group cursor-pointer bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">👨‍🏫</div>
                    <h3 className="text-xl font-bold text-green-700 mb-3">Teacher</h3>
                    <p className="text-green-600 text-sm mb-4">
                        Create courses, manage students, and track their progress with analytics!
                    </p>
                    <div className="flex justify-center space-x-2 text-2xl">
                        <span>📊</span>
                        <span>✏️</span>
                        <span>📋</span>
                        <span>🎨</span>
                    </div>
                    <div className="mt-4">
                        <span className="inline-block bg-green-500 text-white px-4 py-2 rounded-lg font-medium group-hover:bg-green-600 transition-colors">
                            Start Teaching →
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">🎮 Gamification Features</h4>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center">
                        <span className="mr-1">⭐</span>
                        Points & XP
                    </span>
                    <span className="flex items-center">
                        <span className="mr-1">🏆</span>
                        Achievements
                    </span>
                    <span className="flex items-center">
                        <span className="mr-1">🔥</span>
                        Streaks
                    </span>
                    <span className="flex items-center">
                        <span className="mr-1">📊</span>
                        Leaderboards
                    </span>
                    <span className="flex items-center">
                        <span className="mr-1">🎯</span>
                        Progress Tracking
                    </span>
                </div>
            </div>
        </div>
    );
}