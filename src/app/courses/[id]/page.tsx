'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaClock, FaUsers, FaPlay, FaLock, FaCheck, FaTrophy } from 'react-icons/fa';
import toast from 'react-hot-toast';

// Mock user context for now - memoized to prevent re-renders
const useUser = () => {
    return useMemo(() => ({ 
        user: { id: 1, username: 'student' } 
    }), []);
};

interface Course {
    id: number;
    title: string;
    description: string;
    difficulty_level: string;
    category: string;
    creator_name: string;
    enrolled_count: number;
}

interface Topic {
    id: number;
    title: string;
    content: string;
    lesson_order: number;
    points_reward: number;
    duration_minutes: number;
    is_completed: boolean;
}

interface UserProgress {
    total_lessons: number;
    completed_lessons: number;
}

interface CourseData {
    course: Course;
    isEnrolled: boolean;
    userProgress: UserProgress | null;
    topics: Topic[];
    topicProgress: { [topicId: number]: boolean };
    success?: boolean;
}

interface SkillTreeNode {
    id: number;
    title: string;
    lesson_order: number;
    points_reward: number;
    duration_minutes: number;
    is_completed: boolean;
    is_unlocked: boolean;
}

interface SkillTreeLevel {
    level: number;
    nodes: SkillTreeNode[];
}

