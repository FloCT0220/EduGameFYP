'use client';

interface PointsDisplayProps {
    points: number;
    showAnimation?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function PointsDisplay({ 
    points, 
    showAnimation = false,
    size = 'md'
}: PointsDisplayProps) {

    // Level XP requirements: Level 1 = 200, Level 2 = 600, Level 3 = 1000, Level 4 = 1400, ...
    // Pattern: XP for level N = 200 + (N-1)*400
    // Cumulative XP to reach level N: sum_{i=1}^{N} (200 + (i-1)*400)
    // Let's precompute the XP required for each level up to a reasonable max (e.g., 100)
    const maxLevel = 100;
    const levelThresholds: number[] = [0]; // XP required to reach each level (index = level)
    let cumulative = 0;
    for (let i = 1; i <= maxLevel; i++) {
        const req = 200 + (i - 1) * 400;
        cumulative += req;
        levelThresholds.push(cumulative);
    }

    // Find the current level based on points
    let level = 1;
    for (let i = 1; i < levelThresholds.length; i++) {
        if (points < levelThresholds[i]) {
            level = i;
            break;
        }
        level = i;
    }

    const currentLevelXP = levelThresholds[level - 1] || 0;
    const nextLevelXP = levelThresholds[level] || (currentLevelXP + 400);
    const xpForLevel = nextLevelXP - currentLevelXP;
    const xpInLevel = points - currentLevelXP;
    const xpProgress = (xpInLevel / xpForLevel) * 100;

    const sizeClasses = {
        sm: 'text-sm p-2',
        md: 'text-base p-3',
        lg: 'text-lg p-4'
    };

    const iconSizes = {
        sm: 'text-lg',
        md: 'text-xl',
        lg: 'text-2xl'
    };

    return (
        <div className={`bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg ${sizeClasses[size]}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <span className={iconSizes[size]}>⭐</span>
                    <span className="font-bold">{points.toLocaleString()} Points</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className={iconSizes[size]}>🏆</span>
                    <span className="font-bold">Level {level}</span>
                </div>
            </div>
            <div className="space-y-1">
                <div className="flex justify-between text-xs opacity-90">
                    <span>XP for Level {level}: {xpForLevel}</span>
                    <span>{xpInLevel} / {xpForLevel}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                        className={`bg-white h-2 rounded-full transition-all duration-500 ease-out ${showAnimation ? 'animate-pulse' : ''}`}
                        style={{ width: `${Math.min(xpProgress, 100)}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
} 