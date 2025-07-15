"use client";

import { useEffect, useState } from "react";

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon_url: string;
  badge_color: string;
  points_required: number;
  category: string;
  is_active: boolean;
  created_at?: string;
}

// Define types for Category and BadgeColor
type Category = "streak" | "points" | "completion" | "speed" | "accuracy" | "level";
type BadgeColor = "blue" | "green" | "purple" | "yellow" | "red";

export default function AdminAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon_url: "🏆",
    badge_color: "blue" as BadgeColor,
    points_required: 0,
    category: "streak" as Category,
    is_active: true,
  });

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAchievement
        ? `/api/admin/achievements/${editingAchievement.id}`
        : "/api/admin/achievements";
      const method = editingAchievement ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setShowForm(false);
        setEditingAchievement(null);
        setFormData({
          name: "",
          description: "",
          icon_url: "🏆",
          badge_color: "blue",
          points_required: 0,
          category: "streak",
          is_active: true,
        });
        fetchAchievements();
      }
    } catch (error) {
      console.error("Error saving achievement:", error);
    }
  };

  const handleEdit = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    setFormData({
      name: achievement.name,
      description: achievement.description,
      icon_url: achievement.icon_url,
      badge_color: achievement.badge_color as BadgeColor,
      points_required: achievement.points_required,
      category: achievement.category as Category,
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
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      rows={2}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value as Category })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="points">Points</option>
                      <option value="level">Level</option>
                      <option value="streak">Streak</option>
                      <option value="completion">Completion (Quizzes)</option>
                      <option value="topics">Topics</option>
                      <option value="courses">Courses</option>
                      <option value="challenges">Challenges</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Points Required</label>
                    <input
                      type="number"
                      value={formData.points_required}
                      onChange={e => setFormData({ ...formData, points_required: parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      min={0}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Badge Color</label>
                    <select
                      value={formData.badge_color}
                      onChange={e => setFormData({ ...formData, badge_color: e.target.value as BadgeColor })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="purple">Purple</option>
                      <option value="yellow">Yellow</option>
                      <option value="red">Red</option>
                    </select>
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
                      setFormData({
                        name: "",
                        description: "",
                        icon_url: "🏆",
                        badge_color: "blue",
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Badge Color</th>
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
                        achievement.badge_color === "blue"
                          ? "bg-blue-100 text-blue-800"
                          : achievement.badge_color === "green"
                          ? "bg-green-100 text-green-800"
                          : achievement.badge_color === "purple"
                          ? "bg-purple-100 text-purple-800"
                          : achievement.badge_color === "yellow"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {achievement.badge_color}
                      </span>
                    </td>
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