"use client";

import { useEffect, useState, useCallback } from "react";

interface Achievement {
  id: number;
  name?: string;
  title?: string;
  description: string;
  icon_url?: string;
  icon?: string;
  points_required?: number;
  requirement_value?: number;
  category?: string;
  type?: string;
  is_active: boolean;
  created_at?: string;
}

// Define types for Category
type Category = "streak" | "points" | "completion" | "topics" | "courses" | "challenges" | "level";

export default function AdminAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon_url: "🏆",
    points_required: 0,
    category: "streak" as Category,
    is_active: true,
  });
  const [nameError, setNameError] = useState('');
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameCheckTimeout, setNameCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchAchievements = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/achievements");
      const data = await response.json();
      setAchievements(Array.isArray(data) ? data : data.achievements || []);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      setAchievements([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
    }, [fetchAchievements]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (nameCheckTimeout) {
        clearTimeout(nameCheckTimeout);
      }
    };
  }, [nameCheckTimeout]);

  const checkNameAvailability = useCallback(async (name: string) => {
    if (!name.trim()) {
      setNameError('');
      return;
    }

    setIsCheckingName(true);
    try {
      const response = await fetch('/api/admin/achievements');
      if (response.ok) {
        const achievementsData = await response.json();
        const existingAchievement = achievementsData.find((achievement: { id: number; title?: string; name?: string }) => 
          (achievement.title || achievement.name || '').toLowerCase() === name.toLowerCase() && 
          (!editingAchievement || achievement.id !== editingAchievement.id)
        );
        
        if (existingAchievement) {
          setNameError('An achievement with this name already exists');
        } else {
          setNameError('');
        }
      }
    } catch (error) {
      console.error('Error checking name availability:', error);
    } finally {
      setIsCheckingName(false);
    }
  }, [editingAchievement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if there's a name error
    if (nameError) {
      alert('Please fix the name error before submitting');
      return;
    }
    
    // Clear previous errors
    setErrors({});
    
    // Validate required fields
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    
    if (!formData.icon_url) {
      newErrors.icon_url = "Icon is required";
    }
    
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    
    if (formData.points_required < 0) {
      newErrors.points_required = "Points required must be 0 or greater";
    }
    

    
    // If there are validation errors, show them and stop submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      const url = editingAchievement
        ? `/api/admin/achievements/${editingAchievement.id}`
        : "/api/admin/achievements";
      const method = editingAchievement ? "PUT" : "POST";
      
      // Transform formData to match API expectations
      const apiData = {
        title: formData.name.trim(),
        description: formData.description.trim(),
        icon: formData.icon_url,
        type: formData.category,
        requirement_value: formData.points_required,
        is_active: formData.is_active,
      };
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });
      
      if (response.ok) {
        setShowForm(false);
        setEditingAchievement(null);
        setFormData({
          name: "",
          description: "",
          icon_url: "🏆",
          points_required: 0,
          category: "streak",
          is_active: true,
        });
        fetchAchievements();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to save achievement'}`);
      }
    } catch (error) {
      console.error("Error saving achievement:", error);
      alert("An error occurred while saving the achievement");
    }
  };

  const handleEdit = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    setFormData({
      name: achievement.title || achievement.name || '', // Handle both API formats
      description: achievement.description,
      icon_url: achievement.icon || achievement.icon_url || '🏆', // Handle both API formats
      points_required: achievement.requirement_value || achievement.points_required || 0, // Handle both API formats
      category: (achievement.type || achievement.category || 'streak') as Category, // Handle both API formats
      is_active: achievement.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this achievement?")) return;
    try {
      const response = await fetch(`/api/admin/achievements/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchAchievements();
      }
    } catch (error) {
      console.error("Error deleting achievement:", error);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Achievements</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Achievement
          </button>
        </div>
        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {editingAchievement ? "Edit Achievement" : "Add Achievement"}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => {
                          setFormData({ ...formData, name: e.target.value });
                          // Check name availability when name changes
                          setNameError('');
                          if (e.target.value.trim()) {
                            // Clear existing timeout
                            if (nameCheckTimeout) {
                              clearTimeout(nameCheckTimeout);
                            }
                            // Set new timeout
                            const timeoutId = setTimeout(() => checkNameAvailability(e.target.value), 500);
                            setNameCheckTimeout(timeoutId);
                          }
                        }}
                        className={`w-full p-2 border rounded-lg ${
                          errors.name || nameError ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      />
                      {isCheckingName && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className={`w-full p-2 border rounded-lg ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                      rows={2}
                      required
                    />
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value as Category })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="points">Points</option>
                      <option value="streak">Streak</option>
                      <option value="completion">Completion (Quizzes)</option>
                      <option value="topics">Topics</option>
                      <option value="courses">Courses</option>
                      <option value="challenges">Challenges</option>
                      <option value="level">Level</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Points Required</label>
                    <input
                      type="number"
                      value={formData.points_required || ''}
                      onChange={e => setFormData({ ...formData, points_required: parseInt(e.target.value) || 0 })}
                      className={`w-full p-2 border rounded-lg ${errors.points_required ? 'border-red-500' : 'border-gray-300'}`}
                      min={0}
                      required
                    />
                    {errors.points_required && <p className="text-red-500 text-xs mt-1">{errors.points_required}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                    <div className="grid grid-cols-8 gap-2 mb-2">
                      {['🏆','🎯','💰','🔥','📚','🎓','💻','⭐','🥇','🥈','🥉','🏅','🏵️','🎖️','🧠','📝','🚀','🎮','🧩','🔑','🔬','🧪','🕹️','🎲','🧭','🛡️','⚡','🏹','🦸','🦄','🌟','🎵','🎸','🎷','🎺','🥁','🎻','🎬','🎨','🖌️','🖼️','🎤','🎧','🎼','🎹','🧸','🪁','🪀','🛼','🛹','🏓','🏸','🏒','🏑','🏏','🥅','🏐','🏉','🏈','🏀','⚽','⚾','🥎'].map(icon => (
                        <button
                          type="button"
                          key={icon}
                          className={`text-2xl p-1 rounded-lg border-2 transition-colors ${formData.icon_url === icon ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-white hover:bg-gray-100'}`}
                          onClick={() => setFormData({ ...formData, icon_url: icon })}
                          aria-label={`Select icon ${icon}`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500">Selected: <span className="text-2xl align-middle">{formData.icon_url}</span></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                      className="mr-2"
                    />
                    <span>{formData.is_active ? "Active" : "Inactive"}</span>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingAchievement(null);
                      setErrors({});
                      setNameError('');
                      setFormData({
                        name: "",
                        description: "",
                        icon_url: "🏆",
                        points_required: 0,
                        category: "streak",
                        is_active: true,
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
                    {editingAchievement ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Achievements List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points Required</th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {achievements.map((achievement) => (
                  <tr key={achievement.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-2xl mr-2">{achievement.icon_url}</span>
                      <span className="font-medium text-gray-900">{achievement.name}</span>
                      <div className="text-xs text-gray-500">{achievement.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{achievement.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{achievement.points_required}</td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        achievement.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {achievement.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(achievement)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(achievement.id)}
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
  );
} 