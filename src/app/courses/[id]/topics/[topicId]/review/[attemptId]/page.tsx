'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  course_id: number;
  topic_id: string;
}

interface QuizReviewResult {
  question: QuizQuestion;
  userAnswer: number | null;
  isCorrect: boolean;
  pointsEarned: number;
  correctAnswer: number;
  options: string[];
}

interface QuizAttempt {
  id: number;
  user_id: number;
  course_id: number;
  topic_id: string;
  questions_total: number;
  questions_correct: number;
  score_percentage: number;
  points_earned: number;
  total_points: number;
  started_at: string;
  completed_at: string;
}

interface QuizReviewData {
  attempt: QuizAttempt;
  results: QuizReviewResult[];
  summary: {
    totalQuestions: number;
    correctAnswers: number;
    scorePercentage: number;
    totalPoints: number;
  };
}

export default function QuizReview() {
  const params = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [reviewData, setReviewData] = useState<QuizReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviewData = useCallback(async () => {
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
  }, [params.attemptId]);

  useEffect(() => {
    if (user) {
      fetchReviewData();
    }
    }, [user, fetchReviewData]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 px-4 py-8 pl-64">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <button
          onClick={handleBackToTopic}
          className="mb-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Topic
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">📝 Quiz Review</h1>
        {/* Summary Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
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
              <div className="text-2xl font-bold text-green-600">{
                typeof reviewData.summary.scorePercentage === 'number'
                  ? reviewData.summary.scorePercentage.toFixed(1)
                  : Number(reviewData.summary.scorePercentage || 0).toFixed(1)
              }%</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{reviewData.summary.totalPoints}</div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
          </div>
        </div>
      </div>

      {/* All Questions Review */}
      <div className="max-w-4xl mx-auto space-y-8">
        {reviewData.results.map((result, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Question {index + 1} of {reviewData.results.length}
              </h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                result.isCorrect
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {result.isCorrect ? 'Correct' : 'Incorrect'}
              </div>
            </div>
            <div className="mb-6">
              <p className="text-gray-900 text-lg mb-4">{result.question.question}</p>
              <div className="space-y-3">
                {result.options.map((option, optIdx) => {
                  const isCorrect = optIdx === result.correctAnswer;
                  const isSelected = optIdx === result.userAnswer;
                  return (
                    <div
                      key={optIdx}
                      className={`p-3 rounded-lg border ${
                        isCorrect
                          ? 'bg-green-50 border-green-300'
                          : isSelected && !isCorrect
                          ? 'bg-red-50 border-red-300'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                            isCorrect
                              ? 'bg-green-600 text-white'
                              : isSelected && !isCorrect
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className={`${
                            isCorrect ? 'text-green-800 font-semibold' : isSelected && !isCorrect ? 'text-red-800 font-semibold' : 'text-gray-700'
                          }`}>
                            {option}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isCorrect && (
                            <span className="text-green-600 text-sm font-medium">✓ Correct Answer</span>
                          )}
                          {isSelected && !isCorrect && (
                            <span className="text-red-600 text-sm font-medium">✗ Your Answer</span>
                          )}
                          {!isSelected && !isCorrect && (
                            <span className="text-gray-500 text-sm">Not selected</span>
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
                <div className="text-lg font-semibold text-gray-900">{result.pointsEarned}</div>
                <div className="text-sm text-gray-600">Points Earned</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{result.question.points}</div>
                <div className="text-sm text-gray-600">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 capitalize">{result.question.difficulty}</div>
                <div className="text-sm text-gray-600">Difficulty</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 