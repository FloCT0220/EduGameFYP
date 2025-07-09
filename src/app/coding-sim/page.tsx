"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });



interface CodingChallenge {
  id: number;
  title: string;
  description: string;
  problem_statement: string;
  difficulty: 'easy' | 'intermediate' | 'hard';
  points_easy: number;
  points_intermediate: number;
  points_hard: number;
  time_limit: number;
  memory_limit: number;
  supported_languages: string[];
  function_signature: Record<string, string>;
  constraints: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  hints: string;
  tags: string[];
  sample_test_cases: Array<{ input_data: string | number | Array<string | number>; expected_output: string }>;
  user_submissions: Array<{
    id: number;
    language: string;
    status: string;
    score: number;
    execution_time: number;
    memory_used: number;
    test_cases_passed: number;
    test_cases_total: number;
    points_earned: number;
    submitted_at: string;
  }>;
  user_attempts: number;
  best_score: number;
  is_solved: boolean;
}

interface ChallengeListItem {
  id: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'intermediate' | 'hard';
  supported_languages: string[];
  tags: string[];
  user_attempts: number;
  best_score: number;
  is_solved: boolean;
}

const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
};

const DEFAULT_CODE: Record<string, string> = {
  python: `def solution():
    # Write your code here
    pass

# Test your solution
print(solution())`,
  javascript: `function solution() {
    // Write your code here
    return null;
}

// Test your solution
console.log(solution());`,
  java: `public class Solution {
    public static void main(String[] args) {
        Solution sol = new Solution();
        System.out.println(sol.solution());
    }
    
    public Object solution() {
        // Write your code here
        return null;
    }
}`,
  cpp: `#include <iostream>
using namespace std;

class Solution {
public:
    void solution() {
        // Write your code here
    }
};

int main() {
    Solution sol;
    sol.solution();
    return 0;
}`,
  c: `#include <stdio.h>

void solution() {
    // Write your code here
}

int main() {
    solution();
    return 0;
}`
};

