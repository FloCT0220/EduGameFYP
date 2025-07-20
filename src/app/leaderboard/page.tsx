'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Leaderboard from '@/components/gamification/Leaderboard';

interface LeaderboardUser {
  id: number;
  name: string;
  total_points: number;
  current_streak: number;
  max_streak: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLimit, setSelectedLimit] = useState(10);

  // Redirect to login if not authenticated
  useEffect(() => {
    // Only redirect if auth check is complete AND user is not authenticated
    if (!authLoading && !user && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, user, isAuthenticated, router]);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/leaderboard?limit=${selectedLimit}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        
        const data = await response.json();
        if (data.success) {
          setLeaderboardData(data.leaderboard);
        } else {
          throw new Error(data.error || 'Failed to load leaderboard');
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchLeaderboard();
    }
  }, [isAuthenticated, selectedLimit]);

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen p-6 md:ml-64" style={{ background: 'var(--background-primary)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/20 rounded w-1/3"></div>
            <div className="bg-white/10 rounded-lg p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-white/20 rounded"></div>
                ))}
              </div>
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
            <h2 className="text-red-800 font-semibold mb-2">Error Loading Leaderboard</h2>
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

  // Transform data for Leaderboard component
  const leaderboardEntries = leaderboardData.map(userData => ({
    id: userData.id.toString(),
    name: userData.name,
    points: userData.total_points,
    streak: userData.current_streak,
    level: Math.floor(userData.total_points / 1000) + 1
  }));

  // Find user's points from leaderboard data if present, else 0
  const currentUserEntry = user ? leaderboardData.find(u => u.id === user.id) : undefined;
  const currentUserPoints = currentUserEntry ? currentUserEntry.total_points : 0;

  return (
    <div className="min-h-screen p-6 md:ml-64" style={{ background: 'var(--background-primary)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-white/80 rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            🏆 Leaderboard
          </h1>
          <p className="text-gray-700 mb-4">
            See where you rank among all students! Earn points by completing courses, quizzes, and coding challenges.
          </p>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Show top:</label>
              <select
                value={selectedLimit}
                onChange={(e) => setSelectedLimit(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10 students</option>
                <option value={25}>25 students</option>
                <option value={50}>50 students</option>
                <option value={100}>100 students</option>
              </select>
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* User's Current Position (if not in top results) */}
        {user && leaderboardEntries.length > 0 && !leaderboardEntries.find(entry => entry.id === user.id.toString()) && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Your Position</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                ?
              </div>
              <div>
                <div className="font-medium text-blue-900">{user.username} (You)</div>
                <div className="text-sm text-blue-700">⭐ {currentUserPoints.toLocaleString()} points</div>
              </div>
            </div>
            <p className="text-sm text-blue-600 mt-2">
              Keep learning to climb up the leaderboard! 💪
            </p>
          </div>
        )}

        {/* Leaderboard */}
        <Leaderboard
          entries={leaderboardEntries}
          currentUserId={user?.id.toString()}
          title="🎯 Top Students"
          maxEntries={selectedLimit}
        />

        {/* Motivational Footer */}
        <div className="mt-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">🚀 Ready to climb higher?</h3>
          <p className="text-gray-700 mb-4">
            Complete courses, ace quizzes, and solve coding challenges to earn more points!
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => router.push('/courses')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              📚 Browse Courses
            </button>
            <button
              onClick={() => router.push('/coding-sim')}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              🖥️ Coding Challenges
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              🏠 Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 