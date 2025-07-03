'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface SkillNode {
    id: string;
    name: string;
    description: string;
    level: number;
    x: number;
    y: number;
    unlocked: boolean;
    completed: boolean;
    requirements: string[];
    icon: string;
    type: 'lesson' | 'quiz' | 'project';
    estimated_time: string;
    points: number;
    content_url?: string;
}

interface Connection {
    from: string;
    to: string;
}

interface SubjectData {
    id: number;
    title: string;
    description: string;
    difficulty: string;
    icon: string;
    color_theme: string;
}

export default function SubjectSkillTreePage() {
    const params = useParams();
    const subjectId = params.subjectId as string;
    
    const [subject, setSubject] = useState<SubjectData | null>(null);
    const [nodes, setNodes] = useState<SkillNode[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
    const [showContent, setShowContent] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubject = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/subjects/${subjectId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch subject nodes');
                }
                const data = await response.json();
                if (data.success) {
                    setSubject(data.subject);
                    setNodes(data.nodes);
                } else {
                    throw new Error(data.error || 'Failed to load subject nodes');
                }
            } catch (err) {
                console.error('Error fetching subject nodes:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
                // setSampleData();
            } finally {
                setLoading(false);
            }
        };
        if (subjectId) {
            fetchSubject();
        }
    }, [subjectId]);

    // Generate connections from node requirements
    useEffect(() => {
        if (nodes.length > 0) {
            const newConnections = nodes.flatMap(node =>
                (node.requirements || []).map((reqId: string) => ({
                    from: reqId,
                    to: node.id
                }))
            );
            setConnections(newConnections);
        } else {
            setConnections([]);
        }
    }, [nodes]);

    // const setSampleData = () => {
    //     setSubject({
    //         id: parseInt(subjectId),
    //         title: 'Web Development',
    //         description: 'Master modern web development with HTML, CSS, JavaScript, and React',
    //         difficulty: 'foundation',
    //         icon: '🌐',
    //         color_theme: 'blue'
    //     });
        
    //     setNodes([
    //         // Level 1 - Foundation
    //         {
    //             id: 'html-basics',
    //             name: 'HTML Structure',
    //             description: 'Learn basic HTML tags and document structure',
    //             level: 1,
    //             x: 50,
    //             y: 10,
    //             unlocked: true,
    //             completed: true,
    //             requirements: [],
    //             icon: '📄',
    //             type: 'lesson',
    //             estimated_time: '30 min',
    //             points: 50,
    //             content_url: '/content/html-basics'
    //         },
    //         {
    //             id: 'css-basics',
    //             name: 'CSS Styling',
    //             description: 'Master CSS selectors and basic styling',
    //             level: 1,
    //             x: 25,
    //             y: 35,
    //             unlocked: true,
    //             completed: true,
    //             requirements: ['html-basics'],
    //             icon: '🎨',
    //             type: 'lesson',
    //             estimated_time: '45 min',
    //             points: 50,
    //             content_url: '/content/css-basics'
    //         },
    //         {
    //             id: 'css-layout',
    //             name: 'CSS Layout',
    //             description: 'Learn flexbox and grid layouts',
    //             level: 1,
    //             x: 75,
    //             y: 35,
    //             unlocked: true,
    //             completed: false,
    //             requirements: ['css-basics'],
    //             icon: '📐',
    //             type: 'lesson',
    //             estimated_time: '60 min',
    //             points: 50,
    //             content_url: '/content/css-layout'
    //         },
            
    //         // Level 2 - Intermediate
    //         {
    //             id: 'responsive-design',
    //             name: 'Responsive Design',
    //             description: 'Create mobile-friendly websites',
    //             level: 2,
    //             x: 50,
    //             y: 60,
    //             unlocked: false,
    //             completed: false,
    //             requirements: ['css-layout'],
    //             icon: '📱',
    //             type: 'lesson',
    //             estimated_time: '90 min',
    //             points: 75,
    //             content_url: '/content/responsive-design'
    //         },
    //         {
    //             id: 'css-animations',
    //             name: 'CSS Animations',
    //             description: 'Add smooth animations and transitions',
    //             level: 2,
    //             x: 15,
    //             y: 60,
    //             unlocked: false,
    //             completed: false,
    //             requirements: ['css-basics'],
    //             icon: '✨',
    //             type: 'lesson',
    //             estimated_time: '75 min',
    //             points: 75,
    //             content_url: '/content/css-animations'
    //         },
            
    //         // Level 3 - Advanced
    //         {
    //             id: 'css-architecture',
    //             name: 'CSS Architecture',
    //             description: 'Organize CSS with BEM and CSS modules',
    //             level: 3,
    //             x: 50,
    //             y: 85,
    //             unlocked: false,
    //             completed: false,
    //             requirements: ['responsive-design', 'css-animations'],
    //             icon: '🏗️',
    //             type: 'project',
    //             estimated_time: '120 min',
    //             points: 100,
    //             content_url: '/content/css-architecture'
    //         }
    //     ]);

    //     setConnections([
    //         { from: 'html-basics', to: 'css-basics' },
    //         { from: 'css-basics', to: 'css-layout' },
    //         { from: 'css-layout', to: 'responsive-design' },
    //         { from: 'css-basics', to: 'css-animations' },
    //         { from: 'responsive-design', to: 'css-architecture' },
    //         { from: 'css-animations', to: 'css-architecture' }
    //     ]);
    // };

    const canUnlock = (node: SkillNode): boolean => {
        if (node.unlocked) return false;
        return node.requirements.every(reqId => 
            nodes.find(n => n.id === reqId)?.completed || false
        );
    };

    const unlockNode = (nodeId: string) => {
        setNodes(prev => prev.map(node => 
            node.id === nodeId ? { ...node, unlocked: true } : node
        ));
    };

    const getConnectionPath = (from: SkillNode, to: SkillNode): string => {
        const x1 = from.x;
        const y1 = from.y;
        const x2 = to.x;
        const y2 = to.y;
        
        const midY = (y1 + y2) / 2;
        return `M ${x1} ${y1} Q ${x1} ${midY} ${(x1 + x2) / 2} ${midY} Q ${x2} ${midY} ${x2} ${y2}`;
    };

    const isConnectionUnlocked = (connection: Connection): boolean => {
        const fromNode = nodes.find(n => n.id === connection.from);
        return fromNode?.completed || false;
    };

    const getLevelColor = (level: number): string => {
        switch (level) {
            case 1: return 'from-green-400 to-green-600';
            case 2: return 'from-blue-400 to-blue-600';
            case 3: return 'from-purple-400 to-purple-600';
            case 4: return 'from-orange-400 to-orange-600';
            case 5: return 'from-red-400 to-red-600';
            default: return 'from-gray-400 to-gray-600';
        }
    };

    const getLevelName = (level: number): string => {
        switch (level) {
            case 1: return 'Foundation';
            case 2: return 'Intermediate';
            case 3: return 'Advanced';
            case 4: return 'Expert';
            case 5: return 'Mastery';
            default: return 'Unknown';
        }
    };

    const handleNodeClick = (node: SkillNode) => {
        if (node.unlocked || canUnlock(node)) {
            if (canUnlock(node)) {
                unlockNode(node.id);
            }
            setSelectedNode(node);
            setShowContent(true);
        }
    };

    const getSubjectTheme = (colorTheme: string) => {
        const themes: { [key: string]: string } = {
            'blue': 'from-blue-500 to-cyan-500',
            'green': 'from-green-500 to-emerald-500',
            'purple': 'from-purple-500 to-pink-500',
            'red': 'from-red-500 to-orange-500',
            'yellow': 'from-yellow-500 to-orange-500',
            'indigo': 'from-indigo-500 to-purple-500'
        };
        return themes[colorTheme] || 'from-gray-500 to-gray-600';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl">Loading skill tree...</div>
            </div>
        );
    }

    if (error || !subject) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Skill Tree</h2>
                    <p className="text-gray-600">{error || 'Skill tree not found'}</p>
                </div>
            </div>
        );
    }

    if (showContent && selectedNode) {
        return (
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className={`bg-gradient-to-r ${getSubjectTheme(subject.color_theme)} text-white p-6`}>
                    <div className="max-w-7xl mx-auto">
                        <button
                            onClick={() => setShowContent(false)}
                            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-4"
                        >
                            ← Back to Skill Tree
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="text-4xl">{selectedNode.icon}</div>
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{selectedNode.name}</h1>
                                <p className="text-xl opacity-90">{selectedNode.description}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto p-6">
                    <div className="bg-white rounded-lg shadow-md p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-2">Level</h3>
                                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getLevelColor(selectedNode.level)} text-white`}>
                                    {getLevelName(selectedNode.level)}
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-2">Type</h3>
                                <div className="capitalize text-gray-700">{selectedNode.type}</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-2">Duration</h3>
                                <div className="text-gray-700">{selectedNode.estimated_time}</div>
                            </div>
                        </div>

                        {/* Content Placeholder */}
                        <div className="prose max-w-none">
                            <h2>Content for {selectedNode.name}</h2>
                            <p>This is where the actual lesson content would be displayed. It could include:</p>
                            <ul>
                                <li>Video tutorials</li>
                                <li>Interactive code examples</li>
                                <li>Reading materials</li>
                                <li>Practice exercises</li>
                                <li>Quizzes and assessments</li>
                            </ul>
                            <p>For this demo, we are showing a placeholder. In a real application, this would be populated with actual educational content.</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex gap-4">
                            <button className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors">
                                Mark as Complete
                            </button>
                            <button className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors">
                                Take Quiz
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
            {/* Header */}
            <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{subject.icon}</span>
                    <div>
                        <h2 className="text-xl font-bold text-white">{subject.title}</h2>
                    </div>
                </div>
            </div>
            
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
            </div>
            
            {/* SVG for connections */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                <defs>
                    <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge> 
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                
                {connections.map((connection, index) => {
                    const fromNode = nodes.find(n => n.id === connection.from);
                    const toNode = nodes.find(n => n.id === connection.to);
                    
                    if (!fromNode || !toNode) return null;
                    
                    const isUnlocked = isConnectionUnlocked(connection);
                    
                    return (
                        <path
                            key={index}
                            d={getConnectionPath(fromNode, toNode)}
                            stroke={isUnlocked ? "url(#connectionGradient)" : "#374151"}
                            strokeWidth="3"
                            fill="none"
                            className={isUnlocked ? "animate-pulse" : ""}
                            filter={isUnlocked ? "url(#glow)" : "none"}
                            opacity={isUnlocked ? 0.8 : 0.3}
                        />
                    );
                })}
            </svg>

            {/* Skill nodes */}
            <div className="relative w-full h-full" style={{ zIndex: 2 }}>
                {nodes.map((node) => (
                    <div
                        key={node.id}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                            node.completed 
                                ? 'hover:scale-110' 
                                : node.unlocked || canUnlock(node)
                                    ? 'hover:scale-105 animate-bounce' 
                                    : 'opacity-50'
                        }`}
                        style={{
                            left: `${node.x}%`,
                            top: `${node.y}%`,
                        }}
                        onClick={() => handleNodeClick(node)}
                    >
                        {/* Skill node */}
                        <div className={`
                            w-20 h-20 rounded-full flex items-center justify-center text-2xl relative
                            ${node.completed 
                                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/50' 
                                : node.unlocked 
                                    ? 'bg-gradient-to-br from-green-400 to-blue-500 shadow-lg shadow-green-500/50'
                                    : canUnlock(node)
                                        ? 'bg-gradient-to-br from-blue-400 to-purple-500 shadow-lg shadow-blue-500/50'
                                        : 'bg-gradient-to-br from-gray-600 to-gray-800 shadow-lg shadow-gray-500/20'
                            }
                            border-4 ${node.completed ? 'border-yellow-300' : node.unlocked ? 'border-green-300' : canUnlock(node) ? 'border-blue-300' : 'border-gray-500'}
                            transition-all duration-300
                        `}>
                            <span className="text-white drop-shadow-lg">{node.icon}</span>
                            
                            {/* Level indicator */}
                            <div className={`
                                absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                bg-gradient-to-br ${getLevelColor(node.level)}
                                text-white border-2 border-white
                            `}>
                                {node.level}
                            </div>
                        </div>
                        
                        {/* Skill name */}
                        <div className="text-center mt-2">
                            <div className={`font-semibold text-sm ${node.completed ? 'text-yellow-300' : node.unlocked ? 'text-green-300' : canUnlock(node) ? 'text-blue-300' : 'text-gray-400'}`}>
                                {node.name}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Node details panel */}
            {selectedNode && !showContent && (
                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg p-6 max-w-sm z-10 border border-purple-500/30">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{selectedNode.icon}</span>
                        <div>
                            <h3 className="text-xl font-bold text-white">{selectedNode.name}</h3>
                            <div className={`text-sm px-2 py-1 rounded bg-gradient-to-r ${getLevelColor(selectedNode.level)} text-white`}>
                                Level {selectedNode.level} - {getLevelName(selectedNode.level)}
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-gray-300 mb-4">{selectedNode.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                            <span className="text-gray-400">Type:</span>
                            <div className="text-white capitalize">{selectedNode.type}</div>
                        </div>
                        <div>
                            <span className="text-gray-400">Time:</span>
                            <div className="text-white">{selectedNode.estimated_time}</div>
                        </div>
                        <div>
                            <span className="text-gray-400">Points:</span>
                            <div className="text-white">{selectedNode.points}</div>
                        </div>
                        <div>
                            <span className="text-gray-400">Status:</span>
                            <div className={`${selectedNode.completed ? 'text-green-400' : selectedNode.unlocked ? 'text-blue-400' : 'text-gray-400'}`}>
                                {selectedNode.completed ? 'Completed' : selectedNode.unlocked ? 'Unlocked' : 'Locked'}
                            </div>
                        </div>
                    </div>
                    
                    {selectedNode.requirements.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-sm font-semibold text-purple-300 mb-2">Prerequisites:</h4>
                            <div className="space-y-1">
                                {selectedNode.requirements.map(reqId => {
                                    const reqNode = nodes.find(n => n.id === reqId);
                                    return (
                                        <div key={reqId} className={`text-xs px-2 py-1 rounded ${
                                            reqNode?.completed ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                                        }`}>
                                            {reqNode?.name} {reqNode?.completed ? '✓' : '✗'}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    
                    <div className={`text-center py-2 px-4 rounded font-semibold ${
                        selectedNode.completed 
                            ? 'bg-green-500/20 text-green-300' 
                            : selectedNode.unlocked
                                ? 'bg-blue-500/20 text-blue-300'
                                : canUnlock(selectedNode)
                                    ? 'bg-purple-500/20 text-purple-300'
                                    : 'bg-gray-500/20 text-gray-400'
                    }`}>
                        {selectedNode.completed 
                            ? 'Completed ✓' 
                            : selectedNode.unlocked
                                ? 'Click to Start!'
                                : canUnlock(selectedNode)
                                    ? 'Click to Unlock!'
                                    : 'Locked'
                        }
                    </div>
                    
                    <button 
                        onClick={() => setSelectedNode(null)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Progress indicator */}
            <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30">
                <h3 className="text-white font-semibold mb-2">Progress</h3>
                <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
                            style={{ width: `${(nodes.filter(n => n.unlocked).length / nodes.length) * 100}%` }}
                        />
                    </div>
                    <span className="text-sm text-gray-300">
                        {nodes.filter(n => n.unlocked).length}/{nodes.length}
                    </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                    {nodes.filter(n => n.completed).length} completed
                </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30">
                <h3 className="text-white font-semibold mb-2">Legend</h3>
                <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500"></div>
                        <span className="text-gray-300">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-blue-500"></div>
                        <span className="text-gray-300">Unlocked</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
                        <span className="text-gray-300">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-600 to-gray-800"></div>
                        <span className="text-gray-300">Locked</span>
                    </div>
                </div>
            </div>
        </div>
    );
} 