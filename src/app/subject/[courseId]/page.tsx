'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SkillTree, { SkillNode } from '@/components/gamification/SkillTree';

// Mock data for different course skill trees
const courseSkillTrees: Record<string, { title: string; nodes: SkillNode[] }> = {
    '1': { // React Fundamentals
        title: "React Fundamentals",
        nodes: [
            {
                id: 'react-1',
                title: 'What is React?',
                description: 'Introduction to React library and its core concepts',
                level: 1,
                position: { x: 50, y: 50 },
                prerequisites: [],
                completed: true,
                locked: false,
                points: 10,
                difficulty: 'foundation',
                estimatedTime: '30 min',
                type: 'lesson'
            },
            {
                id: 'react-2',
                title: 'JSX Basics',
                description: 'Learn JSX syntax and how to write HTML-like code in JavaScript',
                level: 1,
                position: { x: 250, y: 50 },
                prerequisites: ['react-1'],
                completed: true,
                locked: false,
                points: 15,
                difficulty: 'foundation',
                estimatedTime: '45 min',
                type: 'lesson'
            },
            {
                id: 'react-3',
                title: 'Components',
                description: 'Understanding functional and class components',
                level: 2,
                position: { x: 150, y: 180 },
                prerequisites: ['react-2'],
                completed: true,
                locked: false,
                points: 20,
                difficulty: 'foundation',
                estimatedTime: '1 hour',
                type: 'lesson'
            },
            {
                id: 'react-4',
                title: 'Props',
                description: 'Passing data between components using props',
                level: 2,
                position: { x: 350, y: 180 },
                prerequisites: ['react-3'],
                completed: true,
                locked: false,
                points: 20,
                difficulty: 'foundation',
                estimatedTime: '45 min',
                type: 'lesson'
            },
            {
                id: 'react-quiz-1',
                title: 'Foundation Quiz',
                description: 'Test your knowledge of React basics',
                level: 2,
                position: { x: 550, y: 180 },
                prerequisites: ['react-4'],
                completed: true,
                locked: false,
                points: 25,
                difficulty: 'foundation',
                estimatedTime: '20 min',
                type: 'quiz'
            },
            {
                id: 'react-5',
                title: 'State Management',
                description: 'Managing component state with useState hook',
                level: 3,
                position: { x: 100, y: 320 },
                prerequisites: ['react-quiz-1'],
                completed: false,
                locked: false,
                points: 30,
                difficulty: 'intermediate',
                estimatedTime: '1.5 hours',
                type: 'lesson'
            },
            {
                id: 'react-6',
                title: 'Event Handling',
                description: 'Handling user interactions and events',
                level: 3,
                position: { x: 300, y: 320 },
                prerequisites: ['react-5'],
                completed: false,
                locked: false,
                points: 25,
                difficulty: 'intermediate',
                estimatedTime: '1 hour',
                type: 'lesson'
            },
            {
                id: 'react-7',
                title: 'useEffect Hook',
                description: 'Side effects and lifecycle management',
                level: 3,
                position: { x: 500, y: 320 },
                prerequisites: ['react-6'],
                completed: false,
                locked: true,
                points: 35,
                difficulty: 'intermediate',
                estimatedTime: '2 hours',
                type: 'lesson'
            },
            {
                id: 'react-project-1',
                title: 'Todo App Project',
                description: 'Build a complete todo application',
                level: 4,
                position: { x: 200, y: 460 },
                prerequisites: ['react-7'],
                completed: false,
                locked: true,
                points: 50,
                difficulty: 'intermediate',
                estimatedTime: '3 hours',
                type: 'project'
            },
            {
                id: 'react-8',
                title: 'Context API',
                description: 'Global state management with Context',
                level: 4,
                position: { x: 50, y: 600 },
                prerequisites: ['react-project-1'],
                completed: false,
                locked: true,
                points: 40,
                difficulty: 'advanced',
                estimatedTime: '2 hours',
                type: 'lesson'
            },
            {
                id: 'react-9',
                title: 'Custom Hooks',
                description: 'Creating reusable custom hooks',
                level: 4,
                position: { x: 300, y: 600 },
                prerequisites: ['react-8'],
                completed: false,
                locked: true,
                points: 45,
                difficulty: 'advanced',
                estimatedTime: '2.5 hours',
                type: 'lesson'
            },
            {
                id: 'react-final',
                title: 'Final Project',
                description: 'Build a complete React application',
                level: 5,
                position: { x: 175, y: 740 },
                prerequisites: ['react-9'],
                completed: false,
                locked: true,
                points: 100,
                difficulty: 'advanced',
                estimatedTime: '5 hours',
                type: 'project'
            }
        ]
    },
    '2': { // JavaScript Advanced
        title: "JavaScript Advanced Concepts",
        nodes: [
            {
                id: 'js-1',
                title: 'Closures',
                description: 'Understanding closures and lexical scope',
                level: 1,
                position: { x: 50, y: 50 },
                prerequisites: [],
                completed: true,
                locked: false,
                points: 25,
                difficulty: 'foundation',
                estimatedTime: '1 hour',
                type: 'lesson'
            },
            {
                id: 'js-2',
                title: 'Prototypes',
                description: 'Prototype chain and inheritance in JavaScript',
                level: 1,
                position: { x: 250, y: 50 },
                prerequisites: ['js-1'],
                completed: true,
                locked: false,
                points: 30,
                difficulty: 'foundation',
                estimatedTime: '1.5 hours',
                type: 'lesson'
            },
            {
                id: 'js-3',
                title: 'Async/Await',
                description: 'Asynchronous programming with async/await',
                level: 2,
                position: { x: 150, y: 180 },
                prerequisites: ['js-2'],
                completed: true,
                locked: false,
                points: 35,
                difficulty: 'intermediate',
                estimatedTime: '2 hours',
                type: 'lesson'
            },
            {
                id: 'js-4',
                title: 'Promises',
                description: 'Working with Promises and chaining',
                level: 2,
                position: { x: 350, y: 180 },
                prerequisites: ['js-3'],
                completed: false,
                locked: false,
                points: 30,
                difficulty: 'intermediate',
                estimatedTime: '1.5 hours',
                type: 'lesson'
            },
            {
                id: 'js-5',
                title: 'Design Patterns',
                description: 'Common JavaScript design patterns',
                level: 3,
                position: { x: 250, y: 320 },
                prerequisites: ['js-4'],
                completed: false,
                locked: true,
                points: 40,
                difficulty: 'advanced',
                estimatedTime: '2.5 hours',
                type: 'lesson'
            }
        ]
    },
    '3': { // TypeScript Complete Guide
        title: "TypeScript Complete Guide",
        nodes: [
            {
                id: 'ts-1',
                title: 'TypeScript Basics',
                description: 'Introduction to TypeScript and type annotations',
                level: 1,
                position: { x: 50, y: 50 },
                prerequisites: [],
                completed: true,
                locked: false,
                points: 20,
                difficulty: 'foundation',
                estimatedTime: '45 min',
                type: 'lesson'
            },
            {
                id: 'ts-2',
                title: 'Interfaces',
                description: 'Defining contracts with interfaces',
                level: 2,
                position: { x: 150, y: 180 },
                prerequisites: ['ts-1'],
                completed: true,
                locked: false,
                points: 25,
                difficulty: 'foundation',
                estimatedTime: '1 hour',
                type: 'lesson'
            },
            {
                id: 'ts-3',
                title: 'Generics',
                description: 'Creating reusable components with generics',
                level: 3,
                position: { x: 250, y: 320 },
                prerequisites: ['ts-2'],
                completed: true,
                locked: false,
                points: 35,
                difficulty: 'intermediate',
                estimatedTime: '2 hours',
                type: 'lesson'
            },
            {
                id: 'ts-final',
                title: 'TypeScript Project',
                description: 'Build a fully typed application',
                level: 4,
                position: { x: 350, y: 460 },
                prerequisites: ['ts-3'],
                completed: true,
                locked: false,
                points: 50,
                difficulty: 'advanced',
                estimatedTime: '3 hours',
                type: 'project'
            }
        ]
    }
};

