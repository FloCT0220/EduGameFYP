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
    const [fieldErrors, setFieldErrors] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

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

    const validateField = (name: string, value: string): string => {
        switch (name) {
            case 'username':
                if (!value.trim()) return '';
                if (value.length < 3) return 'Username must be at least 3 characters';
                if (value.length > 20) return 'Username must be less than 20 characters';
                if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Username can only contain letters, numbers, hyphens, and underscores';
                return '';
            case 'email':
                if (!value.trim()) return '';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
                return '';
            case 'password':
                if (!value) return '';
                if (value.length < 8) return 'Password must be at least 8 characters';
                if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
                if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
                if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
                return '';
            case 'confirmPassword':
                if (!value) return '';
                if (formData.password !== value) return 'Passwords do not match';
                return '';
            default:
                return '';
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear general error/success messages
        if (error) setError('');
        if (success) setSuccess('');
        
        // Validate field and update field errors
        const fieldError = validateField(name, value);
        setFieldErrors(prev => ({ ...prev, [name]: fieldError }));
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

        // Comprehensive validation
        const errors: string[] = [];

        // Username validation
        if (!formData.username.trim()) {
            errors.push('Username is required');
        } else if (formData.username.length < 3) {
            errors.push('Username must be at least 3 characters long');
        } else if (formData.username.length > 20) {
            errors.push('Username must be less than 20 characters');
        } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
            errors.push('Username can only contain letters, numbers, hyphens, and underscores');
        }

        // Email validation
        if (!formData.email.trim()) {
            errors.push('Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.push('Please enter a valid email address');
        }

        // Password validation
        if (!formData.password) {
            errors.push('Password is required');
        } else if (formData.password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        } else if (!/(?=.*[a-z])/.test(formData.password)) {
            errors.push('Password must contain at least one lowercase letter');
        } else if (!/(?=.*[A-Z])/.test(formData.password)) {
            errors.push('Password must contain at least one uppercase letter');
        } else if (!/(?=.*\d)/.test(formData.password)) {
            errors.push('Password must contain at least one number');
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            errors.push('Please confirm your password');
        } else if (formData.password !== formData.confirmPassword) {
            errors.push('Passwords do not match');
        }

        if (errors.length > 0) {
            setError(errors.join('. '));
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
                        {isLogin ? 'Welcome Back! 🎓' : 'Join Gamified Learning Platform! ✨'}
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
                                setFieldErrors({ username: '', email: '', password: '', confirmPassword: '' });
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
                                setFieldErrors({ username: '', email: '', password: '', confirmPassword: '' });
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
                                    className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                                        fieldErrors.username 
                                            ? 'border-red-300 focus:ring-red-500' 
                                            : 'border-gray-300 focus:ring-green-500'
                                    }`}
                                    placeholder="Choose a unique username"
                                />
                                {fieldErrors.username && (
                                    <p className="text-red-600 text-sm mt-1">{fieldErrors.username}</p>
                                )}
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
                                    className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                                        fieldErrors.email 
                                            ? 'border-red-300 focus:ring-red-500' 
                                            : 'border-gray-300 focus:ring-green-500'
                                    }`}
                                    placeholder="Enter your email address"
                                />
                                {fieldErrors.email && (
                                    <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>
                                )}
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
                                    className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                                        fieldErrors.password 
                                            ? 'border-red-300 focus:ring-red-500' 
                                            : 'border-gray-300 focus:ring-green-500'
                                    }`}
                                    placeholder="Create a secure password (min. 8 characters)"
                                />
                                {fieldErrors.password && (
                                    <p className="text-red-600 text-sm mt-1">{fieldErrors.password}</p>
                                )}
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
                                    className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                                        fieldErrors.confirmPassword 
                                            ? 'border-red-300 focus:ring-red-500' 
                                            : 'border-gray-300 focus:ring-green-500'
                                    }`}
                                    placeholder="Re-enter your password"
                                />
                                {fieldErrors.confirmPassword && (
                                    <p className="text-red-600 text-sm mt-1">{fieldErrors.confirmPassword}</p>
                                )}
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