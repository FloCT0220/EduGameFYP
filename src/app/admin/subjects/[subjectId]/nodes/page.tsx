"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

interface Topic {
  id: number;
  course_id: number;
  title: string;
  content: string;
  lesson_order: number;
  points_reward: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminCourseTopics() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.subjectId;

  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTopics = useCallback(async () => {
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
  }, [courseId]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

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
          <a
            href={`/admin/subjects/${courseId}/nodes/add`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Topic
          </a>
        </div>

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
                      <a
                        href={`/admin/subjects/${courseId}/nodes/add?id=${topic.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </a>
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
            <a
              href={`/admin/subjects/${courseId}/nodes/add`}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create your first topic
            </a>
          </div>
        )}
      </div>
    </div>
  );
} 