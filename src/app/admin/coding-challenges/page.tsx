"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

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
  is_active: boolean;
  created_at: string;
  created_by_username: string;
  test_cases_count: number;
  submissions_count: number;
}

interface TestCase {
  input_data: Record<string, unknown>;
  expected_output: string;
  is_sample: boolean;
  is_hidden: boolean;
  weight: number;
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', color: 'bg-green-100 text-green-800' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'hard', label: 'Hard', color: 'bg-red-100 text-red-800' }
];

const LANGUAGE_OPTIONS = [
  'python', 'javascript', 'java', 'cpp', 'c', 'typescript', 'go', 'rust'
];

export default function AdminCodingChallengesPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<CodingChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<CodingChallenge | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problem_statement: '',
    difficulty: 'easy' as const,
    points_easy: 10,
    points_intermediate: 20,
    points_hard: 50,
    time_limit: 300,
    memory_limit: 256,
    supported_languages: ['python'],
    function_signature: {} as Record<string, string>,
    constraints: '',
    examples: [{ input: '', output: '', explanation: '' }],
    hints: '',
    tags: [''],
    is_active: true
  });

  const [testCases, setTestCases] = useState<TestCase[]>([
    { input_data: {}, expected_output: '', is_sample: true, is_hidden: false, weight: 1.0 }
  ]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchChallenges();
    }
  }, [user, currentPage, searchTerm, filterDifficulty]);

  const fetchChallenges = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(filterDifficulty && { difficulty: filterDifficulty })
      });

      const response = await fetch(`/api/admin/coding-challenges?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setChallenges(data.challenges);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const url = selectedChallenge 
        ? `/api/admin/coding-challenges/${selectedChallenge.id}` 
        : '/api/admin/coding-challenges';
      
      const method = selectedChallenge ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        examples: formData.examples.filter(ex => ex.input && ex.output),
        tags: formData.tags.filter(tag => tag.trim()),
        test_cases: testCases.filter(tc => tc.expected_output)
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowModal(false);
        resetForm();
        fetchChallenges();
      } else {
        const error = await response.json();
        alert(error.error || 'Error saving challenge');
      }
    } catch (error) {
      console.error('Error saving challenge:', error);
      alert('Error saving challenge');
    }
  };

  const handleDelete = async (challengeId: number) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/coding-challenges/${challengeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        fetchChallenges();
      } else {
        alert('Error deleting challenge');
      }
    } catch (error) {
      console.error('Error deleting challenge:', error);
      alert('Error deleting challenge');
    }
  };

  const handleEdit = async (challenge: CodingChallenge) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/coding-challenges/${challenge.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const fullChallenge = await response.json();
        setSelectedChallenge(fullChallenge);
        setFormData({
          title: fullChallenge.title,
          description: fullChallenge.description,
          problem_statement: fullChallenge.problem_statement,
          difficulty: fullChallenge.difficulty,
          points_easy: fullChallenge.points_easy,
          points_intermediate: fullChallenge.points_intermediate,
          points_hard: fullChallenge.points_hard,
          time_limit: fullChallenge.time_limit,
          memory_limit: fullChallenge.memory_limit,
          supported_languages: fullChallenge.supported_languages,
          function_signature: fullChallenge.function_signature,
          constraints: fullChallenge.constraints,
          examples: fullChallenge.examples.length > 0 ? fullChallenge.examples : [{ input: '', output: '', explanation: '' }],
          hints: fullChallenge.hints,
          tags: fullChallenge.tags.length > 0 ? fullChallenge.tags : [''],
          is_active: fullChallenge.is_active
        });
        setTestCases(fullChallenge.test_cases.length > 0 ? fullChallenge.test_cases : [
          { input_data: {}, expected_output: '', is_sample: true, is_hidden: false, weight: 1.0 }
        ]);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error fetching challenge details:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      problem_statement: '',
      difficulty: 'easy',
      points_easy: 10,
      points_intermediate: 20,
      points_hard: 50,
      time_limit: 300,
      memory_limit: 256,
      supported_languages: ['python'],
      function_signature: {},
      constraints: '',
      examples: [{ input: '', output: '', explanation: '' }],
      hints: '',
      tags: [''],
      is_active: true
    });
    setTestCases([
      { input_data: {}, expected_output: '', is_sample: true, is_hidden: false, weight: 1.0 }
    ]);
    setSelectedChallenge(null);
  };

  const addExample = () => {
    setFormData(prev => ({
      ...prev,
      examples: [...prev.examples, { input: '', output: '', explanation: '' }]
    }));
  };

  const updateExample = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.map((ex, i) => 
        i === index ? { ...ex, [field]: value } : ex
      )
    }));
  };

  const removeExample = (index: number) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index)
    }));
  };

  const addTestCase = () => {
    setTestCases(prev => [...prev, { 
      input_data: {}, 
      expected_output: '', 
      is_sample: false, 
      is_hidden: true, 
      weight: 1.0 
    }]);
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: any) => {
    setTestCases(prev => prev.map((tc, i) => 
      i === index ? { ...tc, [field]: value } : tc
    ));
  };

  const removeTestCase = (index: number) => {
    setTestCases(prev => prev.filter((_, i) => i !== index));
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen md:ml-64 p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:ml-64 p-6" style={{ background: 'var(--background-primary)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">🖥️ Coding Challenges Management</h1>
          
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search challenges..."
                className="w-full px-4 py-2 border rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border rounded-lg"
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
            >
              <option value="">All Difficulties</option>
              {DIFFICULTY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Challenge
            </button>
          </div>
        </div>

        {/* Challenges List */}
        {loading ? (
          <div className="text-center py-8">Loading challenges...</div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Languages</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Cases</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submissions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {challenges.map((challenge) => (
                    <tr key={challenge.id}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{challenge.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {challenge.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          DIFFICULTY_OPTIONS.find(d => d.value === challenge.difficulty)?.color
                        }`}>
                          {DIFFICULTY_OPTIONS.find(d => d.value === challenge.difficulty)?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {challenge.supported_languages.slice(0, 3).map(lang => (
                            <span key={lang} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {lang}
                            </span>
                          ))}
                          {challenge.supported_languages.length > 3 && (
                            <span className="text-xs text-gray-500">+{challenge.supported_languages.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{challenge.test_cases_count}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{challenge.submissions_count}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          challenge.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {challenge.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(challenge)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(challenge.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal for Create/Edit Challenge */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">
                    {selectedChallenge ? 'Edit Challenge' : 'Create New Challenge'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Title *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border rounded-lg"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Description *</label>
                      <textarea
                        required
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Difficulty *</label>
                      <select
                        required
                        className="w-full px-3 py-2 border rounded-lg"
                        value={formData.difficulty}
                        onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                      >
                        {DIFFICULTY_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">Easy Points</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full px-3 py-2 border rounded-lg"
                          value={formData.points_easy}
                          onChange={(e) => setFormData(prev => ({ ...prev, points_easy: parseInt(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Intermediate Points</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full px-3 py-2 border rounded-lg"
                          value={formData.points_intermediate}
                          onChange={(e) => setFormData(prev => ({ ...prev, points_intermediate: parseInt(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Hard Points</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full px-3 py-2 border rounded-lg"
                          value={formData.points_hard}
                          onChange={(e) => setFormData(prev => ({ ...prev, points_hard: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Time Limit (seconds)</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full px-3 py-2 border rounded-lg"
                          value={formData.time_limit}
                          onChange={(e) => setFormData(prev => ({ ...prev, time_limit: parseInt(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Memory Limit (MB)</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full px-3 py-2 border rounded-lg"
                          value={formData.memory_limit}
                          onChange={(e) => setFormData(prev => ({ ...prev, memory_limit: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Supported Languages *</label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                        {LANGUAGE_OPTIONS.map(lang => (
                          <label key={lang} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.supported_languages.includes(lang)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    supported_languages: [...prev.supported_languages, lang]
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    supported_languages: prev.supported_languages.filter(l => l !== lang)
                                  }));
                                }
                              }}
                              className="mr-2"
                            />
                            {lang}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Content</h3>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Problem Statement *</label>
                      <textarea
                        required
                        rows={6}
                        className="w-full px-3 py-2 border rounded-lg"
                        value={formData.problem_statement}
                        onChange={(e) => setFormData(prev => ({ ...prev, problem_statement: e.target.value }))}
                        placeholder="Describe the problem in detail..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Constraints</label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg"
                        value={formData.constraints}
                        onChange={(e) => setFormData(prev => ({ ...prev, constraints: e.target.value }))}
                        placeholder="Input constraints and limits..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Hints</label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg"
                        value={formData.hints}
                        onChange={(e) => setFormData(prev => ({ ...prev, hints: e.target.value }))}
                        placeholder="Helpful hints for solving the problem..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Tags</label>
                      <div className="space-y-2">
                        {formData.tags.map((tag, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              className="flex-1 px-3 py-2 border rounded-lg"
                              value={tag}
                              onChange={(e) => {
                                const newTags = [...formData.tags];
                                newTags[index] = e.target.value;
                                setFormData(prev => ({ ...prev, tags: newTags }));
                              }}
                              placeholder="Tag name"
                            />
                            {formData.tags.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newTags = formData.tags.filter((_, i) => i !== index);
                                  setFormData(prev => ({ ...prev, tags: newTags }));
                                }}
                                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, tags: [...prev.tags, ''] }))}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          + Add Tag
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="mr-2"
                        />
                        Active (visible to students)
                      </label>
                    </div>
                  </div>
                </div>

                {/* Examples Section */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Examples</h3>
                  <div className="space-y-4">
                    {formData.examples.map((example, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">Example {index + 1}</h4>
                          {formData.examples.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeExample(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Input</label>
                            <textarea
                              rows={3}
                              className="w-full px-3 py-2 border rounded-lg"
                              value={example.input}
                              onChange={(e) => updateExample(index, 'input', e.target.value)}
                              placeholder="Input data"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Output</label>
                            <textarea
                              rows={3}
                              className="w-full px-3 py-2 border rounded-lg"
                              value={example.output}
                              onChange={(e) => updateExample(index, 'output', e.target.value)}
                              placeholder="Expected output"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Explanation (optional)</label>
                            <textarea
                              rows={3}
                              className="w-full px-3 py-2 border rounded-lg"
                              value={example.explanation}
                              onChange={(e) => updateExample(index, 'explanation', e.target.value)}
                              placeholder="Explanation of the example"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addExample}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      + Add Example
                    </button>
                  </div>
                </div>

                {/* Test Cases Section */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Test Cases</h3>
                  <div className="space-y-4">
                    {testCases.map((testCase, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">Test Case {index + 1}</h4>
                          {testCases.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTestCase(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Input Data (JSON)</label>
                            <textarea
                              rows={3}
                              className="w-full px-3 py-2 border rounded-lg"
                              value={JSON.stringify(testCase.input_data, null, 2)}
                              onChange={(e) => {
                                try {
                                  const parsed = JSON.parse(e.target.value);
                                  updateTestCase(index, 'input_data', parsed);
                                } catch {
                                  // Invalid JSON, keep the text as is for now
                                }
                              }}
                              placeholder='{"input": "value"}'
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Expected Output</label>
                            <textarea
                              rows={3}
                              className="w-full px-3 py-2 border rounded-lg"
                              value={testCase.expected_output}
                              onChange={(e) => updateTestCase(index, 'expected_output', e.target.value)}
                              placeholder="Expected output"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Weight</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              max="10"
                              className="w-full px-3 py-2 border rounded-lg"
                              value={testCase.weight}
                              onChange={(e) => updateTestCase(index, 'weight', parseFloat(e.target.value))}
                            />
                          </div>
                          <div>
                            <label className="flex items-center mt-6">
                              <input
                                type="checkbox"
                                checked={testCase.is_sample}
                                onChange={(e) => updateTestCase(index, 'is_sample', e.target.checked)}
                                className="mr-2"
                              />
                              Sample (shown to students)
                            </label>
                          </div>
                          <div>
                            <label className="flex items-center mt-6">
                              <input
                                type="checkbox"
                                checked={testCase.is_hidden}
                                onChange={(e) => updateTestCase(index, 'is_hidden', e.target.checked)}
                                className="mr-2"
                              />
                              Hidden from students
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addTestCase}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      + Add Test Case
                    </button>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {selectedChallenge ? 'Update Challenge' : 'Create Challenge'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 