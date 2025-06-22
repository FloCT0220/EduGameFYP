'use client';

import { useState, useEffect } from 'react';
import ProgressBar from '@/components/gamification/ProgressBar';

// For now, using a hardcoded user ID - replace with actual authentication
const CURRENT_USER_ID = 1;

interface SkillTree {
    id: number;
    title: string;
    description: string;
    icon: string;
    order_index: number;
    total_nodes: number;
    completed_nodes: number;
    progress_percentage: number;
}

interface Subject {
    id: number;
    title: string;
    description: string;
    difficulty: 'foundation' | 'intermediate' | 'advanced';
    estimated_duration: number;
    icon: string;
    color_theme: string;
    enrolled: boolean;
    progress_percentage: number;
    total_points_earned: number;
    skill_trees: SkillTree[];
}

export default function SubjectsPage() {
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const categories = ['all', 'foundation', 'intermediate', 'advanced'];
    
    // Fetch subjects from API
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    userId: CURRENT_USER_ID.toString(),
                    ...(activeFilter !== 'all' && { difficulty: activeFilter })
                });
                
                const response = await fetch(`/api/subjects?${params}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch subjects');
                }
                
                const data = await response.json();
                if (data.success) {
                    setSubjects(data.subjects);
                } else {
                    throw new Error(data.error || 'Failed to load subjects');
                }
            } catch (err) {
                console.error('Error fetching subjects:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, [activeFilter]);
    
    const filteredSubjects = subjects.filter(subject => {
        const matchesCategory = activeFilter === 'all' || subject.difficulty === activeFilter;
        const matchesSearch = subject.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             subject.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getProgressColor = (progress: number) => {
        if (progress === 100) return 'green';
        if (progress > 50) return 'blue';
        if (progress > 0) return 'orange';
        return 'purple';
    };

    const getSubjectTheme = (colorTheme: string) => {
        const themes: { [key: string]: string } = {
            'blue': 'theme-blue',
            'green': 'theme-green',
            'purple': 'theme-purple',
            'red': 'theme-red',
            'yellow': 'theme-yellow',
            'indigo': 'theme-indigo'
        };
        return themes[colorTheme] || 'theme-blue';
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen py-8" style={{ background: 'var(--background-primary)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-8">
                        <div className="h-8 bg-white/20 rounded w-1/3"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-64 bg-white/20 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen py-8" style={{ background: 'var(--background-primary)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="card border-red-200 bg-red-50">
                        <h2 className="text-red-800 font-semibold mb-2">Error Loading Subjects</h2>
                        <p className="text-red-600">{error}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="mt-4 btn btn-error"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8" style={{ background: 'var(--background-primary)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">📚 Subject Library</h1>
                    <p className="text-white/80">Explore subjects and master skill trees with different levels and prerequisites!</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="card">
                        <div className="flex items-center">
                            <div className="text-3xl mr-3">📖</div>
                            <div>
                                <p className="text-sm text-gray-600">Enrolled Subjects</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {subjects.filter(s => s.enrolled).length}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="card">
                        <div className="flex items-center">
                            <div className="text-3xl mr-3">🌳</div>
                            <div>
                                <p className="text-sm text-gray-600">Skill Trees</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {subjects.reduce((total, subject) => total + subject.skill_trees.length, 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="card">
                        <div className="flex items-center">
                            <div className="text-3xl mr-3">🎯</div>
                            <div>
                                <p className="text-sm text-gray-600">In Progress</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {subjects.filter(s => s.enrolled && s.progress_percentage > 0 && s.progress_percentage < 100).length}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="card">
                        <div className="flex items-center">
                            <div className="text-3xl mr-3">⭐</div>
                            <div>
                                <p className="text-sm text-gray-600">Total Points Earned</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {subjects.reduce((total, subject) => total + subject.total_points_earned, 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="card mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search subjects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setActiveFilter(category)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                        activeFilter === category
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Subjects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSubjects.map((subject) => (
                        <div key={subject.id} className="card hover:scale-105 transition-all duration-300">
                            <div className={`w-full h-32 rounded-lg mb-4 flex items-center justify-center text-6xl ${getSubjectTheme(subject.color_theme)}`}>
                                {subject.icon}
                            </div>
                            
                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{subject.title}</h3>
                                <p className="text-gray-600 text-sm mb-3">{subject.description}</p>
                                
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        subject.difficulty === 'foundation' ? 'bg-green-100 text-green-800' :
                                        subject.difficulty === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                                        'bg-purple-100 text-purple-800'
                                    }`}>
                                        {subject.difficulty.charAt(0).toUpperCase() + subject.difficulty.slice(1)}
                                    </span>
                                    <span className="text-sm text-gray-500">⏱️ {subject.estimated_duration}h</span>
                                </div>
                                
                                {subject.enrolled && (
                                    <div className="mb-3">
                                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                                            <span>Progress</span>
                                            <span>{subject.progress_percentage}%</span>
                                        </div>
                                        <ProgressBar 
                                            current={subject.progress_percentage} 
                                            total={100} 
                                            color={getProgressColor(subject.progress_percentage)}
                                        />
                                    </div>
                                )}
                                
                                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                                    <span>🌳 {subject.skill_trees.length} Skill Trees</span>
                                    <span>⭐ {subject.total_points_earned} Points</span>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                {subject.enrolled ? (
                                    <button 
                                        onClick={() => window.location.href = `/subject/${subject.id}`}
                                        className="flex-1 btn btn-primary"
                                    >
                                        Continue Learning
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => {
                                            // Enroll in subject
                                            console.log('Enrolling in subject:', subject.id);
                                        }}
                                        className="flex-1 btn btn-success"
                                    >
                                        Enroll Now
                                    </button>
                                )}
                                
                                <button 
                                    onClick={() => window.location.href = `/subject/${subject.id}`}
                                    className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    👁️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredSubjects.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-xl font-semibold text-white mb-2">No subjects found</h3>
                        <p className="text-white/70">Try adjusting your search or filter criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
} 