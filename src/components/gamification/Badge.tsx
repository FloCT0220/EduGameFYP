'use client';

interface BadgeProps {
    title: string;
    description?: string;
    icon: string;
    earned: boolean;
    earnedDate?: Date;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    size?: 'sm' | 'md' | 'lg';
}

export default function Badge({ 
    title, 
    description, 
    icon, 
    earned, 
    earnedDate,
    rarity = 'common',
    size = 'md'
}: BadgeProps) {
    const rarityColors = {
        common: 'border-gray-300 bg-gray-50',
        rare: 'border-blue-300 bg-blue-50',
        epic: 'border-purple-300 bg-purple-50',
        legendary: 'border-yellow-300 bg-yellow-50'
    };

    const rarityTextColors = {
        common: 'text-gray-600',
        rare: 'text-blue-600',
        epic: 'text-purple-600',
        legendary: 'text-yellow-600'
    };

    const sizeClasses = {
        sm: 'p-2 text-xs',
        md: 'p-3 text-sm',
        lg: 'p-4 text-base'
    };

    const iconSizes = {
        sm: 'text-xl',
        md: 'text-2xl',
        lg: 'text-3xl'
    };

    return (
        <div
            className={`
                relative rounded-xl border-2 shadow-md flex flex-col items-center justify-center transition-all duration-200 hover:scale-105
                ${earned ? rarityColors[rarity] : 'border-gray-200 bg-gray-100'}
                ${earned ? 'opacity-100' : 'opacity-40 grayscale'}
                ${sizeClasses[size]}
            `}
        >
            {earned ? (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                </div>
            ) : (
                <div style={{ display: 'none' }} />
            )}

            <div className="flex flex-col items-center text-center">
                <div className={`${iconSizes[size]} mb-2`}>{icon}</div>
                <h3 className={`font-semibold ${earned ? rarityTextColors[rarity] : 'text-gray-400'}`}>{title}</h3>
                {description ? (
                    <p className={`mt-1 text-xs ${earned ? 'text-gray-600' : 'text-gray-400'}`}>{description}</p>
                ) : (
                    <p style={{ display: 'none' }} />
                )}
                {earned && earnedDate ? (
                    <p className="text-xs text-gray-500 mt-1">Earned: {earnedDate.toLocaleDateString()}</p>
                ) : (
                    <p style={{ display: 'none' }} />
                )}
            </div>
        </div>
    );
} 