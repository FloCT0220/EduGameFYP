'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProgressBar from '@/components/gamification/ProgressBar';
import { QuizQuestion, generateQuizQuestions } from '@/data/quizQuestions';

interface QuizStats {
    score: number;
    streak: number;
    perfectAnswers: number;
    timeBonus: number;
    totalPoints: number;
    reviewQuestionsCorrect: number;
    currentNodeQuestionsCorrect: number;
}

export default function QuizPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    // Get parameters from URL
    const courseId = searchParams.get('courseId') || '1';
    const nodeId = searchParams.get('nodeId') || 'general';
    const nodeName = searchParams.get('nodeName') || 'General Knowledge';
    
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [answers, setAnswers] = useState<number[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [quizStats, setQuizStats] = useState<QuizStats>({
        score: 0,
        streak: 0,
        perfectAnswers: 0,
        timeBonus: 0,
        totalPoints: 0,
        reviewQuestionsCorrect: 0,
        currentNodeQuestionsCorrect: 0
    });
    const [timeLeft, setTimeLeft] = useState(30);
    const [streakCount, setStreakCount] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

    // Mock completed nodes for demo - in real app this would come from user data
    const getCompletedNodes = (courseId: string): string[] => {
        const completedNodeMap: Record<string, string[]> = {
            '1': ['react-1', 'react-2', 'react-3', 'react-4'], // React course completed nodes
            '2': ['js-1', 'js-2'], // JavaScript course completed nodes  
            '3': ['ts-1', 'ts-2'] // TypeScript course completed nodes
        };
        return completedNodeMap[courseId] || [];
    };

    useEffect(() => {
        // Generate questions for this quiz
        const completedNodes = getCompletedNodes(courseId);
        const questions = generateQuizQuestions(courseId, nodeId, completedNodes);
        setQuizQuestions(questions);
    }, [courseId, nodeId]);

    useEffect(() => {
        if (!showResults && !showFeedback && quizQuestions.length > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleTimeUp();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [currentQuestion, showResults, showFeedback, quizQuestions.length]);

    const handleTimeUp = () => {
        setSelectedAnswer(null);
        handleAnswerSubmit();
    };

    const handleAnswerSelect = (answerIndex: number) => {
        if (!showFeedback) {
            setSelectedAnswer(answerIndex);
        }
    };

    const handleAnswerSubmit = () => {
        if (quizQuestions.length === 0) return;
        
        const currentQ = quizQuestions[currentQuestion];
        const correct = selectedAnswer === currentQ.correctAnswer;
        
        setIsCorrect(correct);
        setShowFeedback(true);
        
        const newAnswers = [...answers, selectedAnswer || -1];
        setAnswers(newAnswers);

        if (correct) {
            setStreakCount(prev => prev + 1);
        } else {
            setStreakCount(0);
        }

        setTimeout(() => {
            if (currentQuestion < quizQuestions.length - 1) {
                setCurrentQuestion(prev => prev + 1);
                setSelectedAnswer(null);
                setShowFeedback(false);
                setTimeLeft(30);
            } else {
                calculateFinalStats(newAnswers);
                setShowResults(true);
            }
        }, 3000); // Show feedback for 3 seconds
    };

    const calculateFinalStats = (finalAnswers: number[]) => {
        let score = 0;
        let perfectAnswers = 0;
        let streak = 0;
        let maxStreak = 0;
        let totalPoints = 0;
        let reviewQuestionsCorrect = 0;
        let currentNodeQuestionsCorrect = 0;

        finalAnswers.forEach((answer, index) => {
            const question = quizQuestions[index];
            if (answer === question.correctAnswer) {
                score++;
                perfectAnswers++;
                streak++;
                maxStreak = Math.max(maxStreak, streak);
                totalPoints += question.points;
                
                // Track whether this was a review question or current node question
                if (question.nodeId === nodeId) {
                    currentNodeQuestionsCorrect++;
                } else {
                    reviewQuestionsCorrect++;
                }
                
                // Streak bonus
                if (streak >= 3) {
                    totalPoints += streak * 2;
                }
            } else {
                streak = 0;
            }
        });

        const timeBonus = Math.floor((streakCount * 5));
        totalPoints += timeBonus;

        setQuizStats({
            score,
            streak: maxStreak,
            perfectAnswers,
            timeBonus,
            totalPoints,
            reviewQuestionsCorrect,
            currentNodeQuestionsCorrect
        });
    };

    const resetQuiz = () => {
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setAnswers([]);
        setShowResults(false);
        setShowFeedback(false);
        setTimeLeft(30);
        setStreakCount(0);
        setQuizStats({ 
            score: 0, 
            streak: 0, 
            perfectAnswers: 0, 
            timeBonus: 0, 
            totalPoints: 0,
            reviewQuestionsCorrect: 0,
            currentNodeQuestionsCorrect: 0
        });
        
        // Regenerate questions
        const completedNodes = getCompletedNodes(courseId);
        const questions = generateQuizQuestions(courseId, nodeId, completedNodes);
        setQuizQuestions(questions);
    };

    const getScoreColor = () => {
        const percentage = (quizStats.score / quizQuestions.length) * 100;
        if (percentage >= 90) return 'text-green-600';
        if (percentage >= 70) return 'text-yellow-600';
        if (percentage >= 50) return 'text-orange-600';
        return 'text-red-600';
    };

    if (quizQuestions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background-primary)' }}>
                <div className="card text-center">
                    <div className="animate-spin text-4xl mb-4">🧩</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Quiz...</h2>
                    <p className="text-gray-600">Preparing your questions</p>
                </div>
            </div>
        );
    }

    if (showResults) {
        return (
            <div className="min-h-screen p-6" style={{ background: 'var(--background-primary)' }}>
                <div className="max-w-2xl mx-auto">
                    <div className="card text-center">
                        <div className="text-6xl mb-6">🎉</div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Complete!</h1>
                        
                        <div className="mb-8">
                            <div className={`text-4xl font-bold mb-2 ${getScoreColor()}`}>
                                {quizStats.score}/{quizQuestions.length}
                            </div>
                            <div className="text-lg text-gray-600">
                                {Math.round((quizStats.score / quizQuestions.length) * 100)}% Score
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-2xl mb-2">🔥</div>
                                <div className="text-sm text-gray-600">Best Streak</div>
                                <div className="text-xl font-bold text-blue-600">{quizStats.streak}</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <div className="text-2xl mb-2">⭐</div>
                                <div className="text-sm text-gray-600">Total Points</div>
                                <div className="text-xl font-bold text-green-600">{quizStats.totalPoints}</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button 
                                onClick={resetQuiz}
                                className="btn btn-primary w-full"
                            >
                                🔄 Retake Quiz
                            </button>
                            <button 
                                onClick={() => router.push('/dashboard')}
                                className="btn btn-secondary w-full"
                            >
                                🏠 Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentQ = quizQuestions[currentQuestion];

    return (
        <div className="min-h-screen p-6" style={{ background: 'var(--background-primary)' }}>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="card mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">🧩 {nodeName} Quiz</h1>
                            <p className="text-gray-600">Question {currentQuestion + 1} of {quizQuestions.length}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-red-600 mb-1">{timeLeft}s</div>
                            <div className="text-sm text-gray-600">Time Left</div>
                        </div>
                    </div>
                    
                    <ProgressBar 
                        current={currentQuestion + 1} 
                        total={quizQuestions.length} 
                        color="blue"
                    />
                </div>

                {/* Question Card */}
                <div className="card mb-6">
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                currentQ.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                currentQ.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                                {currentQ.difficulty.charAt(0).toUpperCase() + currentQ.difficulty.slice(1)}
                            </span>
                            <span className="text-sm text-gray-600">⭐ {currentQ.points} points</span>
                        </div>
                        
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">{currentQ.question}</h2>
                    </div>

                    {/* Answer Options */}
                    <div className="space-y-3">
                        {currentQ.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(index)}
                                disabled={showFeedback}
                                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                                    selectedAnswer === index
                                        ? showFeedback
                                            ? isCorrect
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-red-500 bg-red-50'
                                            : 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                } ${showFeedback ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                                <div className="flex items-center">
                                    <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium mr-3 ${
                                        selectedAnswer === index
                                            ? showFeedback
                                                ? isCorrect
                                                    ? 'border-green-500 bg-green-500 text-white'
                                                    : 'border-red-500 bg-red-500 text-white'
                                                : 'border-blue-500 bg-blue-500 text-white'
                                            : 'border-gray-300 text-gray-600'
                                    }">
                                        {String.fromCharCode(65 + index)}
                                    </span>
                                    <span className="text-gray-900">{option}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Feedback */}
                    {showFeedback && (
                        <div className={`mt-6 p-4 rounded-lg ${
                            isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}>
                            <div className="flex items-center mb-2">
                                <span className="text-2xl mr-2">{isCorrect ? '✅' : '❌'}</span>
                                <span className={`font-semibold ${
                                    isCorrect ? 'text-green-800' : 'text-red-800'
                                }`}>
                                    {isCorrect ? 'Correct!' : 'Incorrect'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="btn btn-secondary"
                    >
                        🏠 Exit Quiz
                    </button>
                    
                    {!showFeedback && (
                        <button
                            onClick={handleAnswerSubmit}
                            disabled={selectedAnswer === null}
                            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {currentQuestion === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
