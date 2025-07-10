'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const router = useRouter();
    const { login, user, isAuthenticated, loading } = useAuth();

    // Redirect already authenticated users
    useEffect(() => {
        if (!loading && isAuthenticated && user) {
            if (user.role === 'admin') {
                router.push('/admin/dashboard');
            } else {
                router.push('/dashboard');
            }
        }
    }, [loading, isAuthenticated, user, router]);

    // Show loading while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background-primary)' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30 mx-auto mb-4"></div>
                    <p className="text-white/70">Checking authentication...</p>
                </div>
            </div>
        );
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError('');
        if (success) setSuccess('');
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { user, success: loginSuccess } = await login(formData.email, formData.password);
            
            if (loginSuccess && user) {
                // Role-based routing
                if (user.role === 'admin') {
                    router.push('/admin/dashboard');
                } else {
                    router.push('/dashboard');
                }
            } else {
                setError('Invalid email or password');
            }
        } catch {
            setError('Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Registration failed');
            }

            setSuccess('Registration successful! You can now sign in.');
            // Switch to login form and clear data
            setIsLogin(true);
            setFormData({
                email: formData.email, // Keep email for convenience
                password: '',
                username: '',
                confirmPassword: ''
            });
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background-primary)' }}>
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2 text-gradient">
                        {isLogin ? 'Welcome Back! 🎓' : 'Join EduQuest! ✨'}
                    </h1>
                    <p className="text-white/90">
                        {isLogin ? 'Continue your learning journey' : 'Start your learning adventure today'}
                    </p>
                </div>
                
                <div className="card">
                    {/* Toggle Buttons */}
                    <div className="flex mb-6 p-1 bg-gray-100 rounded-lg">
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(true);
                                setError('');
                                setSuccess('');
                            }}
                            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                                isLogin 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            🔑 Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(false);
                                setError('');
                                setSuccess('');
                            }}
                            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                                !isLogin 
                                    ? 'bg-green-600 text-white shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            ✨ Register
                        </button>
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                            <span className="mr-2">⚠️</span>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                            <span className="mr-2">✅</span>
                            {success}
                        </div>
                    )}

                    {/* Forms */}
                    {isLogin ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                    📧 Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
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
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Enter your password"
                                />
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
                        </form>
                    ) : (
                        <form onSubmit={handleRegisterSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="register-username" className="block text-sm font-semibold text-gray-700 mb-2">
                                    👤 Username
                                </label>
                                <input
                                    type="text"
                                    id="register-username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="Choose a unique username"
                                />
                            </div>

                            <div>
                                <label htmlFor="register-email" className="block text-sm font-semibold text-gray-700 mb-2">
                                    📧 Email Address
                                </label>
                                <input
                                    type="email"
                                    id="register-email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="Enter your email address"
                                />
                            </div>

                            <div>
                                <label htmlFor="register-password" className="block text-sm font-semibold text-gray-700 mb-2">
                                    🔒 Password
                                </label>
                                <input
                                    type="password"
                                    id="register-password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="Create a secure password (min. 6 characters)"
                                />
                            </div>

                            <div>
                                <label htmlFor="register-confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                                    🔐 Confirm Password
                                </label>
                                <input
                                    type="password"
                                    id="register-confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="Re-enter your password"
                                />
                            </div>

                            <div className="bg-green-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-green-800 mb-2">🎮 What you&apos;ll get:</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                                    <div className="flex items-center">
                                        <span className="mr-2">⭐</span>
                                        <span>Points & XP</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="mr-2">🏆</span>
                                        <span>Achievements</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="mr-2">🔥</span>
                                        <span>Learning Streaks</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="mr-2">📊</span>
                                        <span>Progress Tracking</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn btn-success disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating account...
                                    </span>
                                ) : (
                                    '🚀 Create Account'
                                )}
                            </button>
                        </form>
                    )}
                </div>
                
                <div className="mt-6 text-center">
                    <p className="text-sm text-white/70">
                        🔒 Your data is secure and protected
                    </p>
                </div>
            </div>
        </div>
    );
}