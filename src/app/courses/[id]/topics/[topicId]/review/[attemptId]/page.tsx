'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface QuizQuestion {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: number;
  points: number;
  difficulty: string;
  subject_id: number;
  node_id: string;
}

interface QuizReviewResult {
  question: QuizQuestion;
  userAnswer: number | null;
  isCorrect: boolean;
  pointsEarned: number;
  timeTaken: number | null;
  correctAnswer: number;
  options: string[];
}

interface QuizAttempt {
  id: number;
  user_id: number;
  subject_id: number;
  node_id: string;
  questions_total: number;
  questions_correct: number;
  score_percentage: number;
  points_earned: number;
  time_taken: number | null;
  completed_at: string;
}

interface QuizReviewData {
  attempt: QuizAttempt;
  results: QuizReviewResult[];
  summary: {
    totalQuestions: number;
    correctAnswers: number;
    scorePercentage: number;
    pointsEarned: number;
    timeTaken: number | null;
  };
}

export default function QuizReview({ params }: { params: { id: string; topicId: string; attemptId: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [reviewData, setReviewData] = useState<QuizReviewData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchReviewData();
    }
  }, [user]);

  const fetchReviewData = async () => {
    try {
      const response = await fetch(`/api/quiz/review/${params.attemptId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch review data');
      }

      const data = await response.json();
      setReviewData(data);
    } catch (error) {
      console.error('Error fetching review data:', error);
      setError('Failed to load quiz review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (reviewData && currentQuestionIndex < reviewData.results.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleBackToTopic = () => {
    router.push(`/courses/${params.id}/topics/${params.topicId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">No review data available.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = reviewData.results[currentQuestionIndex];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleBackToTopic}
          className="mb-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Topic
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Review</h1>
        
        {/* Summary Stats */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quiz Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{reviewData.summary.correctAnswers}</div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{reviewData.summary.totalQuestions}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{reviewData.summary.scorePercentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{reviewData.summary.pointsEarned}</div>
              <div className="text-sm text-gray-600">Points</div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {reviewData.results.map((result, index) => (
            <button
              key={index}
              onClick={() => goToQuestion(index)}
              className={`w-10 h-10 rounded-full border-2 font-medium transition-colors ${
                index === currentQuestionIndex
                  ? 'bg-blue-600 text-white border-blue-600'
                  : result.isCorrect
                  ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                  : 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question Review */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Question {currentQuestionIndex + 1} of {reviewData.results.length}
          </h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            currentQuestion.isCorrect
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {currentQuestion.isCorrect ? 'Correct' : 'Incorrect'}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-900 text-lg mb-4">{currentQuestion.question.question}</p>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isCorrect = index === currentQuestion.correctAnswer;
              const isSelected = index === currentQuestion.userAnswer;
              
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    isCorrect
                      ? 'bg-green-50 border-green-300'
                      : isSelected
                      ? 'bg-red-50 border-red-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                        isCorrect
                          ? 'bg-green-600 text-white'
                          : isSelected
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className={`${
                        isCorrect ? 'text-green-800' : isSelected ? 'text-red-800' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isCorrect && (
                        <span className="text-green-600 text-sm">✓ Correct</span>
                      )}
                      {isSelected && !isCorrect && (
                        <span className="text-red-600 text-sm">✗ Your answer</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{currentQuestion.pointsEarned}</div>
            <div className="text-sm text-gray-600">Points Earned</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{currentQuestion.question.points}</div>
            <div className="text-sm text-gray-600">Total Points</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 capitalize">{currentQuestion.question.difficulty}</div>
            <div className="text-sm text-gray-600">Difficulty</div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <span className="text-gray-600">
          {currentQuestionIndex + 1} of {reviewData.results.length}
        </span>
        
        <button
          onClick={handleNext}
          disabled={currentQuestionIndex === reviewData.results.length - 1}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
} 