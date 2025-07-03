'use client';

import { useEffect, useState } from 'react';

interface Subject {
  id: number;
  title: string;
  description: string;
  difficulty: 'foundation' | 'intermediate' | 'advanced';
  estimated_duration: number;
  icon: string;
  color_theme: string;
  is_active: boolean;
}

// Define a type for difficulty
type Difficulty = 'foundation' | 'intermediate' | 'advanced';

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'foundation' as Difficulty,
    estimated_duration: 1,
    icon: '📚',
    color_theme: '#3B82F6'
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/admin/subjects');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setSubjects(data);
      } else {
        console.error('Unexpected API response structure:', data);
        setSubjects([]);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSubject 
        ? `/api/admin/subjects/${editingSubject.id}`
        : '/api/admin/subjects';
      
      const method = editingSubject ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowForm(false);
        setEditingSubject(null);
        setFormData({
          title: '',
          description: '',
          difficulty: 'foundation',
          estimated_duration: 1,
          icon: '📚',
          color_theme: '#3B82F6'
        });
        fetchSubjects();
      }
    } catch (error) {
      console.error('Error saving subject:', error);
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      title: subject.title,
      description: subject.description,
      difficulty: subject.difficulty as Difficulty,
      estimated_duration: subject.estimated_duration,
      icon: subject.icon,
      color_theme: subject.color_theme
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    
    try {
      const response = await fetch(`/api/admin/subjects/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchSubjects();
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
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
            <h1 className="text-3xl font-bold text-gray-900">Manage Subjects</h1>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Subject
            </button>
          </div>

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">
                  {editingSubject ? 'Edit Subject' : 'Add Subject'}
                </h2>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        rows={3}
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
                        <option value="foundation">Foundation</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Duration (hours)
                      </label>
                      <input
                        type="number"
                        value={formData.estimated_duration}
                        onChange={(e) => setFormData({...formData, estimated_duration: parseInt(e.target.value)})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        min="1"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Icon
                      </label>
                      <input
                        type="text"
                        value={formData.icon}
                        onChange={(e) => setFormData({...formData, icon: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="📚"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingSubject(null);
                        setFormData({
                          title: '',
                          description: '',
                          difficulty: 'foundation',
                          estimated_duration: 1,
                          icon: '📚',
                          color_theme: '#3B82F6'
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
                      {editingSubject ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Subjects List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
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
                  {subjects.map((subject) => (
                    <tr key={subject.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{subject.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {subject.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {subject.description.substring(0, 50)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          subject.difficulty === 'foundation' ? 'bg-green-100 text-green-800' :
                          subject.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {subject.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subject.estimated_duration}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          subject.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {subject.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(subject)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(subject.id)}
                          className="text-red-600 hover:text-red-900 mr-3"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => window.location.href = `/admin/subjects/${subject.id}/nodes`}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Manage Nodes
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