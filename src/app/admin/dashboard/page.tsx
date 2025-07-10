'use client';

import React, { useState, useEffect } from 'react';
import { FaUsers, FaBook, FaChartLine, FaTrophy, FaCode, FaClock, FaEye } from 'react-icons/fa';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalQuizzes: number;
  totalCodingChallenges: number;
  activeUsers: number;
  completedCourses: number;
}

interface RecentActivity {
  id: number;
  type: 'user_registration' | 'course_completion' | 'quiz_submission' | 'challenge_submission';
  user: string;
  description: string;
  timestamp: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentActivity(data.recentActivity || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration': return <FaUsers className="h-4 w-4 text-blue-600" />;
      case 'course_completion': return <FaBook className="h-4 w-4 text-green-600" />;
      case 'quiz_submission': return <FaTrophy className="h-4 w-4 text-purple-600" />;
      case 'challenge_submission': return <FaCode className="h-4 w-4 text-orange-600" />;
      default: return <FaEye className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of platform activity and statistics</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <FaUsers className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalCourses || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <FaBook className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Quiz Questions</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalQuizzes || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <FaTrophy className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Coding Challenges</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalCodingChallenges || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <FaCode className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users (7 days)</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.activeUsers || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50">
              <FaChartLine className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Courses</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.completedCourses || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50">
              <FaClock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/admin/users" className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="p-2 rounded-lg bg-blue-50 mr-3">
                <FaUsers className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Manage Users</p>
                <p className="text-xs text-gray-600">View all learners</p>
              </div>
            </Link>
            
            <Link href="/admin/subjects" className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="p-2 rounded-lg bg-green-50 mr-3">
                <FaBook className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Course Materials</p>
                <p className="text-xs text-gray-600">Upload content</p>
              </div>
            </Link>
            
            <Link href="/admin/quizzes" className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="p-2 rounded-lg bg-purple-50 mr-3">
                <FaTrophy className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Assessments</p>
                <p className="text-xs text-gray-600">Create quizzes</p>
              </div>
            </Link>
            
            <Link href="/admin/coding-challenges" className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="p-2 rounded-lg bg-orange-50 mr-3">
                <FaCode className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Coding Challenges</p>
                <p className="text-xs text-gray-600">Add exercises</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link href="/admin/analytics" className="text-sm text-blue-600 hover:text-blue-800">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user}</span> {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 