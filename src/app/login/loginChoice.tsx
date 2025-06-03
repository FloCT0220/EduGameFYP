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
                    className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                    ← Back to Login Choice
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
                    className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                    ← Back to Login Choice
                </button>
                <RegistrationForm />
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4 text-center">Login</h2>
            <div className="flex gap-4 justify-center">
                <button 
                    onClick={handleLoginClick}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                    Login
                </button>
                <button 
                    onClick={handleRegisterClick}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                    Register
                </button>
            </div>
        </div>
    );
}