'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/gamification/ProgressBar';
import { useAuth } from '@/contexts/AuthContext';

interface Course {
    id: number;
    title: string;
    description: string;
    difficulty_level: 'beginner' | 'intermediate' | 'advanced';
    category: string;
    enrolled: boolean;
    progress_percentage: number;
    total_points_earned: number;
}

export default function CoursesPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const categories = ['all', 'my-courses', 'beginner', 'intermediate', 'advanced'];
    
    // Redirect to login if not authenticated
    useEffect(() => {
        // Only redirect if auth check is complete AND user is not authenticated
        if (!authLoading && !user && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, user, isAuthenticated, router]);
    
    // Fetch courses from API
    useEffect(() => {
        const fetchCourses = async () => {
            if (!user) return;
            
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    userId: user.id.toString(),
                    ...(activeFilter !== 'all' && { difficulty: activeFilter })
                });
                
                const response = await fetch(`/api/subjects?${params}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch courses');
                }
                
                const data = await response.json();
                if (data.success) {
                    setCourses(data.courses);
                } else {
                    throw new Error(data.error || 'Failed to load courses');
                }
            } catch (err) {
                console.error('Error fetching courses:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [user, activeFilter]);
    
    const filteredCourses = courses.filter(course => {
        const matchesCategory = activeFilter === 'all' || 
                              (activeFilter === 'my-courses' && course.enrolled) ||
                              course.difficulty_level === activeFilter;
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             course.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Enroll in a course
    const handleEnrollment = async (courseId: number) => {
        if (!user) return;
        
        try {
            const response = await fetch('/api/subjects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    courseId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Refresh courses data to show updated enrollment status
                const params = new URLSearchParams({
                    userId: user.id.toString(),
                    ...(activeFilter !== 'all' && { difficulty: activeFilter })
                });
                
                const refreshResponse = await fetch(`/api/subjects?${params}`);
                const refreshData = await refreshResponse.json();
                
                if (refreshData.success) {
                    setCourses(refreshData.courses);
                }
            } else {
                alert(data.error || 'Failed to enroll in course');
            }
        } catch (error) {
            console.error('Enrollment error:', error);
            alert('Failed to enroll in course');
        }
    };

    const getProgressColor = (progress: number) => {
        if (progress === 100) return 'green';
        if (progress > 50) return 'blue';
        if (progress > 0) return 'orange';
        return 'purple';
    };

    const getCourseTheme = (category: string) => {
        const themes: { [key: string]: string } = {
            'Programming': 'theme-blue',
            'Web Development': 'theme-green',
            'Database': 'theme-purple',
            'Design': 'theme-red',
            'Data Science': 'theme-yellow',
            'DevOps': 'theme-indigo'
        };
        return themes[category] || 'theme-blue';
    };

    // Loading state
    if (authLoading || loading || !user) {
        return (
            <div className="min-h-screen py-8 md:ml-64" style={{ background: 'var(--background-primary)' }}>
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
            <div className="min-h-screen py-8 md:ml-64" style={{ background: 'var(--background-primary)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="card border-red-200 bg-red-50">
                        <h2 className="text-red-800 font-semibold mb-2">Error Loading Courses</h2>
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
        <div className="min-h-screen py-8 md:ml-64" style={{ background: 'var(--background-primary)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 bg-white/80 rounded-lg p-4">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">📚 Course Library</h1>
                    <p className="text-gray-700">Welcome back, {user?.username}! Explore courses and master skill trees with different levels and prerequisites!</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <div className="card">
                        <div className="flex items-center">
                            <div className="text-3xl mr-3">📖</div>
                            <div>
                                <p className="text-sm text-gray-600">Enrolled Courses</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {courses.filter(c => c.enrolled).length}
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
                                    {courses.filter(c => c.enrolled && c.progress_percentage > 0 && c.progress_percentage < 100).length}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="card">
                        <div className="flex items-center">
                            <div className="text-3xl mr-3">✅</div>
                            <div>
                                <p className="text-sm text-gray-600">Completed Courses</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {courses.filter(c => c.enrolled && c.progress_percentage === 100).length}
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
                                    {courses.reduce((total, course) => total + course.total_points_earned, 0)}
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
                                placeholder="Search courses..."
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
                                    {category === 'my-courses' ? 'My Courses' : category.charAt(0).toUpperCase() + category.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Courses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                        <div key={course.id} className="card hover:scale-105 transition-all duration-300">
                            <div className={`w-full h-32 rounded-lg mb-4 flex items-center justify-center text-6xl ${getCourseTheme(course.category)}`}>
                                📚
                            </div>
                            
                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                                <p className="text-gray-600 text-sm mb-3">{course.description}</p>
                                
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        course.difficulty_level === 'beginner' ? 'bg-green-100 text-green-800' :
                                        course.difficulty_level === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                                        'bg-purple-100 text-purple-800'
                                    }`}>
                                        {course.difficulty_level.charAt(0).toUpperCase() + course.difficulty_level.slice(1)}
                                    </span>
                                    <span className="text-sm text-gray-500">📂 {course.category}</span>
                                </div>
                                
                                {course.enrolled && (
                                    <div className="mb-3">
                                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                                            <span>Progress</span>
                                            <span>{course.progress_percentage}%</span>
                                        </div>
                                        <ProgressBar 
                                            current={course.progress_percentage} 
                                            total={100} 
                                            color={getProgressColor(course.progress_percentage)}
                                        />
                                    </div>
                                )}
                                
                                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                                    <span>⭐ {course.total_points_earned} Points</span>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                {course.enrolled ? (
                                    <button 
                                        onClick={() => window.location.href = `/courses/${course.id}`}
                                        className="flex-1 btn btn-primary"
                                    >
                                        Continue Learning
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleEnrollment(course.id)}
                                        className="flex-1 btn btn-success"
                                    >
                                        Enroll Now
                                    </button>
                                )}
                                
                                <button 
                                    onClick={() => window.location.href = `/courses/${course.id}`}
                                    className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    👁️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredCourses.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-xl font-semibold text-white mb-2">No courses found</h3>
                        <p className="text-white/70">Try adjusting your search or filter criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
} 