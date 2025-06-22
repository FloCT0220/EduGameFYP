'use client';

import { useState } from 'react';
import ProgressBar from './ProgressBar';

export interface SkillNode {
    id: string;
    title: string;
    description: string;
    level: number;
    position: { x: number | string; y: number | string };
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
    const [hoveredNode, setHoveredNode] = useState<SkillNode | null>(null);

    // Group nodes by level
    const nodesByLevel = nodes.reduce((acc, node) => {
        (acc[node.level] = acc[node.level] || []).push(node);
        return acc;
    }, {} as Record<number, SkillNode[]>);

    // Calculate positions dynamically
    const positionedNodes = Object.entries(nodesByLevel).flatMap(([level, levelNodes]) => {
        const y = (parseInt(level, 10)) * 180; // Vertical spacing between levels
        const totalWidth = levelNodes.length * 180; // Horizontal spacing
        const startX = `calc(50% - ${totalWidth / 2}px)`;

        return levelNodes.map((node, index) => {
            const x = index * 180;
            return {
                ...node,
                position: {
                    x: `calc(${startX} + ${x}px)`,
                    y: `${y}px`
                }
            };
        });
    });

    // Calculate prerequisite counts for each node
    const getPrerequisiteCount = (nodeId: string) => {
        return positionedNodes.filter(node => 
            node.prerequisites.includes(nodeId)
        ).length;
    };

    // Get nodes that depend on this node
    const getDependentNodes = (nodeId: string) => {
        return positionedNodes.filter(node => 
            node.prerequisites.includes(nodeId)
        );
    };

    // Get prerequisite nodes for this node
    const getPrerequisiteNodes = (nodeId: string) => {
        const node = positionedNodes.find(n => n.id === nodeId);
        if (!node) return [];
        return positionedNodes.filter(n => 
            node.prerequisites.includes(n.id)
        );
    };

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

