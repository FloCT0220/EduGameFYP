"use client"

import React, { useState } from 'react';

interface SkillNode {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  unlocked: boolean;
  requirements: string[];
  icon: string;
  tier: number;
}

interface Connection {
  from: string;
  to: string;
}

const SkillTree: React.FC = () => {
  const [skills, setSkills] = useState<SkillNode[]>([
    // Tier 1 - Basic Skills
    {
      id: 'foundation',
      name: 'Foundation',
      description: 'Basic understanding of core concepts',
      x: 50,
      y: 10,
      unlocked: true,
      requirements: [],
      icon: '🏗️',
      tier: 1
    },
    
    // Tier 2 - Intermediate Skills
    {
      id: 'analysis',
      name: 'Analysis',
      description: 'Advanced analytical thinking and problem solving',
      x: 25,
      y: 35,
      unlocked: false,
      requirements: ['foundation'],
      icon: '🔍',
      tier: 2
    },
    {
      id: 'creativity',
      name: 'Creativity',
      description: 'Creative thinking and innovative solutions',
      x: 75,
      y: 35,
      unlocked: false,
      requirements: ['foundation'],
      icon: '🎨',
      tier: 2
    },
    
    // Tier 3 - Advanced Skills
    {
      id: 'leadership',
      name: 'Leadership',
      description: 'Lead teams and drive strategic initiatives',
      x: 15,
      y: 60,
      unlocked: false,
      requirements: ['analysis'],
      icon: '👑',
      tier: 3
    },
    {
      id: 'innovation',
      name: 'Innovation',
      description: 'Drive breakthrough innovations and transformations',
      x: 50,
      y: 60,
      unlocked: false,
      requirements: ['analysis', 'creativity'],
      icon: '💡',
      tier: 3
    },
    {
      id: 'strategy',
      name: 'Strategy',
      description: 'Strategic planning and execution mastery',
      x: 85,
      y: 60,
      unlocked: false,
      requirements: ['creativity'],
      icon: '🎯',
      tier: 3
    },
    
    // Tier 4 - Master Skills
    {
      id: 'mastery',
      name: 'Mastery',
      description: 'Complete mastery of all domains',
      x: 50,
      y: 85,
      unlocked: false,
      requirements: ['leadership', 'innovation', 'strategy'],
      icon: '⭐',
      tier: 4
    }
  ]);

  const connections: Connection[] = [
    { from: 'foundation', to: 'analysis' },
    { from: 'foundation', to: 'creativity' },
    { from: 'analysis', to: 'leadership' },
    { from: 'analysis', to: 'innovation' },
    { from: 'creativity', to: 'innovation' },
    { from: 'creativity', to: 'strategy' },
    { from: 'leadership', to: 'mastery' },
    { from: 'innovation', to: 'mastery' },
    { from: 'strategy', to: 'mastery' }
  ];

  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);

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

  return (
    <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
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
              ${skill.unlocked 
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/50' 
                : canUnlock(skill)
                  ? 'bg-gradient-to-br from-green-400 to-blue-500 shadow-lg shadow-green-500/50'
                  : 'bg-gradient-to-br from-gray-600 to-gray-800 shadow-lg shadow-gray-500/20'
              }
              border-4 ${skill.unlocked ? 'border-yellow-300' : canUnlock(skill) ? 'border-green-300' : 'border-gray-500'}
              transition-all duration-300
            `}>
              <span className="text-white drop-shadow-lg">{skill.icon}</span>
              
              {/* Tier indicator */}
              <div className={`
                absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${skill.tier === 1 ? 'bg-bronze-500' : skill.tier === 2 ? 'bg-silver-500' : skill.tier === 3 ? 'bg-gold-500' : 'bg-diamond-500'}
                text-white border-2 border-white
              `}>
                {skill.tier}
              </div>
            </div>
            
            {/* Skill name */}
            <div className="text-center mt-2">
              <div className={`font-semibold text-sm ${skill.unlocked ? 'text-yellow-300' : canUnlock(skill) ? 'text-green-300' : 'text-gray-400'}`}>
                {skill.name}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skill details panel */}
      {selectedSkill && (
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-6 max-w-sm z-10 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{selectedSkill.icon}</span>
            <div>
              <h3 className="text-xl font-bold text-white">{selectedSkill.name}</h3>
              <div className={`text-sm px-2 py-1 rounded ${
                selectedSkill.tier === 1 ? 'bg-bronze-500' : 
                selectedSkill.tier === 2 ? 'bg-silver-500' : 
                selectedSkill.tier === 3 ? 'bg-gold-500' : 'bg-diamond-500'
              } text-white`}>
                Tier {selectedSkill.tier}
              </div>
            </div>
          </div>
          
          <p className="text-gray-300 mb-4">{selectedSkill.description}</p>
          
          {selectedSkill.requirements.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-purple-300 mb-2">Requirements:</h4>
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
            selectedSkill.unlocked 
              ? 'bg-green-500/20 text-green-300' 
              : canUnlock(selectedSkill)
                ? 'bg-blue-500/20 text-blue-300'
                : 'bg-gray-500/20 text-gray-400'
          }`}>
            {selectedSkill.unlocked 
              ? 'Unlocked ✓' 
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
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30">
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
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30">
        <h3 className="text-white font-semibold mb-2">Legend</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500"></div>
            <span className="text-gray-300">Unlocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-blue-500"></div>
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