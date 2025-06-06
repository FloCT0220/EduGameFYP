'use client';

interface ProgressBarProps {
    current: number;
    total: number;
    label?: string;
    color?: 'blue' | 'green' | 'purple' | 'orange';
    showPercentage?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function ProgressBar({ 
    current, 
    total, 
    label, 
    color = 'blue',
    showPercentage = true,
    size = 'md'
}: ProgressBarProps) {
    const percentage = Math.min((current / total) * 100, 100);
    
    const colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        purple: 'bg-purple-500',
        orange: 'bg-orange-500'
    };

    const sizeClasses = {
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4'
    };

    return (
        <div className="w-full">
            {label && (
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{label}</span>
                    {showPercentage && <span>{percentage.toFixed(0)}%</span>}
                </div>
            )}
            <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
                <div 
                    className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            {!label && showPercentage && (
                <div className="text-right text-sm text-gray-600 mt-1">
                    {current} / {total}
                </div>
            )}
        </div>
    );
} 