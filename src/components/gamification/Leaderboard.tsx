'use client';

interface LeaderboardEntry {
    id: string;
    name: string;
    points: number;
    level: number;
    avatar?: string;
    streak?: number;
}

interface LeaderboardProps {
    entries: LeaderboardEntry[];
    currentUserId?: string;
    title?: string;
    maxEntries?: number;
}

export default function Leaderboard({ 
    entries, 
    currentUserId, 
    title = "Leaderboard",
    maxEntries = 10 
}: LeaderboardProps) {
    const topEntries = entries.slice(0, maxEntries);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `#${rank}`;
        }
    };

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
            case 2: return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
            case 3: return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">{title}</h2>
            
            <div className="space-y-3">
                {topEntries.map((entry, index) => {
                    const rank = index + 1;
                    const isCurrentUser = entry.id === currentUserId;
                    
                    return (
                        <div 
                            key={entry.id}
                            className={`
                                flex items-center p-3 rounded-lg transition-all duration-200 hover:scale-102
                                ${isCurrentUser ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
                                ${rank <= 3 ? 'border-2 border-opacity-20' : 'border border-gray-200'}
                            `}
                        >
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mr-4
                                ${getRankColor(rank)}
                            `}>
                                {getRankIcon(rank)}
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <h3 className={`font-semibold ${isCurrentUser ? 'text-blue-700' : 'text-gray-800'}`}>
                                        {entry.name} {isCurrentUser && '(You)'}
                                    </h3>
                                    <span className="text-sm text-gray-500">Level {entry.level}</span>
                                </div>
                                <div className="flex items-center space-x-4 mt-1">
                                    <span className="text-sm text-gray-600">
                                        ⭐ {entry.points.toLocaleString()} points
                                    </span>
                                    {entry.streak && entry.streak > 0 && (
                                        <span className="text-sm text-orange-600">
                                            🔥 {entry.streak} day streak
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {rank <= 3 && (
                                <div className="text-2xl opacity-50">
                                    {rank === 1 && '👑'}
                                    {rank === 2 && '🥈'}
                                    {rank === 3 && '🥉'}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            {entries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🏆</div>
                    <p>No entries yet. Be the first to join the leaderboard!</p>
                </div>
            )}
        </div>
    );
} 