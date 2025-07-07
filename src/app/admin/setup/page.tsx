'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AdminSetupPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const populateData = async () => {
        setLoading(true);
        setResult(null);
        
        try {
            const response = await fetch('/api/admin/populate-sample-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                setResult(data);
                toast.success('Sample data populated successfully!');
            } else {
                throw new Error(data.error || 'Failed to populate data');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.message || 'Failed to populate sample data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
                    🔧 Admin Setup
                </h1>

                <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Sample Data Population</h2>
                    <p className="text-gray-600 mb-6">
                        Click the button below to populate your database with sample quiz questions and test data.
                        This will help you test the quiz system and topic content functionality.
                    </p>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={populateData}
                            disabled={loading}
                            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Populating Data...
                                </>
                            ) : (
                                <>
                                    📊 Populate Sample Data
                                </>
                            )}
                        </button>

                        {result && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h3 className="font-semibold text-green-800 mb-2">✅ Success!</h3>
                                <p className="text-green-700">{result.message}</p>
                                <div className="mt-2 text-sm text-green-600">
                                    • Added {result.questionsAdded} quiz questions
                                    • Set up sample user enrollments
                                    • Added sample progress data
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-semibold mb-4">📋 What's Included</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-2">Quiz Questions</h3>
                            <ul className="text-gray-600 text-sm space-y-1">
                                <li>• HTML Basics (3 questions)</li>
                                <li>• CSS Fundamentals (3 questions)</li>
                                <li>• JavaScript Basics (3 questions)</li>
                                <li>• Web Development (3 questions)</li>
                                <li>• Database Design (3 questions)</li>
                                <li>• Data Science (3 questions)</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-2">Sample Data</h3>
                            <ul className="text-gray-600 text-sm space-y-1">
                                <li>• User enrollments in courses</li>
                                <li>• Sample topic progress</li>
                                <li>• Quiz difficulty levels</li>
                                <li>• Point rewards system</li>
                                <li>• Answer explanations</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-8">
                    <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes</h3>
                    <ul className="text-yellow-700 text-sm space-y-1">
                        <li>• This will clear existing quiz questions and replace them</li>
                        <li>• Make sure your database is properly configured</li>
                        <li>• This is safe to run multiple times</li>
                        <li>• User progress data will be preserved unless duplicate keys exist</li>
                    </ul>
                </div>
            </div>
        </div>
    );
} 