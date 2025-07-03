"use client";

import { useEffect, useState } from "react";

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  type: "streak" | "points" | "completion" | "speed" | "accuracy" | "level";
  requirement_value: number;
  points_reward: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  is_active: boolean;
}

// Define types for AchievementType and Rarity
type AchievementType = "streak" | "points" | "completion" | "speed" | "accuracy" | "level";
type Rarity = "common" | "rare" | "epic" | "legendary";

export default function AdminAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "🏆",
    type: "streak" as AchievementType,
    requirement_value: 1,
    points_reward: 0,
    rarity: "common" as Rarity,
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
          title: "",
          description: "",
          icon: "🏆",
          type: "streak",
          requirement_value: 1,
          points_reward: 0,
          rarity: "common",
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
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      type: achievement.type as AchievementType,
      requirement_value: achievement.requirement_value,
      points_reward: achievement.points_reward,
      rarity: achievement.rarity as Rarity,
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={e => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="🏆"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as AchievementType })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="streak">Streak</option>
                      <option value="points">Points</option>
                      <option value="completion">Completion</option>
                      <option value="speed">Speed</option>
                      <option value="accuracy">Accuracy</option>
                      <option value="level">Level</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requirement Value</label>
                    <input
                      type="number"
                      value={formData.requirement_value}
                      onChange={e => setFormData({ ...formData, requirement_value: parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      min={1}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Points Reward</label>
                    <input
                      type="number"
                      value={formData.points_reward}
                      onChange={e => setFormData({ ...formData, points_reward: parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      min={0}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rarity</label>
                    <select
                      value={formData.rarity}
                      onChange={e => setFormData({ ...formData, rarity: e.target.value as Rarity })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="common">Common</option>
                      <option value="rare">Rare</option>
                      <option value="epic">Epic</option>
                      <option value="legendary">Legendary</option>
                    </select>
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
                        title: "",
                        description: "",
                        icon: "🏆",
                        type: "streak",
                        requirement_value: 1,
                        points_reward: 0,
                        rarity: "common",
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rarity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {achievements.map((achievement) => (
                  <tr key={achievement.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-2xl mr-2">{achievement.icon}</span>
                      <span className="font-medium text-gray-900">{achievement.title}</span>
                      <div className="text-xs text-gray-500">{achievement.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{achievement.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{achievement.requirement_value}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{achievement.points_reward}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        achievement.rarity === "common"
                          ? "bg-gray-100 text-gray-800"
                          : achievement.rarity === "rare"
                          ? "bg-blue-100 text-blue-800"
                          : achievement.rarity === "epic"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {achievement.rarity}
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