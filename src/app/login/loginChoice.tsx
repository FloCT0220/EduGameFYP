'use client';
import { useState } from 'react';
import RegistrationForm from './registerform';
import LoginForm from './loginForm';

export default function LoginChoice() {
    const [showRegister, setShowRegister] = useState(false);
    const [showLogin, setShowLogin] = useState(false);

    const handleLoginClick = () => {
        setShowLogin(true);
        setShowRegister(false);
    };

    const handleRegisterClick = () => {
        setShowRegister(true);
        setShowLogin(false);
    };

    const handleBackToChoice = () => {
        setShowRegister(false);
        setShowLogin(false);
    };

    if (showLogin) {
        return (
            <div>
                <button 
                    onClick={handleBackToChoice}
                    className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors"
                >
                    ← Back to Options
                </button>
                <LoginForm />
            </div>
        );
    }

    if (showRegister) {
        return (
            <div>
                <button 
                    onClick={handleBackToChoice}
                    className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors"
                >
                    ← Back to Options
                </button>
                <RegistrationForm />
            </div>
        );
    }

    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Choose Your Path
            </h2>
            
            <div className="space-y-6">
                <div 
                    onClick={handleLoginClick}
                    className="group cursor-pointer card hover:scale-105 transition-all duration-300 border-2 border-blue-200 hover:border-blue-300"
                >
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🔑</div>
                    <h3 className="text-xl font-bold text-blue-700 mb-3">Sign In</h3>
                    <p className="text-blue-600">
                        Welcome back! Access your courses and continue learning
                    </p>
                </div>

                <div 
                    onClick={handleRegisterClick}
                    className="group cursor-pointer card hover:scale-105 transition-all duration-300 border-2 border-green-200 hover:border-green-300"
                >
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">✨</div>
                    <h3 className="text-xl font-bold text-green-700 mb-3">Create Account</h3>
                    <p className="text-green-600">
                        New to EduQuest? Join thousands of learners today!
                    </p>
                </div>
            </div>

            <div className="mt-8 p-6 glass rounded-xl">
                <div className="flex justify-center space-x-6 text-3xl mb-4">
                    <span title="Gamified Learning" className="animate-bounce">🎮</span>
                    <span title="Progress Tracking" className="animate-pulse">📊</span>
                    <span title="Achievements" className="animate-glow">🏆</span>
                    <span title="Community">👥</span>
                </div>
                <p className="text-sm text-white/80">
                    Gamified • Progress Tracking • Achievements • Community
                </p>
            </div>
        </div>
    );
}