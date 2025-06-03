'use client';

import { useRouter } from 'next/navigation';

export default function RoleChoice() {
    const router = useRouter();

    const handleRoleSelect = () => {
        router.push('/login');
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4 text-center">Login as</h2>
            <div className="flex gap-4 justify-center">
                <button 
                    onClick={handleRoleSelect}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                    Student
                </button>
                <button 
                    onClick={handleRoleSelect}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                    Teacher
                </button>
            </div>
        </div>
    )
}