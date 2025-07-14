'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSession } from '@/lib/session';

interface CodingChallenge {
  id: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'intermediate' | 'hard';
  points: number;
  supported_languages: string[];
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchChallenges();
    }
  }, [user]);

  const fetchChallenges = async () => {
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
  };

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

          {/* Challenges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => (
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
                    <span className="text-gray-500">Languages:</span>
                    <span className="text-gray-900">{challenge.supported_languages.join(', ')}</span>
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

          {challenges.length === 0 && !isLoading && (
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