"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface ContentSection {
  title: string;
  content: string;
}

interface StructuredContent {
  sections: ContentSection[];
}

interface Topic {
  id: number;
  course_id: number;
  title: string;
  content: string;
  structured_content?: StructuredContent;
  lesson_order: number;
  points_reward: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const defaultSections: ContentSection[] = [
  {
    title: "Introduction",
    content: "Welcome to this lesson! In this topic, we'll explore the fundamental concepts and practical applications."
  },
  {
    title: "Key Concepts",
    content: "Let's dive into the core principles that make this topic important in modern development."
  },
  {
    title: "Practical Examples",
    content: "Here are some real-world examples of how this topic is used in professional development environments."
  },
  {
    title: "Best Practices",
    content: "To master this topic, follow these industry-standard best practices and guidelines."
  },
  {
    title: "Summary",
    content: "You've now learned the essential concepts. Take the quiz below to test your understanding and earn points!"
  }
];

export default function AdminCourseTopics() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.subjectId; // Keep the URL param name for compatibility

  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [error, setError] = useState<string>("");
  const [structuredContent, setStructuredContent] = useState<ContentSection[]>(defaultSections);
  const [formData, setFormData] = useState({
    title: "",
    lesson_order: 1,
    points_reward: 10,
    is_published: true,
  });

  useEffect(() => {
    fetchTopics();
  }, [courseId]);

  const fetchTopics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/subjects/${courseId}/topics`);
      const data = await response.json();
      setTopics(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching topics:", error);
      setTopics([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate the next lesson order
  const getNextLessonOrder = () => {
    if (topics.length === 0) return 1;
    const maxOrder = Math.max(...topics.map(t => t.lesson_order));
    return maxOrder + 1;
  };

  // Validate lesson order uniqueness within the course
  const isLessonOrderTaken = (order: number, excludeTopicId?: number) => {
    return topics.some(topic => 
      topic.lesson_order === order && 
      (!excludeTopicId || topic.id !== excludeTopicId)
    );
  };

  const handleSectionChange = (index: number, field: 'title' | 'content', value: string) => {
    const updatedSections = [...structuredContent];
    updatedSections[index] = { ...updatedSections[index], [field]: value };
    setStructuredContent(updatedSections);
  };

  const addSection = () => {
    setStructuredContent([...structuredContent, { title: "New Section", content: "" }]);
  };

  const removeSection = (index: number) => {
    if (structuredContent.length > 1) {
      const updatedSections = structuredContent.filter((_, i) => i !== index);
      setStructuredContent(updatedSections);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate lesson order uniqueness for editing
    if (editingTopic && isLessonOrderTaken(formData.lesson_order, editingTopic.id)) {
      setError(`Lesson order ${formData.lesson_order} is already taken by another topic in this course.`);
      return;
    }

    try {
      const url = editingTopic
        ? `/api/admin/subjects/${courseId}/topics/${editingTopic.id}`
        : `/api/admin/subjects/${courseId}/topics`;
      const method = editingTopic ? "PUT" : "POST";
      
      // For new topics, use auto-generated lesson order
      const submitData = {
        ...formData,
        lesson_order: editingTopic ? formData.lesson_order : getNextLessonOrder(),
        course_id: parseInt(courseId as string),
        structured_content: { sections: structuredContent }
      };
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setShowForm(false);
        setEditingTopic(null);
        setError("");
        resetForm();
        fetchTopics();
      } else {
        setError(result.error || "Failed to save topic");
      }
    } catch (error) {
      console.error("Error saving topic:", error);
      setError("An error occurred while saving the topic");
    }
  };

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setFormData({
      title: topic.title,
      lesson_order: topic.lesson_order,
      points_reward: topic.points_reward,
      is_published: topic.is_published,
    });
    
    // Load structured content if available, otherwise use defaults
    if (topic.structured_content && topic.structured_content.sections) {
      setStructuredContent(topic.structured_content.sections);
    } else {
      setStructuredContent(defaultSections);
    }
    
    setShowForm(true);
    setError("");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this topic?")) return;
    try {
      const response = await fetch(`/api/admin/subjects/${courseId}/topics/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchTopics();
      }
    } catch (error) {
      console.error("Error deleting topic:", error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTopic(null);
    setError("");
    setStructuredContent(defaultSections);
    setFormData({
      title: "",
      lesson_order: 1,
      points_reward: 10,
      is_published: true,
    });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => router.push('/admin/subjects')}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
            >
              ← Back to Courses
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Manage Course Topics</h1>
            <p className="text-gray-600 mt-2">
              Topics are automatically numbered in sequence. You can edit the order after creation.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Topic
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {editingTopic ? "Edit Topic" : "Add Topic"}
              </h2>
              
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  {/* Content Sections Editor */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Content Sections
                      </label>
                      <button
                        type="button"
                        onClick={addSection}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Add Section
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {structuredContent.map((section, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-600">
                              Section {index + 1}
                            </span>
                            {structuredContent.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSection(index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Section Title
                              </label>
                              <input
                                type="text"
                                value={section.title}
                                onChange={e => handleSectionChange(index, 'title', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                placeholder="Section title"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Section Content
                              </label>
                              <textarea
                                value={section.content}
                                onChange={e => handleSectionChange(index, 'content', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                rows={3}
                                placeholder="Section content..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-2">
                      Content will be automatically formatted with enhanced styling for students.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Show lesson order field only when editing */}
                    {editingTopic && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lesson Order
                        </label>
                        <input
                          type="number"
                          value={formData.lesson_order}
                          onChange={e => setFormData({ ...formData, lesson_order: parseInt(e.target.value) })}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          min="1"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Must be unique within this course
                        </p>
                      </div>
                    )}

                    {/* Show auto-generated lesson order for new topics */}
                    {!editingTopic && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lesson Order
                        </label>
                        <div className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                          {getNextLessonOrder()} (auto-generated)
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Automatically assigned as the next available order
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Points Reward
                      </label>
                      <input
                        type="number"
                        value={formData.points_reward || ''}
                        onChange={e => setFormData({ ...formData, points_reward: parseInt(e.target.value) || 0 })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_published"
                      checked={formData.is_published}
                      onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="is_published" className="ml-2 text-sm text-gray-700">
                      Published (visible to students)
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingTopic ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Topics List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Topic
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
                {topics
                  .sort((a, b) => a.lesson_order - b.lesson_order)
                  .map((topic) => (
                  <tr key={topic.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {topic.lesson_order}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {topic.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {topic.structured_content && topic.structured_content.sections ? (
                          <span>
                            {topic.structured_content.sections.length} sections
                          </span>
                        ) : (
                          <span className="text-gray-400">No content</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {topic.points_reward} pts
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        topic.is_published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {topic.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(topic)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(topic.id)}
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

        {topics.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No topics found</div>
            <p className="text-gray-400 mb-4">Create your first topic to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create your first topic
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 