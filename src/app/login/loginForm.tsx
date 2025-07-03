'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Add your login logic here
            console.log('Login attempt:', { email, password });
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Get user role from localStorage
            const userRole = localStorage.getItem('userRole') || 'student';
            
            // Redirect based on role
            if (userRole === 'student') {
                router.push('/dashboard');
            } else {
                router.push('/admin/dashboard'); // admin dashboard
            }
            
        } catch {
            setError('Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    🔑 Sign In to EduQuest
                </h2>
                <p className="text-gray-600">
                    Enter your credentials to access your learning dashboard
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                        <span className="mr-2">⚠️</span>
                        {error}
                    </div>
                )}
                
                <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                        📧 Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter your email address"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                        🔒 Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter your password"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                            Remember me
                        </label>
                    </div>
                    <button
                        type="button"
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
                    >
                        Forgot password?
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Signing in...
                        </span>
                    ) : (
                        '🚀 Sign In'
                    )}
                </button>

                <div className="text-center pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-600">
                        Don&apos;t have an account?{' '}
                        <button
                            type="button"
                            onClick={() => window.location.reload()} // This will show the choice again
                            className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                        >
                            Create one here
                        </button>
                    </span>
                </div>
            </form>
        </div>
    );
}