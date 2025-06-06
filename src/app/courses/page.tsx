'use client';

import { useState } from 'react';
import ProgressBar from '@/components/gamification/ProgressBar';

interface Course {
    id: number;
    title: string;
    description: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: string;
    lessons: number;
    completedLessons: number;
    points: number;
    instructor: string;
    rating: number;
    enrolled: boolean;
    thumbnail: string;
    achievements?: string[];
}

const mockCourses: Course[] = [
    {
        id: 1,
        title: "React Fundamentals",
        description: "Learn the basics of React including components, props, state, and hooks. Perfect for beginners looking to build modern web applications.",
        category: "Web Development",
        difficulty: "beginner",
        duration: "6 hours",
        lessons: 20,
        completedLessons: 17,
        points: 250,
        instructor: "Sarah Johnson",
        rating: 4.8,
        enrolled: true,
        thumbnail: "📚",
        achievements: ["First Steps", "Quick Learner"]
    },
    {
        id: 2,
        title: "JavaScript Advanced Concepts",
        description: "Master advanced JavaScript concepts including closures, prototypes, async/await, and design patterns.",
        category: "Programming",
        difficulty: "intermediate",
        duration: "8 hours",
        lessons: 15,
        completedLessons: 9,
        points: 350,
        instructor: "Mike Chen",
        rating: 4.9,
        enrolled: true,
        thumbnail: "⚡",
        achievements: ["Code Master"]
    },
    {
        id: 3,
        title: "TypeScript Complete Guide",
        description: "Learn TypeScript from scratch to advanced topics. Build type-safe applications with confidence.",
        category: "Programming",
        difficulty: "intermediate",
        duration: "10 hours",
        lessons: 12,
        completedLessons: 12,
        points: 400,
        instructor: "Emily Davis",
        rating: 4.7,
        enrolled: true,
        thumbnail: "🔷",
        achievements: ["Type Master", "Completion Champion"]
    },
    {
        id: 4,
        title: "Node.js Backend Development",
        description: "Build scalable backend applications with Node.js, Express, and databases.",
        category: "Backend",
        difficulty: "advanced",
        duration: "12 hours",
        lessons: 18,
        completedLessons: 0,
        points: 500,
        instructor: "David Rodriguez",
        rating: 4.6,
        enrolled: false,
        thumbnail: "🟢",
        achievements: []
    },
    {
        id: 5,
        title: "Python for Data Science",
        description: "Explore data analysis and visualization using Python, Pandas, and Matplotlib.",
        category: "Data Science",
        difficulty: "beginner",
        duration: "7 hours",
        lessons: 16,
        completedLessons: 0,
        points: 300,
        instructor: "Lisa Wang",
        rating: 4.5,
        enrolled: false,
        thumbnail: "🐍",
        achievements: []
    },
    {
        id: 6,
        title: "UI/UX Design Principles",
        description: "Learn the fundamentals of user interface and user experience design.",
        category: "Design",
        difficulty: "beginner",
        duration: "5 hours",
        lessons: 14,
        completedLessons: 0,
        points: 200,
        instructor: "Alex Turner",
        rating: 4.4,
        enrolled: false,
        thumbnail: "🎨",
        achievements: []
    }
];

export default function CoursesPage() {
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const categories = ['all', 'Web Development', 'Programming', 'Backend', 'Data Science', 'Design'];
    
    const filteredCourses = mockCourses.filter(course => {
        const matchesCategory = activeFilter === 'all' || course.category === activeFilter;
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             course.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return 'bg-green-100 text-green-800';
            case 'intermediate': return 'bg-yellow-100 text-yellow-800';
            case 'advanced': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getProgressColor = (progress: number) => {
        if (progress === 100) return 'green';
        if (progress > 50) return 'blue';
        if (progress > 0) return 'orange';
        return 'gray';
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">📚 Course Library</h1>
                    <p className="text-gray-600">Discover courses and earn points, achievements, and climb the leaderboard!</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <div className="text-3xl mr-3">📖</div>
                            <div>
                                <p className="text-sm text-gray-600">Enrolled Courses</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {mockCourses.filter(c => c.enrolled).length}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <div className="text-3xl mr-3">✅</div>
                            <div>
                                <p className="text-sm text-gray-600">Completed</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {mockCourses.filter(c => c.completedLessons === c.lessons).length}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <div className="text-3xl mr-3">🎯</div>
                            <div>
                                <p className="text-sm text-gray-600">In Progress</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {mockCourses.filter(c => c.enrolled && c.completedLessons < c.lessons && c.completedLessons > 0).length}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <div className="text-3xl mr-3">⭐</div>
                            <div>
                                <p className="text-sm text-gray-600">Total Points Available</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {mockCourses.reduce((total, course) => total + course.points, 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
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
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setActiveFilter(category)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        activeFilter === category
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Courses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => {
                        const progress = (course.completedLessons / course.lessons) * 100;
                        
                        return (
                            <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                {/* Course Header */}
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="text-4xl">{course.thumbnail}</div>
                                        <div className="flex flex-col items-end space-y-2">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(course.difficulty)}`}>
                                                {course.difficulty}
                                            </span>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <span className="mr-1">⭐</span>
                                                <span>{course.rating}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                                    <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                                    
                                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-4">
                                        <span>👨‍🏫 {course.instructor}</span>
                                        <span>⏱️ {course.duration}</span>
                                        <span>📑 {course.lessons} lessons</span>
                                        <span>⭐ {course.points} points</span>
                                    </div>

                                    {/* Progress Bar for Enrolled Courses */}
                                    {course.enrolled && (
                                        <div className="mb-4">
                                            <ProgressBar
                                                current={course.completedLessons}
                                                total={course.lessons}
                                                label="Progress"
                                                color={getProgressColor(progress) as 'blue' | 'green' | 'purple' | 'orange'}
                                            />
                                        </div>
                                    )}

                                    {/* Achievements */}
                                    {course.achievements && course.achievements.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-xs text-gray-500 mb-2">Achievements Earned:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {course.achievements.map((achievement, index) => (
                                                    <span key={index} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                                        🏆 {achievement}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <button 
                                        onClick={() => {
                                            if (course.enrolled) {
                                                // Navigate to skill tree
                                                window.location.href = `/subject/${course.id}`;
                                            } else {
                                                // Enroll in course (in real app, this would make an API call)
                                                alert(`Enrolling in ${course.title}!\n\nYou would now have access to the skill tree.`);
                                            }
                                        }}
                                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                                        course.enrolled
                                            ? progress === 100
                                                ? 'bg-green-500 text-white hover:bg-green-600'
                                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                            : 'bg-gray-900 text-white hover:bg-gray-800'
                                    }`}>
                                        {course.enrolled 
                                            ? progress === 100 
                                                ? '🎉 View Certificate'
                                                : '📖 Continue Learning'
                                            : '🚀 Enroll Now'
                                        }
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredCourses.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
                        <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
} 