export default function SubjectPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseId as string;
    
    const [courseData, setCourseData] = useState<{ title: string; nodes: SkillNode[] } | null>(null);

    useEffect(() => {
        const data = courseSkillTrees[courseId];
        if (data) {
            setCourseData(data);
        }
    }, [courseId]);

    const handleNodeClick = (node: SkillNode) => {
        if (node.locked) return;
        
        // Here you would typically navigate to the specific lesson/quiz/project
        console.log(`Starting: ${node.title}`);
        
        // For quiz nodes, navigate to quiz with node-specific parameters
        if (node.type === 'quiz') {
            const quizUrl = `/quiz?courseId=${courseId}&nodeId=${node.id}&nodeName=${encodeURIComponent(node.title)}`;
            router.push(quizUrl);
        } else {
            alert(`Starting: ${node.title}\n\nThis would normally take you to the ${node.type} content.`);
        }
    };

    if (!courseData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">📚</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h2>
                    <p className="text-gray-600 mb-4">The course you&apos;re looking for doesn&apos;t exist.</p>
                    <button 
                        onClick={() => router.push('/courses')}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Back to Courses
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/courses')}
                        className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
                    >
                        ← Back to Courses
                    </button>
                </div>

                {/* Skill Tree */}
                <SkillTree
                    nodes={courseData.nodes}
                    onNodeClick={handleNodeClick}
                    courseTitle={courseData.title}
                />

                {/* Quick Actions */}
                <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => {
                                const nextAvailable = courseData.nodes.find(node => !node.completed && !node.locked);
                                if (nextAvailable) {
                                    handleNodeClick(nextAvailable);
                                }
                            }}
                            className="flex items-center justify-center space-x-2 bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            <span>🚀</span>
                            <span>Continue Learning</span>
                        </button>
                        
                        <button
                            onClick={() => {
                                // Find the next available quiz node
                                const availableQuizNode = courseData.nodes.find(node => 
                                    node.type === 'quiz' && !node.locked
                                );
                                
                                if (availableQuizNode) {
                                    const quizUrl = `/quiz?courseId=${courseId}&nodeId=${availableQuizNode.id}&nodeName=${encodeURIComponent(availableQuizNode.title)}`;
                                    router.push(quizUrl);
                                } else {
                                    // Default course quiz if no specific quiz node available
                                    const quizUrl = `/quiz?courseId=${courseId}&nodeId=general&nodeName=${encodeURIComponent(courseData.title + ' - General Quiz')}`;
                                    router.push(quizUrl);
                                }
                            }}
                            className="flex items-center justify-center space-x-2 bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors"
                        >
                            <span>🎯</span>
                            <span>Take Quiz</span>
                        </button>
                        
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center justify-center space-x-2 bg-purple-500 text-white p-3 rounded-lg hover:bg-purple-600 transition-colors"
                        >
                            <span>📊</span>
                            <span>View Progress</span>
                        </button>
                    </div>
                </div>

                {/* Learning Tips */}
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border-l-4 border-blue-500">
                    <h4 className="font-semibold text-gray-800 mb-2">💡 Learning Tips</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Complete topics in order to unlock advanced concepts</li>
                        <li>• Earn more points by completing quizzes and projects</li>
                        <li>• Review completed topics anytime to reinforce your learning</li>
                        <li>• Each completed node brings you closer to mastering the course!</li>
                    </ul>
                </div>
            </div>
        </div>
    );
} 