'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getSession } from '@/lib/session';
import PointsDisplay from '@/components/gamification/PointsDisplay';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar_url?: string;
  bio?: string;
  total_points: number;
  level: number;
  current_streak: number;
  max_streak: number;
  created_at: string;
  last_login?: string;
}

interface UserStats {
  totalCourses: number;
  completedCourses: number;
  codingChallengesCompleted: number;
  totalAchievements: number;
}

interface Course {
  progress: number;
}

interface Achievement {
  earned: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    bio: ''
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    // Only redirect if auth check is complete AND user is not authenticated
    if (!authLoading && !user && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, user, isAuthenticated, router]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);

        // Get user profile and stats
        const [profileRes, statsRes] = await Promise.all([
          fetch(`/api/users?userId=${user.id}`),
          fetch(`/api/dashboard?userId=${user.id}`)
        ]);

        if (!profileRes.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const profileData = await profileRes.json();
        if (profileData.success && profileData.user) {
          setProfile(profileData.user);
          setEditForm({
            username: profileData.user.username || '',
            bio: profileData.user.bio || ''
          });
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.success) {
            const dashboardData = statsData.data;
            setStats({
              totalCourses: dashboardData.courses?.length || 0,
              completedCourses: dashboardData.courses?.filter((c: Course) => c.progress === 100).length || 0,
              codingChallengesCompleted: 0, // TODO: Add coding challenges stats
              totalAchievements: dashboardData.achievements?.filter((a: Achievement) => a.earned).length || 0
            });
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user) {
      fetchProfile();
    }
  }, [isAuthenticated, user]);

  const handleSaveProfile = async () => {
    try {
      const token = getSession('authToken');
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user?.id,
          username: editForm.username,
          bio: editForm.bio
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(prev => prev ? { ...prev, ...editForm } : null);
          setIsEditing(false);
        }
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen p-6 md:ml-64" style={{ background: 'var(--background-primary)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/20 rounded w-1/3"></div>
            <div className="bg-white/10 rounded-lg p-6 space-y-4">
              <div className="h-20 bg-white/20 rounded"></div>
              <div className="h-4 bg-white/20 rounded w-3/4"></div>
              <div className="h-4 bg-white/20 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-6 md:ml-64" style={{ background: 'var(--background-primary)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold mb-2">Error Loading Profile</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen p-6 md:ml-64" style={{ background: 'var(--background-primary)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-500">Profile not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:ml-64" style={{ background: 'var(--background-primary)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-white/80 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                      className="text-3xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none"
                    />
                  ) : (
                    profile.username
                  )}
                </h1>
                <p className="text-gray-600">
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} • Member since {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    ✅ Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        username: profile.username,
                        bio: profile.bio || ''
                      });
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    ❌ Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  ✏️ Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Bio Section */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Bio</h3>
            {isEditing ? (
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            ) : (
              <p className="text-gray-600">
                {profile.bio || "No bio added yet. Click 'Edit Profile' to add one!"}
              </p>
            )}
          </div>
        </div>

        {/* Points Display */}
        <div className="mb-8">
          <PointsDisplay
            points={profile.total_points}
            level={profile.level}
            xpForNextLevel={1000}
            currentXP={profile.total_points % 1000}
            showAnimation={false}
            size="lg"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 rounded-lg p-6 text-center">
            <div className="text-3xl mb-2">🔥</div>
            <div className="text-2xl font-bold text-orange-600">{profile.current_streak}</div>
            <div className="text-sm text-gray-600">Current Streak</div>
            <div className="text-xs text-gray-500 mt-1">Max: {profile.max_streak} days</div>
          </div>

          <div className="bg-white/80 rounded-lg p-6 text-center">
            <div className="text-3xl mb-2">📚</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.completedCourses || 0}/{stats?.totalCourses || 0}
            </div>
            <div className="text-sm text-gray-600">Courses Completed</div>
          </div>

          <div className="bg-white/80 rounded-lg p-6 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-purple-600">{stats?.totalAchievements || 0}</div>
            <div className="text-sm text-gray-600">Achievements</div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white/80 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">📧 Account Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{profile.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Role:</span>
              <span className="font-medium capitalize">{profile.role}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Joined:</span>
              <span className="font-medium">{new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
            {profile.last_login && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Last Login:</span>
                <span className="font-medium">{new Date(profile.last_login).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-4">⚠️ Account Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to logout?')) {
                  logout();
                  router.push('/');
                }
              }}
              className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 