'use client';

interface PointsDisplayProps {
    points: number;
    level: number;
    xpForNextLevel: number;
    currentXP: number;
    showAnimation?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function PointsDisplay({ 
    points, 
    level, 
    xpForNextLevel, 
    currentXP,
    showAnimation = false,
    size = 'md'
}: PointsDisplayProps) {
    const xpProgress = (currentXP / xpForNextLevel) * 100;

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
                    <span>XP Progress</span>
                    <span>{currentXP} / {xpForNextLevel}</span>
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