'use client';

import { useState, useEffect } from 'react';
import { Search, Code, Users, Trophy } from 'lucide-react';
import Link from 'next/link';

interface CodingChallenge {
  id: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'intermediate' | 'hard';
  points: number;
  supported_languages: string[];
  tags: string[];
  created_at: string;
  submissions_count?: number;
  success_rate?: number;
}

const difficulties = [
  { value: 'all', label: 'All Difficulties', color: 'bg-white/20 text-black' },
  { value: 'easy', label: 'Easy', color: 'bg-green-500/20 text-black' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-500/20 text-black' },
  { value: 'hard', label: 'Hard', color: 'bg-red-500/20 text-black' }
];

const languages = [
  { value: 'all', label: 'All Languages', icon: '💻' },
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'javascript', label: 'JavaScript', icon: '⚡' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'cpp', label: 'C++', icon: '⚙️' },
  { value: 'c', label: 'C', icon: '🔧' }
];

export default function CodingSimPage() {
  const [challenges, setChallenges] = useState<CodingChallenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<CodingChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');

  useEffect(() => {
    fetchChallenges();
  }, []);

  useEffect(() => {
    filterChallenges();
  }, [challenges, searchTerm, selectedDifficulty, selectedLanguage]);

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/coding-challenges');
      if (response.ok) {
        const data = await response.json();
        setChallenges(data);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterChallenges = () => {
    let filtered = challenges;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(challenge =>
        challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(challenge => challenge.difficulty === selectedDifficulty);
    }

    // Filter by language
    if (selectedLanguage !== 'all') {
      filtered = filtered.filter(challenge =>
        challenge.supported_languages.includes(selectedLanguage)
      );
    }

    setFilteredChallenges(filtered);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-300';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-300';
      case 'hard': return 'bg-red-500/20 text-red-300';
      default: return 'bg-white/20 text-white';
    }
  };

  const getPoints = (challenge: CodingChallenge) => {
    return challenge.points;
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6" style={{ background: 'var(--background-primary)' }}>
        <div className="max-w-7xl mx-auto">  <div className="animate-pulse space-y-8">
            <div className="h-8 bg-white/20 rounded w-1/3"></div>
            <div className="card">
              <div className="h-12 bg-white/20 rounded w-full mb-6"></div>
              <div className="flex flex-wrap gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-8 bg-white/20 rounded w-24"></div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card">
                  <div className="h-6 bg-white/20 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-white/20 rounded w-full mb-2"></div>
                  <div className="h-4 bg-white/20 rounded w-2/3 mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-white/20 rounded w-16"></div>
                    <div className="h-6 bg-white/20 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--background-primary)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-white/80 rounded-lg p-4">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Code className="text-blue-600" />
            Coding Challenges
          </h1>
          <p className="text-white/80">Practice your programming skills with our collection of coding challenges</p>
        </div>

        {/* Search and Filters */}
        <div className="card mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                <input
                  type="text"
                  placeholder="Search challenges by title, description, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/60"
                />
              </div>
            </div>

            {/* Difficulty Filter */}
            <div className="flex flex-wrap gap-2">
              {difficulties.map((difficulty) => (
                <button
                  key={difficulty.value}
                  onClick={() => setSelectedDifficulty(difficulty.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors border border-gray-700 ${
                    selectedDifficulty === difficulty.value
                      ? 'bg-blue-500 text-white'
                      : difficulty.color
                  }`}
                >
                  {difficulty.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language Filter */}
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {languages.map((language) => (
                <button
                  key={language.value}
                  onClick={() => setSelectedLanguage(language.value)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-2 border border-gray-300 ${
                    selectedLanguage === language.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-black hover:bg-gray-200'
                  }`}
                >
                  <span>{language.icon}</span>
                  {language.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-white/80">
            Showing {filteredChallenges.length} of {challenges.length} challenges
          </p>
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map((challenge) => (
            <Link
              key={challenge.id}
              href={`/coding-sim/challenge/${challenge.id}`}
              className="card hover:bg-white/10 transition-all duration-200 group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors">
                  {challenge.title}
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                  {challenge.difficulty}
                </span>
              </div>

              <p className="text-white/80 mb-4 line-clamp-3">
                {challenge.description}
              </p>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-black/60">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm font-medium">{getPoints(challenge)} points</span>
                </div>
                <div className="flex items-center gap-2 text-black/60">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{challenge.submissions_count || 0} attempts</span>
                </div>
              </div>

              {/* Languages */}
              <div className="flex flex-wrap gap-2 mb-4">
                {challenge.supported_languages.slice(0, 3).map((lang) => (
                  <span
                    key={lang}
                    className="px-2 py-1 bg-gray-200 text-white/80 text-xs rounded"
                  >
                    {lang}
                  </span>
                ))}
                {challenge.supported_languages.length > 3 && (
                  <span className="px-2 py-1 bg-gray-200 text-white/80 text-xs rounded">
                    +{challenge.supported_languages.length - 3} more
                  </span>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {challenge.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Success Rate */}
              {challenge.success_rate !== undefined && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Success Rate</span>
                    <span className="text-sm font-medium text-green-400">
                      {challenge.success_rate}%
                    </span>
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredChallenges.length === 0 && !loading && (
          <div className="text-center py-12">
            <Code className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No challenges found
            </h3>
            <p className="text-white/80 mb-4">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDifficulty('all');
                setSelectedLanguage('all');
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 