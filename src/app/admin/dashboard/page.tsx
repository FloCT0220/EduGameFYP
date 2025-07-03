'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AdminStats {
  totalUsers: number;
  totalSubjects: number;
  totalQuizzes: number;
  totalAchievements: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSubjects: 0,
    totalQuizzes: 0,
    totalAchievements: 0
  });

  useEffect(() => {
    // Fetch admin dashboard stats
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">📚</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSubjects}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <span className="text-2xl">✏️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Quizzes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-2xl">🎖️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Achievements</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAchievements}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => router.push('/admin/subjects')}
                className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-2xl mb-2">📚</div>
                <h3 className="font-medium text-gray-900">Manage Subjects</h3>
                <p className="text-sm text-gray-600">Add, edit, or delete subjects</p>
              </button>
              
              <button 
                onClick={() => router.push('/admin/quizzes')}
                className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-2xl mb-2">✏️</div>
                <h3 className="font-medium text-gray-900">Manage Quizzes</h3>
                <p className="text-sm text-gray-600">Create and edit quiz questions</p>
              </button>
              
              <button 
                onClick={() => router.push('/admin/achievements')}
                className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-2xl mb-2">🎖️</div>
                <h3 className="font-medium text-gray-900">Manage Achievements</h3>
                <p className="text-sm text-gray-600">Set up achievement criteria</p>
              </button>
              
              <button 
                onClick={() => router.push('/admin/users')}
                className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-2xl mb-2">👥</div>
                <h3 className="font-medium text-gray-900">Manage Users</h3>
                <p className="text-sm text-gray-600">View and manage user accounts</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 