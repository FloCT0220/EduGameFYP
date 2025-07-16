"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaTrophy, FaCheck, FaSpinner } from 'react-icons/fa';
import { getSession } from '@/lib/session';
import toast from 'react-hot-toast';

interface User {
    id: number;
    username: string;
}

interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    points: number;
    difficulty: string;
}

interface QuizAnswer {
    questionId: string;
    selectedAnswer: number;
}

export default function TopicQuizPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id as string;
    const topicId = params.topicId as string;

    const [user, setUser] = useState<User | null>(null);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [questionIds, setQuestionIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<QuizAnswer[]>([]);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [submittingQuiz, setSubmittingQuiz] = useState(false);
    const [quizResults, setQuizResults] = useState<{
        score: number;
        totalQuestions: number;
        totalPoints: number;
        passed: boolean;
        attemptId?: number;
    } | null>(null);


    useEffect(() => {
        const initializeUser = async () => {
            const token = getSession('authToken');
            if (!token) {
                router.push('/login');
                return;
            }
            try {
                const response = await fetch('/api/users', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setUser(data.user);
                    } else {
                        toast.error('Failed to load user data');
                        router.push('/login');
                    }
                } else {
                    toast.error('Failed to authenticate');
                    router.push('/login');
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                toast.error('Error loading user data');
                router.push('/login');
            }
        };
        initializeUser();
    }, [router]);

    const fetchQuizQuestions = useCallback(async () => {
        try {
            const response = await fetch(`/api/quiz/questions?courseId=${courseId}&topicId=${topicId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setQuestions(data.questions);
                    setQuestionIds(data.questions.map((q: QuizQuestion) => q.id));
                }
            }
        } catch (error) {
            console.error('Error fetching quiz questions:', error);
        } finally {
            setLoading(false);
        }
    }, [courseId, topicId]);

    useEffect(() => {
        if (courseId && topicId && user?.id) {
            fetchQuizQuestions();
        }
    }, [courseId, topicId, user?.id, fetchQuizQuestions]);

    const handleAnswerSelect = (questionId: string, selectedAnswer: number) => {
        setAnswers(prev => {
            const existing = prev.find(a => a.questionId === questionId);
            if (existing) {
                return prev.map(a =>
                    a.questionId === questionId
                        ? { ...a, selectedAnswer }
                        : a
                );
            }
            return [...prev, { questionId, selectedAnswer }];
        });
    };

    const handleNextQuestion = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            handleSubmitQuiz();
        }
    };

    const handleSubmitQuiz = async () => {
        setSubmittingQuiz(true);
        try {
            const token = getSession('authToken');
            const response = await fetch(`/api/quiz/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: user?.id,
                    courseId: parseInt(courseId),
                    topicId: topicId,
                    questionIds,
                    answers: answers
                }),
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setQuizResults(data.results);
                    setQuizCompleted(true);
                    if (data.results.passed) {
                        toast.success(`Quiz completed! You earned ${data.results.totalPoints} points!`);
                    } else {
                        toast.error('Quiz failed. You need 80% to pass. Try again!');
                    }
                } else {
                    toast.error(data.error || 'Failed to submit quiz');
                }
            } else {
                toast.error('Failed to submit quiz');
            }
        } catch (error) {
            console.error('Error submitting quiz:', error);
            toast.error('Error submitting quiz');
        } finally {
            setSubmittingQuiz(false);
        }
    };

    const handleBackToTopic = () => {
        router.push(`/courses/${courseId}/topics/${topicId}`);
    };

    const handleRetryQuiz = () => {
        setCurrentQuestion(0);
        setAnswers([]);
        setQuizCompleted(false);
        setQuizResults(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center pl-64">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600">Loading quiz...</p>
                </div>
            </div>
        );
    }

    // Quiz completion screen
    if (quizCompleted && quizResults) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4 pl-64">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className={`text-6xl mb-4 ${quizResults.passed ? 'text-green-500' : 'text-red-500'}`}>{quizResults.passed ? '🎉' : '😞'}</div>
                    <h2 className="text-2xl font-bold mb-4">{quizResults.passed ? 'Congratulations!' : 'Keep Trying!'}</h2>
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="text-3xl font-bold text-blue-600 mb-2">{quizResults.score}/{quizResults.totalQuestions}</div>
                        <div className="text-sm text-gray-600">{Math.round((quizResults.score / quizResults.totalQuestions) * 100)}% Score</div>
                        {quizResults.passed && (
                            <div className="text-sm text-green-600 mt-2">
                                <FaTrophy className="inline mr-1" />
                                +{quizResults.totalPoints} Points Earned
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleBackToTopic}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Back to Topic
                        </button>
                        {quizResults.attemptId && (
                            <button
                                onClick={() => router.push(`/courses/${courseId}/topics/${topicId}/review/${quizResults.attemptId}`)}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                📝 Review Quiz
                            </button>
                        )}
                        {!quizResults.passed && (
                            <button
                                onClick={handleRetryQuiz}
                                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Retry Quiz
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Quiz interface
    if (questions.length > 0) {
        const currentQuestionData = questions[currentQuestion];
        const currentAnswer = answers.find(a => a.questionId === currentQuestionData.id);
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 pl-64">
                <div className="max-w-4xl mx-auto">
                    {/* Quiz Header */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-2xl font-bold text-gray-900">📝 Quiz Time!</h1>
                            <div className="text-sm text-gray-600">Question {currentQuestion + 1} of {questions.length}</div>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}></div>
                        </div>
                    </div>
                    {/* Question */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentQuestionData.difficulty === 'easy' ? 'bg-green-100 text-green-800' : currentQuestionData.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{currentQuestionData.difficulty}</span>
                                <span className="text-sm text-gray-600"><FaTrophy className="inline mr-1" />{currentQuestionData.points} points</span>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">{currentQuestionData.question}</h2>
                        </div>
                        {/* Options */}
                        <div className="space-y-3 mb-6">
                            {currentQuestionData.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswerSelect(currentQuestionData.id, index)}
                                    className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${currentAnswer?.selectedAnswer === index ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                >
                                    <div className="flex items-center">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${currentAnswer?.selectedAnswer === index ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>{currentAnswer?.selectedAnswer === index && (<FaCheck className="text-white text-xs" />)}</div>
                                        <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                                        <span className="ml-2">{option}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        {/* Navigation */}
                        <div className="flex justify-end items-center">
                            <div className="flex gap-3">
                                <button
                                    onClick={handleNextQuestion}
                                    disabled={!currentAnswer || submittingQuiz}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {submittingQuiz ? (<><FaSpinner className="animate-spin mr-2" />Submitting...</>) : currentQuestion === questions.length - 1 ? ('Submit Quiz') : ('Next Question')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // No questions fallback
    return (
        <div className="min-h-screen flex items-center justify-center pl-64">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">No quiz questions available for this topic.</h2>
                <button
                    onClick={handleBackToTopic}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Back to Topic
                </button>
            </div>
        </div>
    );
} 