export default function CodingSimPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeListItem[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<CodingChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Challenge selection filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterTags, setFilterTags] = useState('');
  const [showSolvedOnly, setShowSolvedOnly] = useState(false);
  
  // Code editor state
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const [output, setOutput] = useState('');
  
  // UI state
  const [activeTab, setActiveTab] = useState<'problem' | 'submissions'>('problem');
  const [showChallengeList, setShowChallengeList] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChallenges();
    }
  }, [user, searchTerm, filterDifficulty, filterTags, showSolvedOnly]);

  useEffect(() => {
    if (selectedChallenge && selectedChallenge.supported_languages.includes(language)) {
      const signature = selectedChallenge.function_signature[language];
      if (signature) {
        setCode(signature);
      } else {
        setCode(DEFAULT_CODE[language] || '');
      }
    } else {
      setCode(DEFAULT_CODE[language] || '');
    }
  }, [language, selectedChallenge]);

  const fetchChallenges = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(filterDifficulty && { difficulty: filterDifficulty }),
        ...(filterTags && { tags: filterTags })
      });

      const response = await fetch(`/api/coding-challenges?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        let filteredChallenges = data.challenges;
        
        if (showSolvedOnly) {
          filteredChallenges = filteredChallenges.filter((c: ChallengeListItem) => c.is_solved);
        }
        
        setChallenges(filteredChallenges);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChallengeDetails = async (challengeId: number) => {
    setChallengeLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/coding-challenges/${challengeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const challenge = await response.json();
        setSelectedChallenge(challenge);
        setShowChallengeList(false);
        setActiveTab('problem');
        setOutput('');
        
        // Set default language
        const defaultLang = challenge.supported_languages.includes('python') ? 'python' : challenge.supported_languages[0];
        setLanguage(defaultLang);
      }
    } catch (error) {
      console.error('Error fetching challenge details:', error);
    } finally {
      setChallengeLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedChallenge || !code.trim()) return;
    
    setSubmitting(true);
    setOutput('');
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/coding-challenges/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          challenge_id: selectedChallenge.id,
          language,
          source_code: code
        })
      });

      if (response.ok) {
        const result = await response.json();
        setOutput(`Execution Result:
Status: ${result.status}
Score: ${result.score}%
Test Cases: ${result.test_cases_passed}/${result.test_cases_total}
Points Earned: ${result.points_earned}

${result.message}`);
        
        // Refresh challenge details to update submission history
        fetchChallengeDetails(selectedChallenge.id);
      } else {
        const error = await response.json();
        setOutput(`Error: ${error.error || 'Submission failed'}`);
      }
    } catch (error) {
      console.error('Error submitting solution:', error);
      setOutput('Error: Failed to submit solution');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunCode = () => {
    setOutput('Running code locally...\n\nNote: This is a local simulation. Submit your solution for actual testing against all test cases.');
    
    // Simple local execution simulation
    setTimeout(() => {
      if (selectedChallenge && selectedChallenge.sample_test_cases.length > 0) {
        const sampleCase = selectedChallenge.sample_test_cases[0];
        setOutput(prev => prev + `\n\nSample Test Case:
Input: ${JSON.stringify(sampleCase.input_data, null, 2)}
Expected Output: ${sampleCase.expected_output}
Your Output: [Local execution - submit for actual results]`);
      } else {
        setOutput(prev => prev + '\n\nNo sample test cases available. Submit your solution for testing.');
      }
    }, 1000);
  };

  const formatSubmissionTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-600';
      case 'wrong_answer': return 'text-red-600';
      case 'runtime_error': return 'text-red-600';
      case 'time_limit_exceeded': return 'text-yellow-600';
      case 'memory_limit_exceeded': return 'text-yellow-600';
      case 'compilation_error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen md:ml-64 p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Please Log In</h1>
          <p className="text-gray-500">You need to be logged in to access the coding simulator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:ml-64 p-6" style={{ background: 'var(--background-primary)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">🖥️ Coding Simulator</h1>
          <p className="text-gray-600">Practice coding challenges and earn points!</p>
        </div>

        {showChallengeList ? (
          /* Challenge Selection View */
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Search challenges..."
                  className="px-4 py-2 border rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  className="px-4 py-2 border rounded-lg"
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                >
                  <option value="">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="hard">Hard</option>
                </select>
                <input
                  type="text"
                  placeholder="Filter by tags..."
                  className="px-4 py-2 border rounded-lg"
                  value={filterTags}
                  onChange={(e) => setFilterTags(e.target.value)}
                />
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showSolvedOnly}
                    onChange={(e) => setShowSolvedOnly(e.target.checked)}
                    className="mr-2"
                  />
                  Solved Only
                </label>
              </div>
            </div>

            {/* Challenges Grid */}
            {loading ? (
              <div className="text-center py-8">Loading challenges...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {challenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => fetchChallengeDetails(challenge.id)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold">{challenge.title}</h3>
                      {challenge.is_solved && (
                        <span className="text-green-600 text-xl">✓</span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {challenge.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${DIFFICULTY_COLORS[challenge.difficulty]}`}>
                        {challenge.difficulty}
                      </span>
                      <span className="text-sm text-gray-500">
                        {challenge.user_attempts} attempt{challenge.user_attempts !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {challenge.supported_languages.slice(0, 3).map(lang => (
                        <span key={lang} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {lang}
                        </span>
                      ))}
                      {challenge.supported_languages.length > 3 && (
                        <span className="text-xs text-gray-500">+{challenge.supported_languages.length - 3}</span>
                      )}
                    </div>
                    
                    {challenge.best_score > 0 && (
                      <div className="text-sm text-gray-600">
                        Best Score: {challenge.best_score}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {!loading && challenges.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No challenges found.</p>
                <p className="text-gray-400">Try adjusting your search filters.</p>
              </div>
            )}
          </div>
        ) : (
          /* Challenge Details and Code Editor View */
          challengeLoading ? (
            <div className="text-center py-8">Loading challenge...</div>
          ) : selectedChallenge && (
            <div className="space-y-6">
              {/* Back Button and Challenge Header */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowChallengeList(true)}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  ← Back to Challenges
                </button>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${DIFFICULTY_COLORS[selectedChallenge.difficulty]}`}>
                  {selectedChallenge.difficulty}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
                {/* Problem Description */}
                <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
                  {/* Tabs */}
                  <div className="flex border-b">
                    <button
                      onClick={() => setActiveTab('problem')}
                      className={`px-6 py-3 font-medium ${
                        activeTab === 'problem'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Problem
                    </button>
                    <button
                      onClick={() => setActiveTab('submissions')}
                      className={`px-6 py-3 font-medium ${
                        activeTab === 'submissions'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Submissions ({selectedChallenge.user_submissions.length})
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'problem' ? (
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-2xl font-bold mb-4">{selectedChallenge.title}</h2>
                          <p className="text-gray-600 mb-4">{selectedChallenge.description}</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-2">Problem Statement</h3>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <pre className="whitespace-pre-wrap text-sm">{selectedChallenge.problem_statement}</pre>
                          </div>
                        </div>

                        {selectedChallenge.examples.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Examples</h3>
                            {selectedChallenge.examples.map((example, index) => (
                              <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
                                <div className="font-medium mb-2">Example {index + 1}:</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="font-medium text-gray-700 mb-1">Input:</div>
                                    <pre className="bg-white p-2 rounded border">{example.input}</pre>
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-700 mb-1">Output:</div>
                                    <pre className="bg-white p-2 rounded border">{example.output}</pre>
                                  </div>
                                </div>
                                {example.explanation && (
                                  <div className="mt-3">
                                    <div className="font-medium text-gray-700 mb-1">Explanation:</div>
                                    <p className="text-sm text-gray-600">{example.explanation}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {selectedChallenge.constraints && (
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Constraints</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <pre className="whitespace-pre-wrap text-sm">{selectedChallenge.constraints}</pre>
                            </div>
                          </div>
                        )}

                        {selectedChallenge.hints && (
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Hints</h3>
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <p className="text-sm text-blue-800">{selectedChallenge.hints}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Time Limit: {selectedChallenge.time_limit}s</span>
                          <span>Memory Limit: {selectedChallenge.memory_limit}MB</span>
                          <span>Points: {selectedChallenge[`points_${selectedChallenge.difficulty}` as keyof CodingChallenge] as number}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Submission History</h3>
                        {selectedChallenge.user_submissions.length > 0 ? (
                          <div className="space-y-3">
                            {selectedChallenge.user_submissions.map((submission) => (
                              <div key={submission.id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-3">
                                    <span className={`font-medium ${getStatusColor(submission.status)}`}>
                                      {submission.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <span className="text-sm text-gray-600">{submission.language}</span>
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {formatSubmissionTime(submission.submitted_at)}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>Score: {submission.score}%</div>
                                  <div>Tests: {submission.test_cases_passed}/{submission.test_cases_total}</div>
                                  <div>Points: {submission.points_earned}</div>
                                  <div>Time: {submission.execution_time}ms</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">No submissions yet. Write your solution and submit!</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Code Editor */}
                <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
                  {/* Editor Header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-4">
                      <label className="font-medium">Language:</label>
                      <select
                        className="border rounded px-3 py-1"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                      >
                        {selectedChallenge.supported_languages.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRunCode}
                        className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                      >
                        Run
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {submitting ? 'Submitting...' : 'Submit'}
                      </button>
                    </div>
                  </div>

                  {/* Code Editor */}
                  <div className="flex-1">
                    <MonacoEditor
                      height="60%"
                      language={language === 'cpp' ? 'cpp' : language}
                      value={code}
                      onChange={(value) => setCode(value || "")}
                      theme="vs-dark"
                      options={{
                        fontSize: 14,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: 'on'
                      }}
                    />
                  </div>

                  {/* Output Panel */}
                  <div className="h-40 border-t">
                    <div className="px-4 py-2 bg-gray-50 border-b font-medium text-sm">
                      Output
                    </div>
                    <div className="h-32 overflow-y-auto p-4 bg-gray-900 text-green-200 font-mono text-sm">
                      {output || "Output will appear here..."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
} 