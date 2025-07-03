"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface SkillNode {
  id: number;
  node_id: string;
  title: string;
  description: string;
  level: number;
  position_x: number;
  position_y: number;
  points: number;
  difficulty: "foundation" | "intermediate" | "advanced";
  estimated_time: string;
  type: "lesson" | "quiz" | "project";
  content_url: string;
  icon: string;
  is_active: boolean;
}

type Difficulty = "foundation" | "intermediate" | "advanced";
type NodeType = "lesson" | "quiz" | "project";

export default function AdminSkillNodes() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params.subjectId;

  const [nodes, setNodes] = useState<SkillNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNode, setEditingNode] = useState<SkillNode | null>(null);
  const [formData, setFormData] = useState({
    node_id: "",
    title: "",
    description: "",
    level: 1,
    position_x: 0,
    position_y: 0,
    points: 0,
    difficulty: "foundation" as Difficulty,
    estimated_time: "1h",
    type: "lesson" as NodeType,
    content_url: "",
    icon: "📘",
    is_active: true,
  });

  useEffect(() => {
    fetchNodes();
  }, [subjectId]);

  const fetchNodes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/subjects/${subjectId}/nodes`);
      const data = await response.json();
      setNodes(Array.isArray(data) ? data : data.nodes || []);
    } catch (error) {
      console.error("Error fetching nodes:", error);
      setNodes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingNode
        ? `/api/admin/subjects/${subjectId}/nodes/${editingNode.id}`
        : `/api/admin/subjects/${subjectId}/nodes`;
      const method = editingNode ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setShowForm(false);
        setEditingNode(null);
        setFormData({
          node_id: "",
          title: "",
          description: "",
          level: 1,
          position_x: 0,
          position_y: 0,
          points: 0,
          difficulty: "foundation",
          estimated_time: "1h",
          type: "lesson",
          content_url: "",
          icon: "📘",
          is_active: true,
        });
        fetchNodes();
      }
    } catch (error) {
      console.error("Error saving node:", error);
    }
  };

  const handleEdit = (node: SkillNode) => {
    setEditingNode(node);
    setFormData({
      node_id: node.node_id,
      title: node.title,
      description: node.description,
      level: node.level,
      position_x: node.position_x,
      position_y: node.position_y,
      points: node.points,
      difficulty: node.difficulty as Difficulty,
      estimated_time: node.estimated_time,
      type: node.type as NodeType,
      content_url: node.content_url,
      icon: node.icon,
      is_active: node.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this node?")) return;
    try {
      const response = await fetch(`/api/admin/subjects/${subjectId}/nodes/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchNodes();
      }
    } catch (error) {
      console.error("Error deleting node:", error);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Topic Nodes</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Node
          </button>
        </div>
        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {editingNode ? "Edit Node" : "Add Node"}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Node ID</label>
                    <input
                      type="text"
                      value={formData.node_id}
                      onChange={e => setFormData({ ...formData, node_id: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
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
                  <div className="md:col-span-2">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                    <input
                      type="number"
                      value={formData.level}
                      onChange={e => setFormData({ ...formData, level: parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      min={1}
                      max={5}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                    <input
                      type="number"
                      value={formData.points}
                      onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      min={0}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={e => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="foundation">Foundation</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time</label>
                    <input
                      type="text"
                      value={formData.estimated_time}
                      onChange={e => setFormData({ ...formData, estimated_time: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="e.g. 1h, 30min"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as NodeType })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="lesson">Lesson</option>
                      <option value="quiz">Quiz</option>
                      <option value="project">Project</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content URL</label>
                    <input
                      type="text"
                      value={formData.content_url}
                      onChange={e => setFormData({ ...formData, content_url: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={e => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="📘"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <span>Active</span>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingNode(null);
                      setFormData({
                        node_id: "",
                        title: "",
                        description: "",
                        level: 1,
                        position_x: 0,
                        position_y: 0,
                        points: 0,
                        difficulty: "foundation",
                        estimated_time: "1h",
                        type: "lesson",
                        content_url: "",
                        icon: "📘",
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
                    {editingNode ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Nodes List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Node ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {nodes.map((node) => (
                  <tr key={node.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{node.node_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{node.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{node.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{node.level}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{node.points}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        node.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {node.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(node)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(node.id)}
                        className="text-red-600 hover:text-red-900 mr-3"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => router.push(`/admin/subjects/${subjectId}/nodes/${node.id}/prerequisites`)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Prerequisites
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