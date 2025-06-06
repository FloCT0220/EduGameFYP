'use client';

import { useState } from 'react';
import ProgressBar from './ProgressBar';

export interface SkillNode {
    id: string;
    title: string;
    description: string;
    level: number;
    position: { x: number; y: number };
    prerequisites: string[];
    completed: boolean;
    locked: boolean;
    points: number;
    difficulty: 'foundation' | 'intermediate' | 'advanced';
    estimatedTime: string;
    type: 'lesson' | 'quiz' | 'project' | 'checkpoint';
}

interface SkillTreeProps {
    nodes: SkillNode[];
    onNodeClick: (node: SkillNode) => void;
    courseTitle: string;
}

export default function SkillTree({ nodes, onNodeClick, courseTitle }: SkillTreeProps) {
    const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);

    const getNodeColor = (node: SkillNode) => {
        if (node.completed) {
            return 'bg-green-500 border-green-600 text-white';
        }
        if (node.locked) {
            return 'bg-gray-300 border-gray-400 text-gray-500';
        }
        return 'bg-blue-500 border-blue-600 text-white hover:bg-blue-600';
    };

    const getNodeIcon = (type: string) => {
        switch (type) {
            case 'lesson': return '📖';
            case 'quiz': return '🎯';
            case 'project': return '🛠️';
            case 'checkpoint': return '🏁';
            default: return '📝';
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'foundation': return 'bg-green-100 text-green-800';
            case 'intermediate': return 'bg-yellow-100 text-yellow-800';
            case 'advanced': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const completedNodes = nodes.filter(node => node.completed).length;
    const totalNodes = nodes.length;
    const overallProgress = (completedNodes / totalNodes) * 100;

    // Calculate connections between nodes
    const getConnections = () => {
        const connections: Array<{ from: SkillNode; to: SkillNode }> = [];
        
        nodes.forEach(node => {
            node.prerequisites.forEach(prereqId => {
                const prereqNode = nodes.find(n => n.id === prereqId);
                if (prereqNode) {
                    connections.push({ from: prereqNode, to: node });
                }
            });
        });
        
        return connections;
    };

    const connections = getConnections();

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    🌳 {courseTitle} - Skill Tree
                </h2>
                <p className="text-gray-600 mb-4">
                    Master each topic to unlock the next level. Complete all nodes to master the course!
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                        <span className="text-sm text-gray-600">{completedNodes}/{totalNodes} completed</span>
                    </div>
                    <ProgressBar
                        current={completedNodes}
                        total={totalNodes}
                        color="green"
                        size="lg"
                    />
                </div>
            </div>

            {/* Skill Tree Visualization */}
            <div className="relative">
                <div className="min-h-[600px] relative overflow-x-auto">
                    {/* SVG for connections */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                        {connections.map((connection, index) => {
                            const fromX = connection.from.position.x + 50; // Center of node (assuming 100px width)
                            const fromY = connection.from.position.y + 40; // Center of node (assuming 80px height)
                            const toX = connection.to.position.x + 50;
                            const toY = connection.to.position.y + 40;
                            
                            const isPathUnlocked = connection.from.completed;
                            
                            return (
                                <line
                                    key={index}
                                    x1={fromX}
                                    y1={fromY}
                                    x2={toX}
                                    y2={toY}
                                    stroke={isPathUnlocked ? '#10b981' : '#d1d5db'}
                                    strokeWidth="3"
                                    strokeDasharray={isPathUnlocked ? 'none' : '5,5'}
                                    opacity={0.7}
                                />
                            );
                        })}
                    </svg>

                    {/* Skill Nodes */}
                    <div className="relative" style={{ zIndex: 2 }}>
                        {nodes.map((node) => (
                            <div
                                key={node.id}
                                className={`absolute cursor-pointer transform transition-all duration-200 hover:scale-105 ${
                                    node.locked ? 'cursor-not-allowed' : ''
                                }`}
                                style={{
                                    left: `${node.position.x}px`,
                                    top: `${node.position.y}px`,
                                    width: '120px',
                                    height: '100px'
                                }}
                                onClick={() => !node.locked && onNodeClick(node)}
                            >
                                <div className={`
                                    w-full h-full rounded-lg border-2 p-3 text-center relative
                                    ${getNodeColor(node)}
                                    ${selectedNode?.id === node.id ? 'ring-4 ring-blue-300' : ''}
                                `}>
                                    {/* Node Icon */}
                                    <div className="text-xl mb-1">
                                        {node.completed ? '✅' : node.locked ? '🔒' : getNodeIcon(node.type)}
                                    </div>
                                    
                                    {/* Node Title */}
                                    <h4 className="text-xs font-semibold leading-tight mb-1">
                                        {node.title}
                                    </h4>
                                    
                                    {/* Points */}
                                    <div className="text-xs opacity-90">
                                        ⭐ {node.points}
                                    </div>
                                    
                                    {/* Difficulty Badge */}
                                    <div className={`absolute -top-2 -right-2 px-1 py-0.5 text-xs rounded-full ${getDifficultyColor(node.difficulty)}`}>
                                        {node.difficulty[0].toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Selected Node Details */}
            {selectedNode && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-blue-900 mb-2">
                                {getNodeIcon(selectedNode.type)} {selectedNode.title}
                            </h3>
                            <p className="text-blue-800 mb-3">{selectedNode.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-blue-700">Type:</span>
                                    <p className="text-blue-600 capitalize">{selectedNode.type}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-blue-700">Difficulty:</span>
                                    <p className={`capitalize font-medium ${
                                        selectedNode.difficulty === 'foundation' ? 'text-green-600' :
                                        selectedNode.difficulty === 'intermediate' ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                        {selectedNode.difficulty}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-blue-700">Points:</span>
                                    <p className="text-blue-600">⭐ {selectedNode.points}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-blue-700">Est. Time:</span>
                                    <p className="text-blue-600">⏱️ {selectedNode.estimatedTime}</p>
                                </div>
                            </div>

                            {selectedNode.prerequisites.length > 0 && (
                                <div className="mt-3">
                                    <span className="font-medium text-blue-700">Prerequisites:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {selectedNode.prerequisites.map((prereqId) => {
                                            const prereqNode = nodes.find(n => n.id === prereqId);
                                            return prereqNode ? (
                                                <span
                                                    key={prereqId}
                                                    className={`text-xs px-2 py-1 rounded-full ${
                                                        prereqNode.completed 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {prereqNode.completed ? '✅' : '⏳'} {prereqNode.title}
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="ml-4 text-blue-600 hover:text-blue-800"
                        >
                            ✕
                        </button>
                    </div>
                    
                    {!selectedNode.locked && (
                        <div className="mt-4">
                            <button
                                onClick={() => onNodeClick(selectedNode)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    selectedNode.completed
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                {selectedNode.completed ? '📚 Review' : '🚀 Start Learning'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Legend */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Legend:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span>Completed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span>Available</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-300 rounded"></div>
                        <span>Locked</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-0.5 bg-gray-400"></div>
                        <span>Prerequisites</span>
                    </div>
                </div>
            </div>
        </div>
    );
} 