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
    const [showExplanation, setShowExplanation] = useState(false);

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
        setShowExplanation(!!currentQ.explanation);
        
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
                setShowExplanation(false);
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
        setShowExplanation(false);
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

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'text-green-600';
            case 'medium': return 'text-yellow-600';
            case 'hard': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getScoreColor = () => {
        const percentage = (quizStats.score / quizQuestions.length) * 100;
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (quizQuestions.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🎯</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Quiz...</h2>
                    <p className="text-gray-600">Preparing questions for {nodeName}</p>
                </div>
            </div>
        );
    }

    if (showResults) {
        const currentNodeQuestions = quizQuestions.filter(q => q.nodeId === nodeId).length;
        const reviewQuestions = quizQuestions.length - currentNodeQuestions;
        
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <div className="text-6xl mb-4">🎉</div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
                        <p className="text-gray-600 mb-2">Topic: <span className="font-semibold">{nodeName}</span></p>
                        <p className="text-gray-600 mb-8">Great job! Here are your results:</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="text-3xl mb-2">📊</div>
                                <h3 className="font-semibold text-lg">Overall Score</h3>
                                <p className={`text-2xl font-bold ${getScoreColor()}`}>
                                    {quizStats.score}/{quizQuestions.length}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {Math.round((quizStats.score / quizQuestions.length) * 100)}% Correct
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="text-3xl mb-2">⭐</div>
                                <h3 className="font-semibold text-lg">Total Points</h3>
                                <p className="text-2xl font-bold text-blue-600">
                                    {quizStats.totalPoints}
                                </p>
                                <p className="text-sm text-gray-600">Points Earned</p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="text-3xl mb-2">🎯</div>
                                <h3 className="font-semibold text-lg">Current Topic</h3>
                                <p className="text-2xl font-bold text-green-600">
                                    {quizStats.currentNodeQuestionsCorrect}/{currentNodeQuestions}
                                </p>
                                <p className="text-sm text-gray-600">Questions Correct</p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="text-3xl mb-2">📚</div>
                                <h3 className="font-semibold text-lg">Review Questions</h3>
                                <p className="text-2xl font-bold text-purple-600">
                                    {quizStats.reviewQuestionsCorrect}/{reviewQuestions}
                                </p>
                                <p className="text-sm text-gray-600">From Previous Topics</p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="text-3xl mb-2">🔥</div>
                                <h3 className="font-semibold text-lg">Best Streak</h3>
                                <p className="text-2xl font-bold text-orange-600">
                                    {quizStats.streak}
                                </p>
                                <p className="text-sm text-gray-600">Consecutive Correct</p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="text-3xl mb-2">⏱️</div>
                                <h3 className="font-semibold text-lg">Time Bonus</h3>
                                <p className="text-2xl font-bold text-yellow-600">
                                    +{quizStats.timeBonus}
                                </p>
                                <p className="text-sm text-gray-600">Bonus Points</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button 
                                onClick={resetQuiz}
                                className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                            >
                                Retake Quiz
                            </button>
                            <button 
                                onClick={() => router.back()}
                                className="ml-4 bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                            >
                                Back to Course
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentQ = quizQuestions[currentQuestion];
    const isReviewQuestion = currentQ.nodeId !== nodeId;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{nodeName} Quiz</h1>
                            {isReviewQuestion && (
                                <p className="text-sm text-purple-600 font-medium">📚 Review Question from Previous Topic</p>
                            )}
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-600">
                                Current Streak: <span className="font-bold text-orange-600">{streakCount}</span>
                            </div>
                            <div className={`text-sm font-medium ${timeLeft <= 10 ? 'text-red-600' : 'text-gray-600'}`}>
                                ⏱️ {timeLeft}s
                            </div>
                        </div>
                    </div>
                    
                    <ProgressBar
                        current={currentQuestion + 1}
                        total={quizQuestions.length}
                        label="Progress"
                        color="blue"
                    />
                </div>

                {/* Question Card */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-gray-500">
                                Question {currentQuestion + 1} of {quizQuestions.length}
                            </span>
                            <div className="flex items-center space-x-2">
                                <span className={`text-sm font-medium ${getDifficultyColor(currentQ.difficulty)}`}>
                                    {currentQ.difficulty.toUpperCase()}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {currentQ.points} points
                                </span>
                                {isReviewQuestion && (
                                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                        REVIEW
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">
                            {currentQ.question}
                        </h2>
                    </div>

                    <div className="space-y-3 mb-8">
                        {currentQ.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(index)}
                                disabled={showFeedback}
                                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                                    showFeedback
                                        ? index === currentQ.correctAnswer
                                            ? 'border-green-500 bg-green-50 text-green-800'
                                            : selectedAnswer === index && index !== currentQ.correctAnswer
                                            ? 'border-red-500 bg-red-50 text-red-800'
                                            : 'border-gray-200 bg-gray-50'
                                        : selectedAnswer === index
                                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <span className="font-medium mr-3">
                                    {String.fromCharCode(65 + index)}.
                                </span>
                                {option}
                                {showFeedback && index === currentQ.correctAnswer && (
                                    <span className="float-right text-green-600">✓</span>
                                )}
                                {showFeedback && selectedAnswer === index && index !== currentQ.correctAnswer && (
                                    <span className="float-right text-red-600">✗</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {showFeedback && (
                        <div className={`p-4 rounded-lg mb-6 ${
                            isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        } border`}>
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">
                                    {isCorrect ? '🎉' : '❌'}
                                </span>
                                <div>
                                    <p className={`font-semibold ${
                                        isCorrect ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                        {isCorrect ? 'Correct!' : 'Incorrect'}
                                    </p>
                                    <p className={`text-sm ${
                                        isCorrect ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {isCorrect 
                                            ? `+${currentQ.points} points ${streakCount >= 3 ? `(+${streakCount * 2} streak bonus!)` : ''}`
                                            : `The correct answer was: ${currentQ.options[currentQ.correctAnswer]}`
                                        }
                                    </p>
                                    {showExplanation && currentQ.explanation && (
                                        <p className="text-sm text-gray-700 mt-2 p-3 bg-blue-50 rounded-lg">
                                            💡 <strong>Explanation:</strong> {currentQ.explanation}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {!showFeedback && (
                        <button
                            onClick={handleAnswerSubmit}
                            disabled={selectedAnswer === null}
                            className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                                selectedAnswer !== null
                                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            Submit Answer
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
