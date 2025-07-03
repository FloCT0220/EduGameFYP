'use client';

import { useRouter } from 'next/navigation';

export default function RoleChoice() {
    const router = useRouter();

    const handleRoleSelect = (role: 'student' | 'admin') => {
        // Store role in localStorage for demo purposes
        localStorage.setItem('userRole', role);
        
        // Redirect to login page for both roles
        router.push('/login');
    };

    return (
        <div className="text-center">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-4 text-gradient">
                    Welcome to EduQuest 🎓
                </h1>
                <p className="text-lg text-gray-600">
                    Your gamified learning adventure starts here!
                </p>
            </div>

            <h2 className="text-2xl font-semibold mb-8 text-gray-800">Choose Your Role</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div 
                    onClick={() => handleRoleSelect('student')}
                    className="group cursor-pointer card hover:scale-105 transition-all duration-300 border-2 border-blue-200 hover:border-blue-300"
                >
                    <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🎯</div>
                    <h3 className="text-2xl font-bold text-blue-700 mb-4">Student</h3>
                    <p className="text-blue-600 mb-6 leading-relaxed">
                        Learn, earn points, unlock achievements, and climb the leaderboards!
                    </p>
                    <div className="flex justify-center space-x-3 text-3xl mb-6">
                        <span className="animate-bounce">⭐</span>
                        <span className="animate-pulse">🏆</span>
                        <span className="animate-glow">🔥</span>
                        <span>📚</span>
                    </div>
                    <div className="mt-6">
                        <span className="btn btn-primary group-hover:scale-105 transition-transform">
                            Start Learning →
                        </span>
                    </div>
                </div>

                <div 
                    onClick={() => handleRoleSelect('admin')}
                    className="group cursor-pointer card hover:scale-105 transition-all duration-300 border-2 border-gray-200 hover:border-gray-300"
                >
                    <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">⚙️</div>
                    <h3 className="text-2xl font-bold text-gray-700 mb-4">Admin</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                        Manage subjects, quizzes, achievements, and users with administrative controls.
                    </p>
                    <div className="flex justify-center space-x-3 text-3xl mb-6">
                        <span>📊</span>
                        <span>✏️</span>
                        <span>👥</span>
                        <span>🎖️</span>
                    </div>
                    <div className="mt-6">
                        <span className="btn btn-secondary group-hover:scale-105 transition-transform">
                            Admin Panel →
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}