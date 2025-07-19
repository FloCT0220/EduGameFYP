'use client';

import { useEffect, useState } from 'react';

interface Course {
  id: number;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_active: boolean;
  enrolled_count: number;
}

// Define a type for difficulty


export default function AdminSubjects() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);


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
            <a
              href="/admin/subjects/add"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Course
            </a>
          </div>



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
                     <a
                       href={`/admin/subjects/add?id=${course.id}`}
                       className="text-blue-600 hover:text-blue-800"
                     >
                       Edit
                     </a>
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
                

              </div>
            ))}
          </div>

          {courses.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No courses found</div>
              <a
                href="/admin/subjects/add"
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create your first course
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 