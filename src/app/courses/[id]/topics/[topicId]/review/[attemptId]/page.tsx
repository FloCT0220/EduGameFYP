'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaClock, FaTrophy, FaArrowLeft, FaCheck, FaTimes, FaSpinner, FaLightbulb, FaRedo } from 'react-icons/fa';
import toast from 'react-hot-toast';

// Mock user context
const useUser = () => {
    return { user: { id: 1, username: 'student' } };
};

interface QuizAttempt {
    id: number;
    user_id: number;
    subject_id: number;
    node_id: string;
    questions_total: number;
    questions_correct: number;
    score_percentage: number;
    points_earned: number;
    time_bonus: number;
    streak_bonus: number;
    total_points: number;
    time_taken: number;
    completed_at: string;
}

interface QuizAnswer {
    id: number;
    attempt_id: number;
    question_id: string;
    selected_answer: number | null;
    is_correct: boolean;
    points_earned: number;
    time_taken: number;
}

interface QuizQuestion {
    id: number;
    question_id: string;
    subject_id: number;
    node_id: string;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: number;
    points: number;
    difficulty: string;
    explanation: string;
}

interface QuizReviewData {
    attempt: QuizAttempt;
    answers: QuizAnswer[];
    questions: QuizQuestion[];
    topic: {
        id: number;
        title: string;
    };
}

export default function QuizReviewPage() {
    const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const courseId = params.id as string;
    const topicId = params.topicId as string;
    const attemptId = params.attemptId as string;

    const [reviewData, setReviewData] = useState<QuizReviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(0);

    useEffect(() => {
        if (courseId && topicId && attemptId && user?.id) {
            fetchReviewData();
        }
    }, [courseId, topicId, attemptId, user?.id]);

    const fetchReviewData = async () => {
        try {
            const response = await fetch(`/api/quiz/review/${attemptId}?userId=${user?.id}&courseId=${courseId}&topicId=${topicId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setReviewData(data.reviewData);
                } else {
                    toast.error(data.error || 'Failed to load quiz review');
                    router.push(`/courses/${courseId}/topics/${topicId}`);
                }
            } else {
                toast.error('Quiz attempt not found');
                router.push(`/courses/${courseId}/topics/${topicId}`);
            }
        } catch (error) {
            console.error('Error fetching review data:', error);
            toast.error('Error loading quiz review');
            router.push(`/courses/${courseId}/topics/${topicId}`);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToTopic = () => {
        router.push(`/courses/${courseId}/topics/${topicId}`);
    };

    const handleRetakeQuiz = () => {
        router.push(`/courses/${courseId}/topics/${topicId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600">Loading quiz review...</p>
                </div>
            </div>
        );
    }

    if (!reviewData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Review Not Available</h2>
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

    const { attempt, answers, questions, topic } = reviewData;
    const currentQuestionData = questions[currentQuestion];
    const currentAnswer = answers.find(a => a.question_id === currentQuestionData.question_id);

    const getOptionLetter = (index: number) => String.fromCharCode(65 + index);

    const renderOption = (option: string, index: number) => {
        const isSelected = currentAnswer?.selected_answer === index;
        const isCorrect = currentQuestionData.correct_answer === index;
        const isUserWrong = isSelected && !isCorrect;

        let optionClasses = 'w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ';
        
        if (isCorrect) {
            optionClasses += 'border-green-500 bg-green-50 text-green-900';
        } else if (isUserWrong) {
            optionClasses += 'border-red-500 bg-red-50 text-red-900';
        } else if (isSelected) {
            optionClasses += 'border-blue-500 bg-blue-50 text-blue-900';
        } else {
            optionClasses += 'border-gray-200 bg-white text-gray-700';
        }

        return (
            <div key={index} className={optionClasses}>
                <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                        isCorrect 
                            ? 'border-green-500 bg-green-500' 
                            : isUserWrong
                            ? 'border-red-500 bg-red-500'
                            : isSelected
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                    }`}>
                        {isCorrect ? (
                            <FaCheck className="text-white text-xs" />
                        ) : isUserWrong ? (
                            <FaTimes className="text-white text-xs" />
                        ) : isSelected ? (
                            <FaCheck className="text-white text-xs" />
                        ) : null}
                    </div>
                    <span className="font-medium">{getOptionLetter(index)}.</span>
                    <span className="ml-2">{option}</span>
                    {isCorrect && (
                        <FaCheck className="ml-auto text-green-600" />
                    )}
                    {isUserWrong && (
                        <FaTimes className="ml-auto text-red-600" />
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <button
                        onClick={handleBackToTopic}
                        className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2 font-medium transition-colors"
                    >
                        <FaArrowLeft />
                        Back to Topic
                    </button>
                    
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">📝 Quiz Review</h1>
                            <p className="text-lg text-gray-600">{topic.title}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                                <div className="flex items-center gap-1">
                                    <FaClock />
                                    <span>Completed: {new Date(attempt.completed_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <FaTrophy />
                                    <span>{attempt.total_points} points earned</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className={`text-center p-4 rounded-lg ${
                            attempt.score_percentage >= 80 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-red-50 border border-red-200'
                        }`}>
                            <div className={`text-3xl font-bold mb-1 ${
                                attempt.score_percentage >= 80 ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {attempt.score_percentage}%
                            </div>
                            <div className="text-sm text-gray-600">
                                {attempt.questions_correct}/{attempt.questions_total} Correct
                            </div>
                            <div className={`text-xs font-medium mt-1 ${
                                attempt.score_percentage >= 80 ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {attempt.score_percentage >= 80 ? 'PASSED' : 'FAILED'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Question Navigation */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Question {currentQuestion + 1} of {questions.length}
                        </h2>
                        <div className="flex gap-2">
                            {questions.map((_, index) => {
                                const answer = answers.find(a => a.question_id === questions[index].question_id);
                                const isCorrect = answer?.is_correct;
                                
                                return (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentQuestion(index)}
                                        className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${
                                            index === currentQuestion
                                                ? 'bg-blue-600 text-white scale-110'
                                                : isCorrect
                                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                                        }`}
                                    >
                                        {index + 1}
                                    </button>
                                );
                            })}
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

                {/* Current Question */}
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
                            <span className={`text-sm font-medium px-2 py-1 rounded ${
                                currentAnswer?.is_correct 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                            }`}>
                                {currentAnswer?.is_correct ? 'Correct' : 'Incorrect'}
                            </span>
                        </div>
                        
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">
                            {currentQuestionData.question}
                        </h3>
                    </div>

                    {/* Options */}
                    <div className="space-y-3 mb-6">
                        {[
                            currentQuestionData.option_a,
                            currentQuestionData.option_b,
                            currentQuestionData.option_c,
                            currentQuestionData.option_d
                        ].map((option, index) => renderOption(option, index))}
                    </div>

                    {/* Explanation */}
                    {currentQuestionData.explanation && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <FaLightbulb className="text-blue-600" />
                                <span className="font-medium text-blue-900">Explanation</span>
                            </div>
                            <p className="text-blue-800">{currentQuestionData.explanation}</p>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                            disabled={currentQuestion === 0}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        
                        <div className="flex gap-3">
                            {attempt.score_percentage < 80 && (
                                <button
                                    onClick={handleRetakeQuiz}
                                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                                >
                                    <FaRedo />
                                    Retake Quiz
                                </button>
                            )}
                            
                            <button
                                onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                                disabled={currentQuestion === questions.length - 1}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {currentQuestion === questions.length - 1 ? 'Review Complete' : 'Next Question'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 