'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';



interface Course {
  id: number;
  title: string;
  description: string;
  difficulty_level: string;
  is_published: boolean;
}

interface Topic {
  id: number;
  course_id: number;
  title: string;
  lesson_order: number;
  is_published: boolean;
}

interface FormData {
  subject_id: number;
  node_id: number;
  question: string;
  answers: string[];
  correct_answer: number;
  points: number;
  difficulty: string;
}

const initialFormData: FormData = {
  subject_id: 0,
  node_id: 0,
  question: '',
  answers: ['', '', '', ''],
  correct_answer: 0,
  points: 10,
  difficulty: 'easy'
};

export default function AddEditQuizQuestion() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);

  useEffect(() => {
    fetchCourses();
    if (editId) {
      setIsEdit(true);
      fetchQuestion(parseInt(editId));
    }
  }, [editId]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/quiz/courses');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchTopics = async (courseId: number) => {
    if (!courseId) {
      setTopics([]);
      return;
    }
    
    setLoadingTopics(true);
    try {
      const response = await fetch(`/api/admin/quiz/topics?courseId=${courseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch topics');
      }
      const data = await response.json();
      setTopics(data);
    } catch (error) {
      console.error('Error fetching topics:', error);
      setTopics([]);
    } finally {
      setLoadingTopics(false);
    }
  };

  const fetchQuestion = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/quiz/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch question');
      }
      const question = await response.json();
      
      setFormData({
        subject_id: question.subject_id,
        node_id: question.node_id,
        question: question.question,
        answers: question.answers || ['', '', '', ''],
        correct_answer: question.correct_answer,
        points: question.points,
        difficulty: question.difficulty
      });

      // Fetch topics for the selected course
      if (question.subject_id) {
        await fetchTopics(question.subject_id);
      }
    } catch (error) {
      console.error('Error fetching question:', error);
      alert('Failed to load question data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate that all answers are filled
      if (formData.answers.some(answer => !answer.trim())) {
        alert('Please fill in all answer options');
        return;
      }

      const url = isEdit ? `/api/admin/quiz/${editId}` : '/api/admin/quiz';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject_id: formData.subject_id,
          node_id: formData.node_id,
          question: formData.question,
          answers: formData.answers,
          correct_answer: formData.correct_answer,
          points: formData.points,
          difficulty: formData.difficulty
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(isEdit ? 'Question updated successfully!' : 'Question created successfully!');
        router.push('/admin/quizzes');
      } else {
        console.error('Error saving question:', result.error);
        alert('Failed to save question');
      }
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...formData.answers];
    newAnswers[index] = value;
    setFormData({ ...formData, answers: newAnswers });
  };

  const handleCourseChange = (courseId: number) => {
    setFormData({ ...formData, subject_id: courseId, node_id: 0 });
    fetchTopics(courseId);
  };

  const handleCancel = () => {
    router.push('/admin/quizzes');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Quiz Question' : 'Add New Quiz Question'}
          </h1>
          <button
            onClick={handleCancel}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject and Topic Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <select
                  value={formData.subject_id}
                  onChange={(e) => handleCourseChange(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loadingCourses}
                >
                  <option value={0}>Select a subject...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic
                </label>
                <select
                  value={formData.node_id}
                  onChange={(e) => setFormData({...formData, node_id: parseInt(e.target.value)})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loadingTopics || formData.subject_id === 0}
                >
                  <option value={0}>Select a topic...</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question
              </label>
              <textarea
                value={formData.question}
                onChange={(e) => setFormData({...formData, question: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                required
                placeholder="Enter your question here..."
              />
            </div>

            {/* Answer Options */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Answer Options
              </label>
              {formData.answers.map((answer, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                    {String.fromCharCode(65 + index)} {/* A, B, C, D */}
                  </div>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  />
                  <input
                    type="radio"
                    name="correct_answer"
                    value={index}
                    checked={formData.correct_answer === index}
                    onChange={(e) => setFormData({...formData, correct_answer: parseInt(e.target.value)})}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Correct</span>
                </div>
              ))}
            </div>

            {/* Points and Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points
                </label>
                <input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : (isEdit ? 'Update Question' : 'Add Question')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 