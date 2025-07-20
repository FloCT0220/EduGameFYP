'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getSession } from '@/lib/session';

interface CodeSnippet {
  id: string;
  code: string;
}

interface ChallengeAnswer {
  programming_language: string;
  code_snippets: CodeSnippet[];
  correct_answer: string[];
}

// Define a type for difficulty
type Difficulty = 'easy' | 'intermediate' | 'hard';

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', color: 'bg-green-100 text-green-800' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'hard', label: 'Hard', color: 'bg-red-100 text-red-800' }
];

const LANGUAGE_OPTIONS = [
  'python', 'javascript', 'java', 'cpp', 'c', 'typescript', 'go', 'rust'
];

export default function AddCodingChallenge() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'easy' as Difficulty,
    points: 10,
    supported_language: 'python',
    is_active: true
  });
  const [titleError, setTitleError] = useState('');
  const [isCheckingTitle, setIsCheckingTitle] = useState(false);
  const [titleCheckTimeout, setTitleCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Function to scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Challenge answers state
  const [challengeAnswers, setChallengeAnswers] = useState<ChallengeAnswer[]>([
    {
      programming_language: 'python',
      code_snippets: [
        { id: '1', code: 'for i in range(len(nums)):' },
        { id: '2', code: 'for j in range(i + 1, len(nums)):' },
        { id: '3', code: 'if nums[i] + nums[j] == target:' },
        { id: '4', code: 'return [i, j]' },
        { id: '5', code: 'return []' }
      ],
      correct_answer: ['1', '2', '3', '4']
    }
  ]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user?.role, router]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (titleCheckTimeout) {
        clearTimeout(titleCheckTimeout);
      }
    };
  }, [titleCheckTimeout]);

  const checkTitleAvailability = useCallback(async (title: string, language?: string) => {
    if (!title.trim()) {
      setTitleError('');
      return;
    }

    setIsCheckingTitle(true);
    try {
      const token = getSession('authToken');
      const response = await fetch('/api/admin/coding-challenges', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Check if data is an array, if not, try to access the challenges property
        const challenges = Array.isArray(data) ? data : (data.challenges || []);
        
        if (Array.isArray(challenges)) {
          const currentLanguage = language || formData.supported_language;
          const existingChallenge = challenges.find((challenge: { 
            id: number; 
            title: string; 
            supported_language?: string 
          }) => 
            challenge.title.toLowerCase() === title.toLowerCase() &&
            challenge.supported_language === currentLanguage
          );
          
          if (existingChallenge) {
            setTitleError(`A challenge with this title and language (${currentLanguage}) already exists`);
          } else {
            setTitleError('');
          }
        } else {
          console.error('Unexpected response format:', data);
          setTitleError('');
        }
      }
    } catch (error) {
      console.error('Error checking title availability:', error);
    } finally {
      setIsCheckingTitle(false);
    }
  }, [formData.supported_language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if there are errors
    if (titleError || error) {
      setError('Please fix the errors before submitting');
      scrollToTop();
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = getSession('authToken');
      const payload = {
        ...formData,
        challenge_answers: challengeAnswers
      };

      const response = await fetch('/api/admin/coding-challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccess('Challenge created successfully!');
        setTimeout(() => {
          router.push('/admin/coding-challenges');
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error creating challenge');
        scrollToTop();
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      setError('Error creating challenge');
      scrollToTop();
    } finally {
      setIsLoading(false);
    }
  };

  const addLanguageAnswer = () => {
    setChallengeAnswers(prev => [...prev, {
      programming_language: 'javascript',
      code_snippets: [
        { id: '1', code: 'for (let i = 0; i < nums.length; i++) {' },
        { id: '2', code: 'for (let j = i + 1; j < nums.length; j++) {' },
        { id: '3', code: 'if (nums[i] + nums[j] === target) {' },
        { id: '4', code: 'return [i, j];' },
        { id: '5', code: 'return [];' }
      ],
      correct_answer: ['1', '2', '3', '4']
    }]);
  };

  const updateLanguageAnswer = (index: number, field: keyof ChallengeAnswer, value: string | string[]) => {
    setChallengeAnswers(prev => prev.map((answer, i) => 
      i === index ? { ...answer, [field]: value } : answer
    ));
  };

  const removeLanguageAnswer = (index: number) => {
    setChallengeAnswers(prev => prev.filter((_, i) => i !== index));
  };

  const addCodeSnippet = (answerIndex: number) => {
    setChallengeAnswers(prev => prev.map((answer, i) => 
      i === answerIndex ? {
        ...answer,
        code_snippets: [...answer.code_snippets, { 
          id: `${answer.code_snippets.length + 1}`, 
          code: '// New code snippet' 
        }]
      } : answer
    ));
  };

  const updateCodeSnippet = (answerIndex: number, snippetIndex: number, field: keyof CodeSnippet, value: string) => {
    setChallengeAnswers(prev => prev.map((answer, i) => 
      i === answerIndex ? {
        ...answer,
        code_snippets: answer.code_snippets.map((snippet, j) => 
          j === snippetIndex ? { ...snippet, [field]: value } : snippet
        )
      } : answer
    ));
  };

  const removeCodeSnippet = (answerIndex: number, snippetIndex: number) => {
    setChallengeAnswers(prev => prev.map((answer, i) => 
      i === answerIndex ? {
        ...answer,
        code_snippets: answer.code_snippets.filter((_, j) => j !== snippetIndex)
      } : answer
    ));
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
              <p className="text-gray-600">You need admin privileges to access this page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Add Coding Challenge</h1>
            <button
              onClick={() => router.push('/admin/coding-challenges')}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Challenges
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => {
                          setFormData({...formData, title: e.target.value});
                          // Check title availability when title changes
                          setTitleError('');
                          if (e.target.value.trim()) {
                            // Clear existing timeout
                            if (titleCheckTimeout) {
                              clearTimeout(titleCheckTimeout);
                            }
                            // Set new timeout
                            const timeoutId = setTimeout(() => checkTitleAvailability(e.target.value), 500);
                            setTitleCheckTimeout(timeoutId);
                          }
                        }}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          titleError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                        }`}
                        required
                      />
                      {isCheckingTitle && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                    {titleError && (
                      <p className="mt-1 text-sm text-red-600">{titleError}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({...formData, difficulty: e.target.value as Difficulty})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {DIFFICULTY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.points}
                      onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supported Language
                    </label>
                    <select
                      value={formData.supported_language || 'python'}
                      onChange={(e) => {
                        const newLanguage = e.target.value;
                        setFormData({...formData, supported_language: newLanguage});
                        // Re-check title availability when language changes
                        if (formData.title.trim()) {
                          setTitleError('');
                          if (titleCheckTimeout) {
                            clearTimeout(titleCheckTimeout);
                          }
                          const timeoutId = setTimeout(() => checkTitleAvailability(formData.title, newLanguage), 500);
                          setTitleCheckTimeout(timeoutId);
                        }
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {LANGUAGE_OPTIONS.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Active (visible to students)
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        formData.is_active ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Challenge Answers */}
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Challenge Answers</h2>
                  
                  {challengeAnswers.map((answer, answerIndex) => (
                    <div key={answerIndex} className="border rounded-lg p-6 bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium text-lg">Language: {answer.programming_language}</h3>
                        {challengeAnswers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLanguageAnswer(answerIndex)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-4">


                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Code Snippets
                          </label>
                          <div className="space-y-3">
                            {answer.code_snippets.map((snippet, snippetIndex) => (
                              <div key={snippetIndex} className="flex gap-3">
                                <input
                                  type="text"
                                  placeholder="Snippet ID"
                                  value={snippet.id}
                                  onChange={(e) => updateCodeSnippet(answerIndex, snippetIndex, 'id', e.target.value)}
                                  className="w-24 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Code snippet"
                                  value={snippet.code}
                                  onChange={(e) => updateCodeSnippet(answerIndex, snippetIndex, 'code', e.target.value)}
                                  className="flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {answer.code_snippets.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeCodeSnippet(answerIndex, snippetIndex)}
                                    className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addCodeSnippet(answerIndex)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              + Add Snippet
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Correct Answer (snippet IDs in order)
                          </label>
                          <input
                            type="text"
                            placeholder="1,2,3,4"
                            value={answer.correct_answer.join(',')}
                            onChange={(e) => updateLanguageAnswer(answerIndex, 'correct_answer', e.target.value.split(',').map(id => id.trim()))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addLanguageAnswer}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Add Language Answer
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => router.push('/admin/coding-challenges')}
                  className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Create Challenge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 