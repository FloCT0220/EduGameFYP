'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { FaArrowLeft, FaSave } from 'react-icons/fa';

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



export default function AddEditTopicPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params.subjectId;
  const topicId = searchParams.get('id');
  const isEditing = !!topicId;

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    lesson_order: 1,
    points_reward: 10,
    is_published: true,
  });
  const [structuredContent, setStructuredContent] = useState<ContentSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoadingTopic, setIsLoadingTopic] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [titleError, setTitleError] = useState('');
  const [isCheckingTitle, setIsCheckingTitle] = useState(false);
  const [titleCheckTimeout, setTitleCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  // Function to scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchTopics = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/subjects/${courseId}/topics`);
      const data = await response.json();
      setTopics(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching topics:", error);
      setTopics([]);
    }
  }, [courseId]);

    const fetchTopic = useCallback(async () => {
    setIsLoadingTopic(true);
    try {
      const response = await fetch(`/api/admin/subjects/${courseId}/topics/${topicId}`);
      if (response.ok) {
        const topic = await response.json();
        setFormData({
          title: topic.title,
          content: topic.content || "",
          lesson_order: topic.lesson_order,
          points_reward: topic.points_reward,
          is_published: topic.is_published,
        });
        
        // Load structured content if available, otherwise start with empty array
        if (topic.structured_content && topic.structured_content !== null) {
          try {
            // Parse the JSON string if it's a string
            const parsedContent = typeof topic.structured_content === 'string' 
              ? JSON.parse(topic.structured_content) 
              : topic.structured_content;
            
            // Handle both formats: { sections: [...] } and direct array [...]
            if (parsedContent && parsedContent.sections && Array.isArray(parsedContent.sections)) {
              setStructuredContent(parsedContent.sections);
            } else if (Array.isArray(parsedContent)) {
              // Direct array format
              setStructuredContent(parsedContent);
            } else {
              setStructuredContent([]);
            }
          } catch (error) {
            console.error('Error parsing structured content:', error);
            setStructuredContent([]);
          }
        } else {
          setStructuredContent([]);
        }
      } else {
        setError('Failed to fetch topic data');
        scrollToTop();
      }
    } catch (error) {
      console.error('Error fetching topic:', error);
      setError('Failed to fetch topic data');
      scrollToTop();
    } finally {
      setIsLoadingTopic(false);
    }
  }, [courseId, topicId]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  useEffect(() => {
    if (isEditing && topicId) {
      fetchTopic();
    }
  }, [fetchTopic, isEditing, topicId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (titleCheckTimeout) {
        clearTimeout(titleCheckTimeout);
      }
    };
  }, [titleCheckTimeout]);

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

  const checkTitleAvailability = useCallback(async (title: string) => {
    if (!title.trim()) {
      setTitleError('');
      return;
    }

    setIsCheckingTitle(true);
    try {
      const response = await fetch(`/api/admin/subjects/${courseId}/topics`);
      if (response.ok) {
        const topicsData = await response.json();
        const existingTopic = topicsData.find((topic: { id: number; title: string }) => 
          topic.title.toLowerCase() === title.toLowerCase() && 
          (!isEditing || topic.id !== parseInt(topicId!))
        );
        
        if (existingTopic) {
          setTitleError('A topic with this title already exists in this course');
        } else {
          setTitleError('');
        }
      }
    } catch (error) {
      console.error('Error checking title availability:', error);
    } finally {
      setIsCheckingTitle(false);
    }
  }, [courseId, isEditing, topicId]);

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
    
    // Prevent submission if there's a title error
    if (titleError) {
      setError('Please fix the title error before submitting');
      scrollToTop();
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validate lesson order uniqueness for editing
    if (isEditing && isLessonOrderTaken(formData.lesson_order, parseInt(topicId!))) {
      setError(`Lesson order ${formData.lesson_order} is already taken by another topic in this course.`);
      scrollToTop();
      setIsLoading(false);
      return;
    }

    try {
      const url = isEditing
        ? `/api/admin/subjects/${courseId}/topics/${topicId}`
        : `/api/admin/subjects/${courseId}/topics`;
      const method = isEditing ? "PUT" : "POST";
      
      // For new topics, use auto-generated lesson order
      const submitData = {
        ...formData,
        lesson_order: isEditing ? formData.lesson_order : getNextLessonOrder(),
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
        setSuccess(isEditing ? 'Topic updated successfully!' : 'Topic created successfully!');
        setTimeout(() => {
          router.push(`/admin/subjects/${courseId}/nodes`);
        }, 1500);
      } else {
        setError(result.error || 'An error occurred while saving the topic');
        scrollToTop();
      }
    } catch (error) {
      console.error("Error saving topic:", error);
      setError('An error occurred while saving the topic');
      scrollToTop();
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    if (error) setError('');
    if (success) setSuccess('');
    
    // Check title availability when title changes
    if (name === 'title') {
      setTitleError('');
      if (value.trim()) {
        // Clear existing timeout
        if (titleCheckTimeout) {
          clearTimeout(titleCheckTimeout);
        }
        // Set new timeout
        const timeoutId = setTimeout(() => checkTitleAvailability(value), 500);
        setTitleCheckTimeout(timeoutId);
      }
    }
  };

  if (isLoadingTopic) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading topic data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push(`/admin/subjects/${courseId}/nodes`)}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mb-4"
            >
              <FaArrowLeft className="mr-2" />
              Back to Topics
            </button>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-md p-8">
            {/* Form Header */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                {isEditing ? 'Edit Topic' : 'Add New Topic'}
              </h2>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Topic Title *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      titleError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter topic title"
                  />
                  {isCheckingTitle && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                {titleError && (
                  <p className="mt-1 text-sm text-red-600">{titleError}</p>
                )}
              </div>

              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Topic Content
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter the main content for this topic..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is the main content that will be displayed to students. You can also add structured sections below.
                </p>
              </div>

              {/* Content Sections Editor */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Content Sections *
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
                {isEditing && (
                  <div>
                    <label htmlFor="lesson_order" className="block text-sm font-medium text-gray-700 mb-2">
                      Lesson Order *
                    </label>
                    <input
                      type="number"
                      id="lesson_order"
                      name="lesson_order"
                      value={formData.lesson_order}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      min="1"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Must be unique within this course
                    </p>
                  </div>
                )}

                {/* Show auto-generated lesson order for new topics */}
                {!isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lesson Order
                    </label>
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                      {getNextLessonOrder()} (auto-generated)
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Automatically assigned as the next available order
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="points_reward" className="block text-sm font-medium text-gray-700 mb-2">
                    Points Reward *
                  </label>
                  <input
                    type="number"
                    id="points_reward"
                    name="points_reward"
                    value={formData.points_reward}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Published Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_published"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="is_published" className="ml-2 text-sm text-gray-700">
                  Published (visible to students)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push(`/admin/subjects/${courseId}/nodes`)}
                  className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      {isEditing ? 'Update Topic' : 'Create Topic'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 