export default function CoursePage() {
    const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const courseId = params.id as string;

    const [courseData, setCourseData] = useState<CourseData | null>(null);
    const [skillTree, setSkillTree] = useState<SkillTreeLevel[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);

    useEffect(() => {
        if (courseId && user?.id) {
            fetchCourseData();
        }
    }, [courseId, user?.id]); // Only depend on user.id, not the entire user object

    const fetchCourseData = async () => {
        try {
            const response = await fetch(`/api/courses/${courseId}?userId=${user?.id}`);
            if (response.ok) {
                const data = await response.json();
                setCourseData(data);
                
                if (data.success) {
                    // Build skill tree from topics
                    const tree = buildVerticalSkillTree(data.topics, data.topicProgress || {});
                    setSkillTree(tree);
                }
            } else {
                toast.error('Course not found');
                router.push('/courses');
            }
        } catch (error) {
            console.error('Error fetching course:', error);
            toast.error('Error loading course');
        } finally {
            setLoading(false);
        }
    };

    const buildVerticalSkillTree = (topics: Topic[], topicProgress: { [topicId: number]: boolean }): SkillTreeLevel[] => {
        if (!topics || topics.length === 0) return [];

        // Sort topics by lesson order
        const sortedTopics = [...topics].sort((a, b) => a.lesson_order - b.lesson_order);

        // Convert topics to skill tree nodes with prerequisite logic
        const nodes: SkillTreeNode[] = sortedTopics.map((topic, index) => {
            const isCompleted = topicProgress[topic.id] || false;
            
            // First topic is always unlocked, others require previous topic completion
            let isUnlocked = index === 0;
            if (index > 0) {
                const previousTopic = sortedTopics[index - 1];
                isUnlocked = topicProgress[previousTopic.id] || false;
            }

            return {
                id: topic.id,
                title: topic.title,
                lesson_order: topic.lesson_order,
                points_reward: topic.points_reward,
                duration_minutes: topic.duration_minutes,
                is_completed: isCompleted,
                is_unlocked: isUnlocked
            };
        });

        // Group nodes into levels with 1 node per level
        const levels: SkillTreeLevel[] = nodes.map((node, index) => ({
            level: index,
            nodes: [node] // Only 1 node per level
        }));

        return levels;
    };

    const handleEnroll = async () => {
        if (!user) {
            toast.error('Please log in to enroll');
            router.push('/login');
            return;
        }

        setEnrolling(true);
        try {
            const response = await fetch(`/api/courses/${courseId}?userId=${user.id}`, {
                method: 'POST',
            });

            if (response.ok) {
                toast.success('Successfully enrolled!');
                fetchCourseData();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to enroll');
            }
        } catch (error) {
            console.error('Error enrolling:', error);
            toast.error('Error enrolling in course');
        } finally {
            setEnrolling(false);
        }
    };

    const handleTopicClick = (node: SkillTreeNode) => {
        if (!node.is_unlocked && !node.is_completed) {
            toast.error('Complete previous topics to unlock this one');
            return;
        }
        
        if (!courseData?.isEnrolled) {
            toast.error('Please enroll in the course first');
            return;
        }

        // Navigate to topic content page
        router.push(`/courses/${courseId}/topics/${node.id}`);
    };

    const renderSkillNode = (node: SkillTreeNode): React.ReactNode => {
        const nodeClasses = `
            relative p-4 rounded-xl border-3 cursor-pointer transition-all duration-300 w-64 text-center shadow-lg hover:shadow-xl transform hover:scale-105
            ${node.is_completed 
                ? 'bg-gradient-to-br from-green-100 to-green-200 border-green-500 text-green-800 shadow-green-200' 
                : node.is_unlocked
                ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-500 text-blue-800 hover:from-blue-200 hover:to-blue-300 shadow-blue-200'
                : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-400 text-gray-500 cursor-not-allowed shadow-gray-200'
            }
        `;

        return (
            <div key={node.id} className="flex flex-col items-center">
                <div
                    className={nodeClasses}
                    onClick={() => handleTopicClick(node)}
                >
                    <div className="flex items-center justify-center mb-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            node.is_completed 
                                ? 'bg-green-500 text-white' 
                                : node.is_unlocked
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-400 text-gray-200'
                        }`}>
                            {node.is_completed ? (
                                <FaCheck className="h-5 w-5" />
                            ) : node.is_unlocked ? (
                                <FaPlay className="h-5 w-5" />
                            ) : (
                                <FaLock className="h-5 w-5" />
                            )}
                        </div>
                    </div>
                    
                    <h4 className="font-bold text-sm mb-2 leading-tight">{node.title}</h4>
                    
                    <div className="flex items-center justify-center gap-3 text-xs mb-2">
                        <div className="flex items-center gap-1">
                            <FaTrophy className="h-3 w-3" />
                            <span>{node.points_reward} XP</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <FaClock className="h-3 w-3" />
                            <span>{node.duration_minutes}m</span>
                        </div>
                    </div>
                    
                    <div className={`text-xs px-2 py-1 rounded-full ${
                        node.is_completed 
                            ? 'bg-green-500 text-white' 
                            : node.is_unlocked
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-400 text-gray-200'
                    }`}>
                        {node.is_completed ? 'Completed' : node.is_unlocked ? 'Available' : 'Locked'}
                    </div>
                </div>
            </div>
        );
    };

    const renderSkillTree = (): React.ReactNode => {
        if (!skillTree || skillTree.length === 0) {
            return (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No topics available yet</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center space-y-8 py-8">
                {skillTree.map((level, levelIndex) => (
                    <div key={level.level} className="flex flex-col items-center">
                        {/* Level nodes */}
                        <div className="flex justify-center items-center gap-8 flex-wrap">
                            {level.nodes.map((node) => renderSkillNode(node))}
                        </div>
                        
                        {/* Connection line to next level */}
                        {levelIndex < skillTree.length - 1 && (
                            <div className="mt-6 mb-2">
                                <div className="w-px h-8 bg-gray-300 mx-auto"></div>
                                <div className="flex justify-center">
                                    <FaUsers className="h-4 w-4 text-gray-400 bg-white px-1" />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg font-medium text-gray-600">Loading course...</p>
                </div>
            </div>
        );
    }

    if (!courseData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Course Not Found</h2>
                    <button
                        onClick={() => router.push('/courses')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Back to Courses
                    </button>
                </div>
            </div>
        );
    }

    const { course, isEnrolled, userProgress } = courseData;
    const progressPercentage = userProgress 
        ? (userProgress.completed_lessons / userProgress.total_lessons) * 100 
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-lg border-b">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <button
                        onClick={() => router.push('/courses')}
                        className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2 font-medium transition-colors"
                    >
                        ← Back to Courses
                    </button>
                    
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                            <p className="text-lg text-gray-600 mb-4">{course.description}</p>
                            
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <FaUsers className="h-4 w-4" />
                                    <span>{course.enrolled_count} enrolled</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaClock className="h-4 w-4" />
                                    <span>Self-paced</span>
                                </div>
                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                    {course.difficulty_level}
                                </span>
                            </div>
                        </div>
                        
                        {!isEnrolled ? (
                            <button
                                onClick={handleEnroll}
                                disabled={enrolling || !user}
                                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
                            >
                                {enrolling ? 'Enrolling...' : 'Enroll Now'}
                            </button>
                        ) : (
                            <div className="text-right bg-green-50 p-4 rounded-lg border border-green-200">
                                <div className="text-sm text-green-600 mb-1">Your Progress</div>
                                <div className="text-2xl font-bold text-green-700">
                                    {progressPercentage.toFixed(1)}%
                                </div>
                                <div className="w-32 bg-green-200 rounded-full h-2 mt-2">
                                    <div 
                                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${progressPercentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                {!isEnrolled ? (
                    <div className="text-center py-16">
                        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
                            <FaLock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Enroll to Access Skill Tree</h3>
                            <p className="text-gray-600 mb-6">Join this course to unlock the interactive skill tree and start your learning journey!</p>
                            <button
                                onClick={handleEnroll}
                                disabled={enrolling || !user}
                                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {enrolling ? 'Enrolling...' : 'Enroll Now'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">🌳 Skill Tree</h2>
                            <p className="text-gray-600">Complete topics to unlock new challenges. Click on available topics to start learning!</p>
                        </div>
                        
                        {renderSkillTree()}
                    </div>
                )}
            </div>
        </div>
    );
} 