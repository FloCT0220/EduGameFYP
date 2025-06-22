"use client"

import React, { useState, useEffect } from 'react';

interface SkillNode {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  unlocked: boolean;
  requirements: string[];
  icon: string;
  level: number; // 1-5 where 1 is foundation, 5 is mastery
  type: 'lesson' | 'quiz' | 'project';
  estimated_time: string;
  points: number;
  completed: boolean;
}

interface Connection {
  from: string;
  to: string;
}

interface SkillTreeProps {
  skillTreeId: number;
  title: string;
  description: string;
  icon: string;
}

const SkillTree: React.FC<SkillTreeProps> = ({ skillTreeId, title, description, icon }) => {
  const [skills, setSkills] = useState<SkillNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch skill tree data from API
  useEffect(() => {
    const fetchSkillTree = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/subjects/skill-trees/${skillTreeId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch skill tree');
        }
        
        const data = await response.json();
        if (data.success) {
          setSkills(data.nodes);
          setConnections(data.connections);
        } else {
          throw new Error(data.error || 'Failed to load skill tree');
        }
      } catch (err) {
        console.error('Error fetching skill tree:', err);
        setLoading(false);
      }
    };

    fetchSkillTree();
  }, [skillTreeId]);

  const canUnlock = (skill: SkillNode): boolean => {
    if (skill.unlocked) return false;
    return skill.requirements.every(reqId => 
      skills.find(s => s.id === reqId)?.unlocked || false
    );
  };

  const unlockSkill = (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    if (skill && canUnlock(skill)) {
      setSkills(prev => prev.map(s => 
        s.id === skillId ? { ...s, unlocked: true } : s
      ));
    }
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
    const fromSkill = skills.find(s => s.id === connection.from);
    return fromSkill?.unlocked || false;
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

  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading skill tree...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-gray-300 text-sm">{description}</p>
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
          const fromSkill = skills.find(s => s.id === connection.from);
          const toSkill = skills.find(s => s.id === connection.to);
          
          if (!fromSkill || !toSkill) return null;
          
          const isUnlocked = isConnectionUnlocked(connection);
          
          return (
            <path
              key={index}
              d={getConnectionPath(fromSkill, toSkill)}
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
        {skills.map((skill) => (
          <div
            key={skill.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
              skill.unlocked 
                ? 'hover:scale-110' 
                : canUnlock(skill) 
                  ? 'hover:scale-105 animate-bounce' 
                  : 'opacity-50'
            }`}
            style={{
              left: `${skill.x}%`,
              top: `${skill.y}%`,
            }}
            onClick={() => {
              if (canUnlock(skill)) {
                unlockSkill(skill.id);
              }
              setSelectedSkill(skill);
            }}
          >
            {/* Skill node */}
            <div className={`
              w-20 h-20 rounded-full flex items-center justify-center text-2xl relative
              ${skill.completed 
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/50' 
                : skill.unlocked 
                  ? 'bg-gradient-to-br from-green-400 to-blue-500 shadow-lg shadow-green-500/50'
                  : canUnlock(skill)
                    ? 'bg-gradient-to-br from-blue-400 to-purple-500 shadow-lg shadow-blue-500/50'
                    : 'bg-gradient-to-br from-gray-600 to-gray-800 shadow-lg shadow-gray-500/20'
              }
              border-4 ${skill.completed ? 'border-yellow-300' : skill.unlocked ? 'border-green-300' : canUnlock(skill) ? 'border-blue-300' : 'border-gray-500'}
              transition-all duration-300
            `}>
              <span className="text-white drop-shadow-lg">{skill.icon}</span>
              
              {/* Level indicator */}
              <div className={`
                absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                bg-gradient-to-br ${getLevelColor(skill.level)}
                text-white border-2 border-white
              `}>
                {skill.level}
              </div>
            </div>
            
            {/* Skill name */}
            <div className="text-center mt-2">
              <div className={`font-semibold text-sm ${skill.completed ? 'text-yellow-300' : skill.unlocked ? 'text-green-300' : canUnlock(skill) ? 'text-blue-300' : 'text-gray-400'}`}>
                {skill.name}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skill details panel */}
      {selectedSkill && (
        <div className="absolute top-4 right-4 backdrop-blur-sm rounded-lg p-6 max-w-sm z-10 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{selectedSkill.icon}</span>
            <div>
              <h3 className="text-xl font-bold text-white">{selectedSkill.name}</h3>
              <div className={`text-sm px-2 py-1 rounded bg-gradient-to-r ${getLevelColor(selectedSkill.level)} text-white`}>
                Level {selectedSkill.level} - {getLevelName(selectedSkill.level)}
              </div>
            </div>
          </div>
          
          <p className="text-gray-300 mb-4">{selectedSkill.description}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="text-gray-400">Type:</span>
              <div className="text-white capitalize">{selectedSkill.type}</div>
            </div>
            <div>
              <span className="text-gray-400">Time:</span>
              <div className="text-white">{selectedSkill.estimated_time}</div>
            </div>
            <div>
              <span className="text-gray-400">Points:</span>
              <div className="text-white">{selectedSkill.points}</div>
            </div>
            <div>
              <span className="text-gray-400">Status:</span>
              <div className={`${selectedSkill.completed ? 'text-green-400' : selectedSkill.unlocked ? 'text-blue-400' : 'text-gray-400'}`}>
                {selectedSkill.completed ? 'Completed' : selectedSkill.unlocked ? 'Unlocked' : 'Locked'}
              </div>
            </div>
          </div>
          
          {selectedSkill.requirements.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-purple-300 mb-2">Prerequisites:</h4>
              <div className="space-y-1">
                {selectedSkill.requirements.map(reqId => {
                  const reqSkill = skills.find(s => s.id === reqId);
                  return (
                    <div key={reqId} className={`text-xs px-2 py-1 rounded ${
                      reqSkill?.unlocked ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {reqSkill?.name} {reqSkill?.unlocked ? '✓' : '✗'}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className={`text-center py-2 px-4 rounded font-semibold ${
            selectedSkill.completed 
              ? 'bg-green-500/20 text-green-300' 
              : selectedSkill.unlocked
                ? 'bg-blue-500/20 text-blue-300'
                : canUnlock(selectedSkill)
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'bg-gray-500/20 text-gray-400'
          }`}>
            {selectedSkill.completed 
              ? 'Completed ✓' 
              : selectedSkill.unlocked
                ? 'Click to Start!'
                : canUnlock(selectedSkill)
                  ? 'Click to Unlock!'
                  : 'Locked'
            }
          </div>
          
          <button 
            onClick={() => setSelectedSkill(null)}
            className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Progress indicator */}
      <div className="absolute bottom-4 left-4 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30">
        <h3 className="text-white font-semibold mb-2">Progress</h3>
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${(skills.filter(s => s.unlocked).length / skills.length) * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-300">
            {skills.filter(s => s.unlocked).length}/{skills.length}
          </span>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {skills.filter(s => s.completed).length} completed
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30">
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
};

export default SkillTree; 