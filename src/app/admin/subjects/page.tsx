'use client';

import { useEffect, useState } from 'react';

interface Course {
  id: number;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  thumbnail_url: string | null;
  is_active: boolean;
  enrolled_count: number;
}

// Define a type for difficulty
type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export default function AdminSubjects() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'beginner' as Difficulty,
    category: '',
    thumbnail_url: '',
    is_published: false
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/subjects');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setCourses(data);
      } else {
        console.error('Unexpected API response structure:', data);
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCourse 
        ? `/api/admin/subjects/${editingCourse.id}`
        : '/api/admin/subjects';
      
      const method = editingCourse ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowForm(false);
        setEditingCourse(null);
        setFormData({
          title: '',
          description: '',
          difficulty: 'beginner',
          category: '',
          thumbnail_url: '',
          is_published: false
        });
        fetchCourses();
      }
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      difficulty: course.difficulty as Difficulty,
      category: course.category,
      thumbnail_url: course.thumbnail_url || '',
      is_published: course.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    
    try {
      const response = await fetch(`/api/admin/subjects/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchCourses();
      }
    } catch (error) {
      console.error('Error deleting course:', error);
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
            <h1 className="text-3xl font-bold text-gray-900">Manage Courses</h1>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Course
            </button>
          </div>

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">
                  {editingCourse ? 'Edit Course' : 'Add Course'}
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
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="e.g., Programming, Web Development"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thumbnail URL
                      </label>
                      <input
                        type="url"
                        value={formData.thumbnail_url || ''}
                        onChange={(e) => setFormData({...formData, thumbnail_url: e.target.value || ''})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Published
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, is_published: !formData.is_published})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          formData.is_published ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.is_published ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingCourse(null);
                        setFormData({
                          title: '',
                          description: '',
                          difficulty: 'beginner',
                          category: '',
                          thumbnail_url: '',
                          is_published: false
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
                      {editingCourse ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow-md p-6">
                                 <div className="flex justify-between items-start mb-4">
                   <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
                   <div className="flex space-x-2">
                     <button
                       onClick={() => window.location.href = `/admin/subjects/${course.id}/nodes`}
                       className="text-purple-600 hover:text-purple-800 text-sm"
                     >
                       Topics
                     </button>
                     <button
                       onClick={() => handleEdit(course)}
                       className="text-blue-600 hover:text-blue-800"
                     >
                       Edit
                     </button>
                     <button
                       onClick={() => handleDelete(course.id)}
                       className="text-red-600 hover:text-red-800"
                     >
                       Delete
                     </button>
                   </div>
                 </div>
                
                <p className="text-gray-600 mb-3">{course.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Difficulty:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      course.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                      course.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category:</span>
                    <span className="text-gray-900">{course.category}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Enrolled:</span>
                    <span className="text-gray-900">{course.enrolled_count} students</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      course.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {course.is_active ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                
                {course.thumbnail_url && (
                  <div className="mt-4">
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {courses.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No courses found</div>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create your first course
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 