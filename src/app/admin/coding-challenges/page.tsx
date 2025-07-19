'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSession } from '@/lib/session';

interface CodingChallenge {
  id: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'intermediate' | 'hard';
  points: number;
  supported_language: string;
  is_active: boolean;
  created_at: string;
  created_by_username: string;
  submissions_count: number;
  success_rate: number;
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', color: 'bg-green-100 text-green-800' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'hard', label: 'Hard', color: 'bg-red-100 text-red-800' }
];

export default function AdminCodingChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<CodingChallenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<CodingChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get unique languages from challenges for dynamic filter options
  const availableLanguages = Array.from(new Set(challenges.map(c => c.supported_language))).sort();

  const fetchChallenges = useCallback(async () => {
    try {
      const token = getSession('authToken');
      const response = await fetch('/api/admin/coding-challenges', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChallenges(data.challenges || []);
      } else {
        console.error('Failed to fetch challenges');
        setChallenges([]);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
      setChallenges([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...challenges];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(challenge =>
        challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.supported_language.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(challenge => challenge.difficulty === difficultyFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(challenge => challenge.is_active === isActive);
    }

    // Language filter
    if (languageFilter !== 'all') {
      filtered = filtered.filter(challenge => challenge.supported_language === languageFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: string | number | boolean = a[sortBy as keyof CodingChallenge];
      let bValue: string | number | boolean = b[sortBy as keyof CodingChallenge];

      // Handle date sorting
      if (sortBy === 'created_at') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      // Handle numeric sorting
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    setFilteredChallenges(filtered);
  }, [challenges, searchTerm, difficultyFilter, statusFilter, languageFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchChallenges();
    }
  }, [user, fetchChallenges]);

  // Apply filters whenever challenges or filter states change
  useEffect(() => {
    applyFilters();
    }, [applyFilters]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return;
    
    try {
      const token = getSession('authToken');
      const response = await fetch(`/api/admin/coding-challenges/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        fetchChallenges();
      } else {
        alert('Error deleting challenge');
      }
    } catch (error) {
      console.error('Error deleting challenge:', error);
      alert('Error deleting challenge');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
              <p className="text-gray-600">You need admin privileges to access this page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Manage Coding Challenges</h1>
            <a
              href="/admin/coding-challenges/add"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Challenge
            </a>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters & Search</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search challenges..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Language Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Languages</option>
                  {availableLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort Controls */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="created_at">Date Created</option>
                  <option value="title">Title</option>
                  <option value="difficulty">Difficulty</option>
                  <option value="points">Points</option>
                  <option value="submissions_count">Submissions</option>
                  <option value="success_rate">Success Rate</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Order:</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDifficultyFilter('all');
                  setStatusFilter('all');
                  setLanguageFilter('all');
                  setSortBy('created_at');
                  setSortOrder('desc');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>

              {/* Results Count */}
              <div className="text-sm text-gray-600">
                Showing {filteredChallenges.length} of {challenges.length} challenges
              </div>
            </div>
          </div>

          {/* Challenges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge) => (
              <div key={challenge.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{challenge.title}</h3>
                  <div className="flex space-x-2">
                    <a
                      href={`/admin/coding-challenges/edit/${challenge.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </a>
                    <button
                      onClick={() => handleDelete(challenge.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-3">{challenge.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Difficulty:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      DIFFICULTY_OPTIONS.find(d => d.value === challenge.difficulty)?.color
                    }`}>
                      {DIFFICULTY_OPTIONS.find(d => d.value === challenge.difficulty)?.label}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Points:</span>
                    <span className="text-gray-900">{challenge.points}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Language:</span>
                    <span className="text-gray-900">{challenge.supported_language}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Submissions:</span>
                    <span className="text-gray-900">{challenge.submissions_count}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Success Rate:</span>
                    <span className="text-gray-900">{challenge.success_rate}%</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      challenge.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {challenge.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
              </div>
            ))}
          </div>

          {filteredChallenges.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No coding challenges found</div>
              <a
                href="/admin/coding-challenges/add"
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create your first challenge
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 