    // Calculate connections between nodes
    const getConnections = () => {
        const connections: Array<{ from: SkillNode; to: SkillNode }> = [];
        
        positionedNodes.forEach(node => {
            node.prerequisites.forEach(prereqId => {
                const prereqNode = positionedNodes.find(n => n.id === prereqId);
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
                <div className="min-h-[800px] w-full relative overflow-auto bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    {/* SVG for connections */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                        <defs>
                            <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="7"
                                refX="9"
                                refY="3.5"
                                orient="auto"
                            >
                                <polygon
                                    points="0 0, 10 3.5, 0 7"
                                    fill="#6b7280"
                                />
                            </marker>
                            <marker
                                id="arrowhead-active"
                                markerWidth="10"
                                markerHeight="7"
                                refX="9"
                                refY="3.5"
                                orient="auto"
                            >
                                <polygon
                                    points="0 0, 10 3.5, 0 7"
                                    fill="#10b981"
                                />
                            </marker>
                        </defs>
                        
                        {connections.map((connection, index) => {
                            const fromX = `calc(${connection.from.position.x} + 70px)`;
                            const fromY = `calc(${connection.from.position.y} + 55px)`;
                            const toX = `calc(${connection.to.position.x} + 70px)`;
                            const toY = `calc(${connection.to.position.y} + 55px)`;
                            
                            const isPathUnlocked = connection.from.completed;
                            const isHighlighted = hoveredNode && (
                                hoveredNode.id === connection.from.id || 
                                hoveredNode.id === connection.to.id ||
                                getPrerequisiteNodes(hoveredNode.id).some(n => n.id === connection.from.id) ||
                                getDependentNodes(hoveredNode.id).some(n => n.id === connection.to.id)
                            );
                            
                            return (
                                <path
                                    key={index}
                                    d={`M ${fromX} ${fromY} C ${fromX} ${toY}, ${toX} ${fromY}, ${toX} ${toY}`}
                                    stroke={isPathUnlocked ? '#10b981' : isHighlighted ? '#3b82f6' : '#d1d5db'}
                                    strokeWidth={isHighlighted ? "4" : "3"}
                                    fill="none"
                                    strokeDasharray={isPathUnlocked ? 'none' : '5,5'}
                                    opacity={isHighlighted ? 1 : 0.7}
                                    markerEnd={isPathUnlocked ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                                />
                            );
                        })}
                    </svg>

                    {/* Skill Nodes */}
                    <div className="relative w-full min-w-[800px] min-h-[800px]" style={{ zIndex: 2 }}>
                        {positionedNodes.map((node) => {
                            const prerequisiteCount = getPrerequisiteCount(node.id);
                            const isHighlighted = hoveredNode && (
                                hoveredNode.id === node.id ||
                                getPrerequisiteNodes(hoveredNode.id).some(n => n.id === node.id) ||
                                getDependentNodes(hoveredNode.id).some(n => n.id === node.id)
                            );
                            
                            return (
                                <div
                                    key={node.id}
                                    className={`absolute cursor-pointer transform transition-all duration-200 hover:scale-105 ${
                                        node.locked ? 'cursor-not-allowed' : ''
                                    } ${isHighlighted ? 'scale-110 z-10' : ''}`}
                                    style={{
                                        left: node.position.x,
                                        top: node.position.y,
                                        width: '140px',
                                        height: '110px'
                                    }}
                                    onClick={() => {
                                        if(!node.locked){
                                            setSelectedNode(node as SkillNode);
                                            onNodeClick(node as SkillNode);
                                        }
                                    }}
                                    onMouseEnter={() => setHoveredNode(node as SkillNode)}
                                    onMouseLeave={() => setHoveredNode(null)}
                                >
                                    <div className={`
                                        w-full h-full rounded-lg border-2 p-3 text-center relative
                                        ${getNodeColor(node)}
                                        ${selectedNode?.id === node.id ? 'ring-4 ring-blue-300' : ''}
                                        ${isHighlighted ? 'ring-2 ring-blue-400 shadow-lg' : ''}
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
                                        
                                        {/* Prerequisite Count Badge */}
                                        {prerequisiteCount > 0 && (
                                            <div className="absolute -top-2 -left-2 w-6 h-6 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                                {prerequisiteCount}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">📋 Visual Guide</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <h5 className="font-medium text-gray-700 mb-1">Connection Lines:</h5>
                        <ul className="space-y-1 text-gray-600">
                            <li>• <span className="text-green-600 font-medium">Solid green lines</span> = Completed prerequisites</li>
                            <li>• <span className="text-gray-500 font-medium">Dashed gray lines</span> = Incomplete prerequisites</li>
                            <li>• <span className="text-blue-600 font-medium">Arrow heads</span> = Direction of dependency</li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-medium text-gray-700 mb-1">Node Indicators:</h5>
                        <ul className="space-y-1 text-gray-600">
                            <li>• <span className="bg-purple-500 text-white px-1 rounded text-xs">Number</span> = How many nodes depend on this one</li>
                            <li>• <span className="text-green-600 font-medium">Hover effects</span> = Highlight related nodes</li>
                            <li>• <span className="text-blue-600 font-medium">Ring border</span> = Currently selected node</li>
                        </ul>
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
                                            const prereqNode = positionedNodes.find(n => n.id === prereqId);
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

                            {getDependentNodes(selectedNode.id).length > 0 && (
                                <div className="mt-3">
                                    <span className="font-medium text-blue-700">Unlocks:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {getDependentNodes(selectedNode.id).map((dependentNode) => (
                                            <span
                                                key={dependentNode.id}
                                                className={`text-xs px-2 py-1 rounded-full ${
                                                    dependentNode.completed 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : dependentNode.locked
                                                        ? 'bg-gray-100 text-gray-600'
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}
                                            >
                                                {dependentNode.completed ? '✅' : dependentNode.locked ? '🔒' : '🔓'} {dependentNode.title}
                                            </span>
                                        ))}
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
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Start {selectedNode.type}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 