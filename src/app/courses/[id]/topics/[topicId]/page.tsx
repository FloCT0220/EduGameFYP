'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaClock, FaTrophy, FaArrowLeft, FaCheck, FaSpinner } from 'react-icons/fa';
import { getSession } from '@/lib/session';
import toast from 'react-hot-toast';

// Mock user context
const useUser = () => {
    return { user: { id: 1, username: 'student' } };
};

interface Topic {
    id: number;
    title: string;
    content: string;
    lesson_order: number;
    points_reward: number;
    duration_minutes: number;
    is_completed: boolean;
    last_attempt_id?: number;
    points_earned?: number;
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

export default function TopicContentPage() {
    const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const courseId = params.id as string;
    const topicId = params.topicId as string;

    const [topic, setTopic] = useState<Topic | null>(null);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [showQuiz, setShowQuiz] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<QuizAnswer[]>([]);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [submittingQuiz, setSubmittingQuiz] = useState(false);
    const [quizResults, setQuizResults] = useState<{
        score: number;
        totalQuestions: number;
        pointsEarned: number;
        passed: boolean;
        attemptId?: number;
    } | null>(null);

    const [readingStartTime, setReadingStartTime] = useState<number>(Date.now());

    useEffect(() => {
        if (courseId && topicId && user?.id) {
            fetchTopicContent();
            fetchQuizQuestions();
        }
    }, [courseId, topicId, user?.id]);

    const fetchTopicContent = async () => {
        try {
            const response = await fetch(`/api/courses/${courseId}/topics/${topicId}?userId=${user?.id}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setTopic(data.topic);
                    setReadingStartTime(Date.now());
                }
            } else {
                toast.error('Topic not found');
                router.push(`/courses/${courseId}`);
            }
        } catch (error) {
            console.error('Error fetching topic:', error);
            toast.error('Error loading topic content');
        } finally {
            setLoading(false);
        }
    };

    const fetchQuizQuestions = async () => {
        try {
            const response = await fetch(`/api/quiz/questions?courseId=${courseId}&topicId=${topicId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setQuestions(data.questions);
                }
            }
        } catch (error) {
            console.error('Error fetching quiz questions:', error);
        }
    };

    const handleStartQuiz = () => {
        if (questions.length === 0) {
            toast.error('No quiz questions available');
            return;
        }
        setShowQuiz(true);
        setCurrentQuestion(0);
        setAnswers([]);
        setQuizCompleted(false);
        setQuizResults(null);
    };

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
            const timeSpent = Math.floor((Date.now() - readingStartTime) / 1000 / 60); // in minutes
            
            const token = getSession('authToken');
            
            const response = await fetch(`/api/quiz/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    courseId: parseInt(courseId),
                    topicId: topicId,
                    answers: answers,
                    timeSpent: timeSpent
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setQuizResults(data.results);
                    setQuizCompleted(true);
                    
                    if (data.results.passed) {
                        toast.success(`Quiz completed! You earned ${data.results.pointsEarned} points!`);
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

    const handleBackToCourse = () => {
        router.push(`/courses/${courseId}`);
    };

    const handleRetryQuiz = () => {
        setShowQuiz(false);
        setCurrentQuestion(0);
        setAnswers([]);
        setQuizCompleted(false);
        setQuizResults(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600">Loading topic content...</p>
                </div>
            </div>
        );
    }

    if (!topic) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Topic Not Found</h2>
                    <button
                        onClick={handleBackToCourse}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Back to Course
                    </button>
                </div>
            </div>
        );
    }

    // Quiz completion screen
    if (quizCompleted && quizResults) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className={`text-6xl mb-4 ${quizResults.passed ? 'text-green-500' : 'text-red-500'}`}>
                        {quizResults.passed ? '🎉' : '😞'}
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-4">
                        {quizResults.passed ? 'Congratulations!' : 'Keep Trying!'}
                    </h2>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                            {quizResults.score}/{quizResults.totalQuestions}
                        </div>
                        <div className="text-sm text-gray-600">
                            {Math.round((quizResults.score / quizResults.totalQuestions) * 100)}% Score
                        </div>
                        {quizResults.passed && (
                            <div className="text-sm text-green-600 mt-2">
                                <FaTrophy className="inline mr-1" />
                                +{quizResults.pointsEarned} Points Earned
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-3">
                        <button
                            onClick={handleBackToCourse}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Back to Course
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
    if (showQuiz && questions.length > 0) {
        const currentQuestionData = questions[currentQuestion];
        const currentAnswer = answers.find(a => a.questionId === currentQuestionData.id);

        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                <div className="max-w-4xl mx-auto">
                    {/* Quiz Header */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-2xl font-bold text-gray-900">📝 Quiz Time!</h1>
                            <div className="text-sm text-gray-600">
                                Question {currentQuestion + 1} of {questions.length}
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Question */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    currentQuestionData.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                    currentQuestionData.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {currentQuestionData.difficulty}
                                </span>
                                <span className="text-sm text-gray-600">
                                    <FaTrophy className="inline mr-1" />
                                    {currentQuestionData.points} points
                                </span>
                            </div>
                            
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                                {currentQuestionData.question}
                            </h2>
                        </div>

                        {/* Options */}
                        <div className="space-y-3 mb-6">
                            {currentQuestionData.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswerSelect(currentQuestionData.id, index)}
                                    className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                                        currentAnswer?.selectedAnswer === index
                                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                                            currentAnswer?.selectedAnswer === index
                                                ? 'border-blue-500 bg-blue-500'
                                                : 'border-gray-300'
                                        }`}>
                                            {currentAnswer?.selectedAnswer === index && (
                                                <FaCheck className="text-white text-xs" />
                                            )}
                                        </div>
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
                                    {submittingQuiz ? (
                                        <>
                                            <FaSpinner className="animate-spin mr-2" />
                                            Submitting...
                                        </>
                                    ) : currentQuestion === questions.length - 1 ? (
                                        'Submit Quiz'
                                    ) : (
                                        'Next Question'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main content page
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <button
                        onClick={handleBackToCourse}
                        className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2 font-medium transition-colors"
                    >
                        <FaArrowLeft />
                        Back to Course
                    </button>
                    
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{topic.title}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    <FaClock />
                                    <span>{topic.duration_minutes} min read</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <FaTrophy />
                                    <span>{topic.points_reward} points</span>
                                </div>
                            </div>
                        </div>
                        
                        {topic.is_completed && (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                <FaCheck />
                                <span className="text-sm font-medium">Completed</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                    <div 
                        className="prose prose-lg max-w-none"
                        dangerouslySetInnerHTML={{ __html: topic.content }}
                    />
                </div>

                {/* Quiz Section */}
                {!topic.is_completed && (
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            🎯 Ready to Test Your Knowledge?
                        </h2>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
                            <p className="text-blue-800 text-sm mb-2">
                                <strong>📚 Cumulative Learning Quiz</strong>
                            </p>
                            <p className="text-blue-700 text-sm">
                                This quiz includes questions from this topic and all previous topics to reinforce your learning!
                            </p>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Complete the quiz to earn points and unlock the next topic in your learning journey!
                        </p>
                        
                        <div className="flex items-center justify-center gap-8 mb-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{questions.length}</div>
                                <div className="text-sm text-gray-600">Questions</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{topic.points_reward}</div>
                                <div className="text-sm text-gray-600">Points</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">80%</div>
                                <div className="text-sm text-gray-600">Pass Rate</div>
                            </div>
                        </div>
                        
                        <button
                            onClick={handleStartQuiz}
                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                        >
                            Start Quiz
                        </button>
                    </div>
                )}

                {/* Completed Topic Section */}
                {topic.is_completed && (
                    <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-xl p-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            🎉 Topic Completed!
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Great job! You&apos;ve successfully completed this topic and earned {topic.points_earned || topic.points_reward} points.
                        </p>
                        
                        <div className="flex items-center justify-center gap-8 mb-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">✅</div>
                                <div className="text-sm text-gray-600">Completed</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{topic.points_earned || topic.points_reward}</div>
                                <div className="text-sm text-gray-600">Points Earned</div>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={handleRetryQuiz}
                                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                            >
                                🔄 Retake Quiz
                            </button>
                            
                            {topic.last_attempt_id && (
                                <button
                                    onClick={() => router.push(`/courses/${courseId}/topics/${topicId}/review/${topic.last_attempt_id}`)}
                                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    📝 Review Quiz
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 