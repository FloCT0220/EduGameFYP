import React from 'react'
import LoginChoice from './loginChoice'

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background-primary)' }}>
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2 text-gradient">
                        Welcome Back! 🎓
                    </h1>
                    <p className="text-white/90">
                        Continue your learning journey with EduQuest
                    </p>
                </div>
                
                <div className="card">
                    <LoginChoice />
                </div>
                
                <div className="mt-6 text-center">
                    <p className="text-sm text-white/70">
                        🔒 Your data is secure and protected
                    </p>
                </div>
            </div>
        </div>
    )
}