'use client';

import { useEffect, useState } from 'react';

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
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  is_active: boolean;
}

interface SkillTree {
  id: number;
  title: string;
  subject_id: number;
}

// Define a type for difficulty
type Difficulty = 'easy' | 'medium' | 'hard';

export default function AdminQuizzes() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [skillTrees, setSkillTrees] = useState<SkillTree[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [formData, setFormData] = useState({
    question_id: '',
    subject_id: '',
    node_id: '',
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 0,
    points: 10,
    difficulty: 'easy' as Difficulty,
    explanation: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [questionsResponse, skillTreesResponse] = await Promise.all([
        fetch('/api/quiz/questions'),
        fetch('/api/subjects/skill-trees')
      ]);
      
      const questionsData = await questionsResponse.json();
      const skillTreesData = await skillTreesResponse.json();
      
      setQuestions(questionsData);
      setSkillTrees(skillTreesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingQuestion 
        ? `/api/quiz/questions/${editingQuestion.id}`
        : '/api/quiz/questions';
      
      const method = editingQuestion ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          subject_id: parseInt(formData.subject_id),
          correct_answer: parseInt(formData.correct_answer.toString()),
          points: parseInt(formData.points.toString())
        })
      });

      if (response.ok) {
        setShowForm(false);
        setEditingQuestion(null);
        setFormData({
          question_id: '',
          subject_id: '',
          node_id: '',
          question: '',
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_answer: 0,
          points: 10,
          difficulty: 'easy',
          explanation: ''
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error saving question:', error);
    }
  };

  const handleEdit = (question: QuizQuestion) => {
    setEditingQuestion(question);
    setFormData({
      question_id: question.question_id,
      subject_id: question.subject_id.toString(),
      node_id: question.node_id,
      question: question.question,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_answer: question.correct_answer,
      points: question.points,
      difficulty: question.difficulty as Difficulty,
      explanation: question.explanation
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      const response = await fetch(`/api/quiz/questions/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Manage Quiz Questions</h1>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Question
            </button>
          </div>

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">
                  {editingQuestion ? 'Edit Question' : 'Add Question'}
                </h2>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question ID
                      </label>
                      <input
                        type="text"
                        value={formData.question_id}
                        onChange={(e) => setFormData({...formData, question_id: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Skill Tree
                      </label>
                      <select
                        value={formData.subject_id}
                        onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      >
                        <option value="">Select Skill Tree</option>
                        {skillTrees.map((tree) => (
                          <option key={tree.id} value={tree.id}>
                            {tree.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Node ID
                      </label>
                      <input
                        type="text"
                        value={formData.node_id}
                        onChange={(e) => setFormData({...formData, node_id: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Difficulty
                      </label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData({...formData, difficulty: e.target.value as Difficulty})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Points
                      </label>
                      <input
                        type="number"
                        value={formData.points}
                        onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        min="1"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Correct Answer
                      </label>
                      <select
                        value={formData.correct_answer}
                        onChange={(e) => setFormData({...formData, correct_answer: parseInt(e.target.value)})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      >
                        <option value={0}>Option A</option>
                        <option value={1}>Option B</option>
                        <option value={2}>Option C</option>
                        <option value={3}>Option D</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question
                    </label>
                    <textarea
                      value={formData.question}
                      onChange={(e) => setFormData({...formData, question: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Option A
                      </label>
                      <input
                        type="text"
                        value={formData.option_a}
                        onChange={(e) => setFormData({...formData, option_a: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Option B
                      </label>
                      <input
                        type="text"
                        value={formData.option_b}
                        onChange={(e) => setFormData({...formData, option_b: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Option C
                      </label>
                      <input
                        type="text"
                        value={formData.option_c}
                        onChange={(e) => setFormData({...formData, option_c: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Option D
                      </label>
                      <input
                        type="text"
                        value={formData.option_d}
                        onChange={(e) => setFormData({...formData, option_d: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Explanation
                    </label>
                    <textarea
                      value={formData.explanation}
                      onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingQuestion(null);
                        setFormData({
                          question_id: '',
                          subject_id: '',
                          node_id: '',
                          question: '',
                          option_a: '',
                          option_b: '',
                          option_c: '',
                          option_d: '',
                          correct_answer: 0,
                          points: 10,
                          difficulty: 'easy',
                          explanation: ''
                        });
                      }}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingQuestion ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Questions List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skill Tree
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {questions.map((question) => (
                    <tr key={question.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {question.question.substring(0, 100)}...
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {question.question_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {skillTrees.find(tree => tree.id === question.subject_id)?.title || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {question.points}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          question.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {question.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(question)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(question.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 